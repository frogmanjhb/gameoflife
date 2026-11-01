import type { Response } from 'express';
import type { PoolClient } from 'pg';
import database from '../../database/database-prod';
import type { AuthenticatedRequest } from '../../middleware/auth';
import type { User } from '../../types';
import { mulberry, RULES, CONFIG } from './shared';
import type { ProfessionId } from './shared';
import type { TownClass } from './types';

const TOWN_CLASSES: TownClass[] = ['6A', '6B', '6C'];

export function isTownClass(v: unknown): v is TownClass {
  return typeof v === 'string' && (TOWN_CLASSES as string[]).includes(v);
}

export function displayNameForUser(user: Pick<User, 'first_name' | 'last_name' | 'username'>): string {
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return user.username;
}

export async function tablesReady(): Promise<boolean> {
  try {
    await database.query('SELECT 1 FROM gor_worlds LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

export async function requireApprovedStudentWithRules(req: AuthenticatedRequest, res: Response): Promise<User | null> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  if (req.user.role !== 'student') {
    res.status(403).json({ error: 'Only students can use this endpoint.' });
    return null;
  }
  if ((req.user as User & { status?: string }).status === 'pending') {
    res.status(403).json({ error: 'Your account is still waiting for teacher approval.' });
    return null;
  }
  const row = await database.get('SELECT rules_agreed_at FROM users WHERE id = $1', [req.user.id]);
  if (!row?.rules_agreed_at) {
    res.status(403).json({ error: 'You must agree to Town Rules before using Game of Resources.' });
    return null;
  }
  if (!req.schoolId) {
    res.status(403).json({ error: 'School context required' });
    return null;
  }
  if (!isTownClass(req.user.class)) {
    res.status(400).json({ error: 'Your account has no valid town class.' });
    return null;
  }
  return req.user;
}

export function resolveStudentTown(user: User): TownClass {
  return user.class as TownClass;
}

export function resolveTeacherTown(req: AuthenticatedRequest, res: Response): TownClass | null {
  const q = req.query.town_class ?? req.body?.town_class;
  if (!isTownClass(q)) {
    res.status(400).json({ error: 'Choose a town class: 6A, 6B, or 6C.' });
    return null;
  }
  return q;
}

export async function loadDisplayNameMap(
  client: PoolClient,
  schoolId: number,
  townClass: TownClass
): Promise<Map<number, string>> {
  const res = await client.query(
    `SELECT id, username, first_name, last_name FROM users
     WHERE school_id = $1 AND class = $2 AND role = 'student'`,
    [schoolId, townClass]
  );
  const map = new Map<number, string>();
  for (const row of res.rows) {
    map.set(row.id, displayNameForUser(row));
  }
  return map;
}

export function generateNickname(userId: number, worldSeed: number): string {
  const rng = mulberry(worldSeed ^ userId);
  const ADJ = ['Swift', 'Quiet', 'Brave', 'Clever', 'Bright', 'Calm', 'Kind', 'Steady', 'Bold', 'Gentle'];
  const NOUN = ['Heron', 'Baobab', 'Kudu', 'Protea', 'Eland', 'Hornbill', 'Marula', 'Springbok', 'Weaver', 'Leopard'];
  return `${ADJ[Math.floor(rng() * ADJ.length)]} ${NOUN[Math.floor(rng() * NOUN.length)]}`;
}

export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

export function jobChangeOptsFromSettings(settings: { jobChange?: { xpCost?: number; perRound?: number; xpSource?: string } }) {
  const jc = settings?.jobChange ?? {};
  return {
    xpCost: jc.xpCost ?? CONFIG.jobChange.xpCost,
    perRound: jc.perRound ?? CONFIG.jobChange.perRound,
    xpSource: (jc.xpSource ?? CONFIG.jobChange.xpSource) as 'game' | 'civiclab',
  };
}

export function isProfessionId(v: unknown): v is ProfessionId {
  return typeof v === 'string' && v in CONFIG.professions;
}

export async function requireStudentInTown(
  client: PoolClient,
  schoolId: number,
  townClass: TownClass,
  userId: number,
  res: Response
): Promise<boolean> {
  const row = await client.query(
    `SELECT id FROM users WHERE id = $1 AND school_id = $2 AND class = $3 AND role = 'student' LIMIT 1`,
    [userId, schoolId, townClass]
  );
  if (!row.rows.length) {
    res.status(404).json({ error: 'That student is not in this town class.' });
    return false;
  }
  return true;
}

export async function requireTeacherForSchool(
  req: AuthenticatedRequest,
  res: Response
): Promise<User | null> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  if (req.user.role !== 'teacher') {
    res.status(403).json({ error: 'Only teachers can use this endpoint.' });
    return null;
  }
  const schoolId = req.schoolId ?? req.user.school_id;
  if (schoolId == null) {
    res.status(403).json({ error: 'School context required' });
    return null;
  }
  return req.user;
}

export function schoolIdFromRequest(req: AuthenticatedRequest): number {
  const id = req.schoolId ?? req.user?.school_id;
  if (id == null) throw new Error('School context required');
  return id;
}
