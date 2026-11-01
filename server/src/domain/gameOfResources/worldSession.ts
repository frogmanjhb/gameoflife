import type { PoolClient } from 'pg';
import database from '../../database/database-prod';
import { CONFIG, RULES, mulberry } from './shared';
import type { GameState, ProfessionId } from './shared';
import {
  citizenIdForUser,
  ensureCitizen,
  getOrCreateWorldLocked,
  saveWorldState,
} from './worldRepository';
import type { LockedWorldBundle, GorCitizenRow, GorWorldRow } from './types';
import { buildPlayerView } from './view';
import {
  generateNickname,
  loadDisplayNameMap,
} from './access';
import type { TownClass } from './types';
import { notifyWorldVersion } from './liveUpdates';
import type { GameplayResult } from './actions';
import { persistAdvanceSummary } from './actions';
import { parseGorAvatar } from './avatar';

export type StatusPayload = {
  view: ReturnType<typeof buildPlayerView>;
  firstVisit: boolean;
  assignedProfession?: ProfessionId;
  assignedProfessionName?: string;
};

export async function withWorldTransaction<T>(
  schoolId: number,
  townClass: TownClass,
  fn: (client: PoolClient, bundle: LockedWorldBundle) => Promise<T>
): Promise<T> {
  const client = await database.getClient();
  try {
    await client.query('BEGIN');
    const bundle = await getOrCreateWorldLocked(client, schoolId, townClass);
    const result = await fn(client, bundle);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function ensureStudentCitizen(
  client: PoolClient,
  bundle: LockedWorldBundle,
  userId: number,
  displayName: string
): Promise<{ bundle: LockedWorldBundle; firstVisit: boolean; profession?: ProfessionId; dirty: boolean }> {
  const had = bundle.citizenRows.some((c: GorCitizenRow) => c.user_id === userId);
  if (had) {
    const c = bundle.state.citizens.find((x: GameState['citizens'][0]) => x.id === citizenIdForUser(userId));
    if (c && c.lastActiveRound !== bundle.row.round_number) {
      c.lastActiveRound = bundle.row.round_number;
      await client.query(
        `UPDATE gor_citizens SET last_active_round = $1 WHERE world_id = $2 AND user_id = $3`,
        [bundle.row.round_number, bundle.row.id, userId]
      );
      const row = bundle.citizenRows.find((r) => r.user_id === userId);
      if (row) row.last_active_round = bundle.row.round_number;
    }
    return { bundle, firstVisit: false, dirty: false };
  }
  const useNick = !!bundle.row.settings.useNicknames;
  const nickname = useNick ? generateNickname(userId, bundle.row.seed) : null;
  const prof = RULES.autoAssignProfession(bundle.state, mulberry(bundle.row.seed ^ userId)) as ProfessionId;
  bundle = await ensureCitizen(client, bundle, userId, {
    profession: prof,
    nickname,
    displayName: useNick && nickname ? nickname : displayName,
  });
  return { bundle, firstVisit: true, profession: prof, dirty: true };
}

export async function buildStatusForStudent(
  client: PoolClient,
  bundle: LockedWorldBundle,
  userId: number,
  displayName: string
): Promise<StatusPayload> {
  const ensured = await ensureStudentCitizen(client, bundle, userId, displayName);
  bundle = ensured.bundle;
  if (ensured.dirty) {
    await saveWorldState(client, bundle, bundle.state, { expectedVersion: bundle.row.version });
  }
  const nameMap = await loadDisplayNameMap(client, bundle.row.school_id, bundle.row.town_class);
  const avatarByUser = new Map(
    bundle.citizenRows.map((r) => [r.user_id, parseGorAvatar(r.avatar, r.profession)])
  );
  const view = buildPlayerView({
    row: bundle.row,
    state: bundle.state,
    viewerUserId: userId,
    displayNameForUser: (id) => nameMap.get(id) ?? `Student ${id}`,
    useNicknames: !!bundle.row.settings.useNicknames,
    getAvatar: (uid, prof) =>
      avatarByUser.get(uid) ?? parseGorAvatar(undefined, prof as import('./shared').ProfessionId),
  });
  return {
    view,
    firstVisit: ensured.firstVisit,
    assignedProfession: ensured.profession,
    assignedProfessionName: ensured.profession
      ? CONFIG.professions[ensured.profession].name
      : undefined,
  };
}

export async function applyGameplayAndSave(
  client: PoolClient,
  bundle: LockedWorldBundle,
  userId: number,
  gameplay: GameplayResult,
  options?: { advanceSummary?: boolean; roundStartedAt?: Date; roundEndsAt?: Date }
): Promise<{ bundle: LockedWorldBundle; row: GorWorldRow }> {
  if (!gameplay.ok || !gameplay.state) {
    return { bundle, row: bundle.row };
  }
  const prevVersion = bundle.row.version;
  const row = await saveWorldState(client, bundle, gameplay.state, {
    expectedVersion: prevVersion,
    newLogFromSeq: bundle.row.seq + 1,
    roundStartedAt: options?.roundStartedAt,
    roundEndsAt: options?.roundEndsAt,
  });
  if (!row) {
    throw new Error('World version conflict — refresh and try again.');
  }
  if (options?.advanceSummary && gameplay.summary) {
    await persistAdvanceSummary(client, bundle, gameplay.summary);
  }
  notifyWorldVersion(row.id, row.version);
  bundle.row = row;
  return { bundle, row };
}

export async function saveBundleIfDirty(
  client: PoolClient,
  bundle: LockedWorldBundle
): Promise<void> {
  await saveWorldState(client, bundle, bundle.state, { expectedVersion: bundle.row.version });
}
