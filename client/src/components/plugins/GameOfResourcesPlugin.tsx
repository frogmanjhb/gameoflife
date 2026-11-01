import { useCallback, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { ProfessionId } from '@game-of-resources';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { useResourcesWorld, type TeacherPreviewTarget } from '../../hooks/useResourcesWorld';
import GorIconSprite from '../game-of-resources/GorIconSprite';
import GorTopBar from '../game-of-resources/GorTopBar';
import GorCitizenPanel from '../game-of-resources/GorCitizenPanel';
import GorContextPanel from '../game-of-resources/GorContextPanel';
import WorldStage, { type WorldStageHandle } from '../game-of-resources/WorldStage';
import JobChangeDialog, { WelcomeJobCard } from '../game-of-resources/GorDialogs';
import GorAvatarEditor from '../game-of-resources/GorAvatarEditor';
import GorTeacherPanel from '../game-of-resources/GorTeacherPanel';
import type { GorAvatar } from '../../types/gameOfResources';
import { moodCaption as buildMoodCaption } from '../game-of-resources/gorMoodCaption';
import '../game-of-resources/styles.css';

type PreviewCitizen = { userId: number; name: string; professionName: string };

function WorldView({
  teacherPreview,
  readOnly,
  previewTown,
  previewCitizens,
  onExitPreview,
  onSwitchPreview,
}: {
  teacherPreview?: TeacherPreviewTarget | null;
  readOnly?: boolean;
  previewTown?: string;
  previewCitizens?: PreviewCitizen[];
  onExitPreview?: () => void;
  onSwitchPreview?: (userId: number) => void;
}) {
  const {
    view,
    gameState,
    loading,
    error,
    actionError,
    busy,
    liveMessage,
    showWelcome,
    dismissWelcome,
    doAction,
    changeJob,
    storeBuy,
    storeSell,
    requestBankBridge,
    saveAvatar,
  } = useResourcesWorld(true, teacherPreview ?? null);

  const [tab, setTab] = useState('work');
  const [expanded, setExpanded] = useState(false);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [jobOpen, setJobOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [placingAvatar, setPlacingAvatar] = useState(false);
  const worldRef = useRef<WorldStageHandle>(null);

  const handleSelectTile = useCallback((key: string) => {
    setSelectedTile(key);
    setTab('tile');
  }, []);

  if (loading || !view || !gameState) {
    return (
      <div className="p-8 text-center text-gray-600 max-w-lg mx-auto">
        <p>{error || 'Loading the village world…'}</p>
      </div>
    );
  }

  const handleAction = async (id: string, opt: Record<string, unknown> = {}) => {
    if (readOnly) return;
    const ev = await doAction(id, opt);
    if (!view.self || !ev || typeof ev !== 'object') return;
    const e = ev as { citizenId?: string; tileKey?: string | number; workCell?: number };
    const cid = e.citizenId ?? view.self.id;
    let tileKey: string | null = null;
    if (typeof e.tileKey === 'string') tileKey = e.tileKey;
    else if (typeof e.tileKey === 'number') tileKey = `cell:${e.tileKey}`;
    else if (e.workCell != null) tileKey = `cell:${e.workCell}`;
    if (tileKey) worldRef.current?.playAction(cid, tileKey);
  };

  const handleJob = async (prof: ProfessionId) => {
    if (readOnly) return;
    await changeJob(prof);
    setJobOpen(false);
  };

  const switchUserId =
    previewCitizens?.find((c) => c.name === view.self?.name)?.userId ?? previewCitizens?.[0]?.userId;

  return (
    <div className="gor-root">
      <GorIconSprite />
      {readOnly && onExitPreview ? (
        <div className="gor-teacher-preview-bar">
          <span>
            Teacher preview · Town {previewTown} · viewing as <strong>{view.self?.name ?? 'student'}</strong>
          </span>
          {previewCitizens && previewCitizens.length > 1 && onSwitchPreview ? (
            <label className="field gor-preview-switch">
              Switch student
              <select
                value={switchUserId ?? ''}
                onChange={(e) => onSwitchPreview(Number(e.target.value))}
              >
                {previewCitizens.map((c) => (
                  <option key={c.userId} value={c.userId}>
                    {c.name} · {c.professionName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button type="button" className="btn" onClick={onExitPreview}>
            Exit preview
          </button>
        </div>
      ) : null}
      <div className={`game${expanded ? ' expanded' : ''}`} data-light="day">
        <GorTopBar view={view} liveMessage={liveMessage} />
        <div className="main">
          <GorCitizenPanel
            view={view}
            onChangeJob={readOnly ? undefined : () => setJobOpen(true)}
            onRequestBridge={readOnly ? undefined : requestBankBridge}
            bridgeBusy={busy}
            readOnly={readOnly}
          />
          <WorldStage
            ref={worldRef}
            state={gameState}
            moodCaption={buildMoodCaption(gameState)}
            onSelectTile={handleSelectTile}
            onFigureClick={
              readOnly
                ? undefined
                : (cid) => {
                    if (view.self && cid === view.self.id) setAvatarOpen(true);
                  }
            }
            onPlaceFigure={
              readOnly
                ? undefined
                : async (_key, fx, fz) => {
                    const ok = await saveAvatar({ pos: { fx, fz } });
                    if (ok) {
                      setPlacingAvatar(false);
                      worldRef.current?.setPlacingMode(false);
                    }
                  }
            }
            placingMode={placingAvatar}
            onCancelPlacing={
              readOnly
                ? undefined
                : () => {
                    setPlacingAvatar(false);
                    worldRef.current?.setPlacingMode(false);
                  }
            }
            selectedKey={selectedTile}
            expanded={expanded}
            onExpandedChange={setExpanded}
          />
          <GorContextPanel
            view={view}
            gameState={gameState}
            tab={tab}
            selectedTile={selectedTile}
            onTab={setTab}
            onAction={handleAction}
            onStoreBuy={readOnly ? () => {} : (item) => storeBuy(item)}
            onStoreSell={readOnly ? () => {} : (item) => storeSell(item)}
            busy={busy || !!readOnly}
          />
        </div>
      </div>
      {readOnly ? (
        <div className="status" role="status">
          Preview only — assign jobs in the teacher panel. Students play their own accounts.
        </div>
      ) : null}
      {(actionError || error) && !readOnly ? (
        <div className="status" role="status">
          {actionError || error}
        </div>
      ) : null}
      <WelcomeJobCard
        open={!readOnly && showWelcome}
        professionName={view.assignedProfessionName}
        onClose={dismissWelcome}
      />
      {view.self && !readOnly ? (
        <JobChangeDialog
          open={jobOpen}
          self={view.self}
          onClose={() => setJobOpen(false)}
          onConfirm={handleJob}
          busy={busy}
        />
      ) : null}
      {view.self && !readOnly ? (
        <GorAvatarEditor
          open={avatarOpen}
          self={view.self}
          placing={placingAvatar}
          busy={busy}
          onClose={() => {
            setAvatarOpen(false);
            setPlacingAvatar(false);
            worldRef.current?.setPlacingMode(false);
          }}
          onSave={async (patch: Partial<GorAvatar>) => {
            await saveAvatar(patch);
          }}
          onStartPlace={() => {
            setPlacingAvatar(true);
            setAvatarOpen(false);
            worldRef.current?.setPlacingMode(true);
          }}
          onCancelPlace={() => {
            setPlacingAvatar(false);
            worldRef.current?.setPlacingMode(false);
          }}
        />
      ) : null}
    </div>
  );
}

const GameOfResourcesPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user } = useAuth();
  const plugin = plugins.find((p) => p.route_path === '/game-of-resources');
  const enabled = !!plugin?.enabled;
  const isTeacher = user?.role === 'teacher';

  const [teacherOpen, setTeacherOpen] = useState(false);
  const [teacherPreview, setTeacherPreview] = useState<TeacherPreviewTarget | null>(null);
  const [previewRoster, setPreviewRoster] = useState<PreviewCitizen[]>([]);

  if (pluginsLoading) {
    return <div className="p-8 text-center text-gray-600">Loading…</div>;
  }

  if (!plugin?.enabled) {
    return <Navigate to="/" replace />;
  }

  if (isTeacher && teacherPreview) {
    return (
      <WorldView
        teacherPreview={teacherPreview}
        readOnly
        previewTown={teacherPreview.townClass}
        previewCitizens={previewRoster}
        onExitPreview={() => {
          setTeacherPreview(null);
          setPreviewRoster([]);
        }}
        onSwitchPreview={(userId) =>
          setTeacherPreview({ townClass: teacherPreview.townClass, userId })
        }
      />
    );
  }

  if (isTeacher && teacherOpen) {
    return (
      <div className="gor-root" style={{ height: 'auto', maxHeight: 'none', overflow: 'visible' }}>
        <GorIconSprite />
        <GorTeacherPanel
          onClose={() => setTeacherOpen(false)}
          onPreview={(town, citizens, userId) => {
            setPreviewRoster(citizens);
            setTeacherPreview({ townClass: town, userId });
            setTeacherOpen(false);
          }}
        />
      </div>
    );
  }

  if (isTeacher) {
    return (
      <div className="gor-root p-6 max-w-lg mx-auto" style={{ height: 'auto', maxHeight: 'none', overflow: 'visible' }}>
        <GorIconSprite />
        <h1 className="text-2xl font-bold mb-4">Game of Resources</h1>
        <p className="mb-4">Run rounds, assign jobs, and preview the world as any student in a town.</p>
        <button type="button" className="btn primary" onClick={() => setTeacherOpen(true)}>
          Open teacher panel
        </button>
      </div>
    );
  }

  if (!enabled) {
    return <Navigate to="/" replace />;
  }

  return <WorldView />;
};

export default GameOfResourcesPlugin;
