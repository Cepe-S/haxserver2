import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import axios from 'axios';
import {
  db,
  healthCheck,
  getLogsDirectory,
  listLogFiles,
  readLogTail
} from '@mikuserverpro/database';

const CORE_SERVER_URL = process.env.CORE_SERVER_URL || `http://localhost:${process.env.CORE_PORT || 3001}`;

const GAMELOOP_EVENTS = new Set([
  'haxball.game.start',
  'haxball.game.stop',
  'haxball.team.victory',
  'haxball.team.goal',
  'loop.transition.request',
  'player.count.changed'
]);

export interface AgentReportOptions {
  ruid?: string;
  logLines?: number;
}

function repoRoot(): string {
  return resolve(process.cwd(), '../..');
}

function section(name: string, lines: string[]): string[] {
  return [`@SECTION ${name}`, ...lines, ''];
}

function kv(key: string, value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return `${key}=`;
  return `${key}=${value}`;
}

function readActiveProbs(): string[] {
  const candidates = [
    resolve(repoRoot(), 'SystemStatus.md'),
    resolve(process.cwd(), '../../SystemStatus.md')
  ];

  const path = candidates.find((p) => existsSync(p));
  if (!path) {
    return ['SystemStatus.md=NOT_FOUND'];
  }

  const content = readFileSync(path, 'utf8');
  const start = content.indexOf('## Problemas activos');
  if (start === -1) return ['problems=section_not_found'];

  const rest = content.slice(start);
  const end = rest.search(/\n## [^#]/);
  const block = end === -1 ? rest : rest.slice(0, end);

  const rows = block
    .split('\n')
    .filter((line) => line.includes('| PROB-'))
    .map((line) => line.replace(/\*\*/g, '').trim());

  if (rows.length === 0) return ['problems=none_listed'];
  return rows;
}

async function fetchJson<T>(url: string): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const response = await axios.get<T>(url, { timeout: 8000 });
    return { ok: true, status: response.status, data: response.data };
  } catch (error: any) {
    return {
      ok: false,
      status: error.response?.status ?? 0,
      error: error.message || String(error)
    };
  }
}

function buildAlerts(input: {
  dbOk: boolean;
  coreOk: boolean;
  coreHealth: any;
  runningImages: Array<{ name: string; ruid: string | null }>;
  ruid?: string;
  roomOk: boolean;
  errorLogLines: string[];
  duplicateListeners: string[];
}): string[] {
  const alerts: string[] = [];

  if (!input.dbOk) alerts.push('[FAIL] database=disconnected');
  if (!input.coreOk) alerts.push('[FAIL] core=unreachable');
  if (input.coreOk && input.coreHealth?.activeRooms === 0 && input.runningImages.length > 0) {
    alerts.push('[WARN] server_image=running_but_core_activeRooms=0');
  }
  if (input.ruid && !input.roomOk) {
    alerts.push(`[FAIL] room ruid=${input.ruid} not found in core`);
  }
  if (input.duplicateListeners.length > 0) {
    for (const line of input.duplicateListeners) {
      alerts.push(`[WARN] event_listener ${line}`);
    }
  }

  const recentErrors = input.errorLogLines.filter(
    (l) =>
      /\[ERROR\]|error|Error|FAIL|failed|EADDRINUSE|uncaughtException|unhandledRejection/i.test(l)
  );
  if (recentErrors.length > 0) {
    alerts.push(`[WARN] errors.log recent_error_lines=${recentErrors.length}`);
  }

  if (alerts.length === 0) alerts.push('[OK] no_critical_alerts');
  return alerts;
}

function formatListenerWarnings(events: Array<{ name: string; listenerCount: number }>): string[] {
  const warnings: string[] = [];
  const lines: string[] = [];

  for (const ev of events) {
    const tag = GAMELOOP_EVENTS.has(ev.name) && ev.listenerCount > 1 ? ' [WARN count>1]' : '';
    lines.push(`${ev.name}=${ev.listenerCount}${tag}`);
    if (GAMELOOP_EVENTS.has(ev.name) && ev.listenerCount > 1) {
      warnings.push(`${ev.name}=${ev.listenerCount}`);
    }
  }

  return [...lines, ...warnings.map((w) => `duplicate:${w}`)];
}

export async function buildAgentReport(options: AgentReportOptions = {}): Promise<string> {
  const logLines = options.logLines ?? 40;
  const lines: string[] = [
    '# MIKUSERVERPRO_AGENT_REPORT v1',
    `# generated=${new Date().toISOString()}`,
    `# hint=search @SECTION or [FAIL] [WARN]; room auto from running server image`,
    ''
  ];

  const dbOk = await healthCheck();
  const coreHealthRes = await fetchJson<any>(`${CORE_SERVER_URL}/health`);
  const coreOk = coreHealthRes.ok;

  const images = await db.serverImage.findMany({ orderBy: { updatedAt: 'desc' } });
  const running = images.filter((i) => i.status === 'running');
  const ruid = options.ruid || running[0]?.ruid || undefined;

  const gameloopRes = await fetchJson<any>(`${CORE_SERVER_URL}/api/debug/gameloop`);
  let roomBalance: any = null;
  let roomEvents: any = null;
  let roomStats: any = null;
  let roomOk = false;

  if (ruid) {
    const [bal, ev, st] = await Promise.all([
      fetchJson(`${CORE_SERVER_URL}/api/rooms/${encodeURIComponent(ruid)}/balance-debug`),
      fetchJson(`${CORE_SERVER_URL}/api/rooms/${encodeURIComponent(ruid)}/events`),
      fetchJson(`${CORE_SERVER_URL}/api/rooms/${encodeURIComponent(ruid)}/stats-debug`)
    ]);
    roomOk = bal.ok;
    roomBalance = bal.data;
    roomEvents = ev.data;
    roomStats = st.data;
  }

  const matchLogRes = await fetchJson<any>(`${CORE_SERVER_URL}/api/debug/match-log`);
  const dbDebugRes = await fetchJson<any>(`${CORE_SERVER_URL}/api/debug/database`);

  const errorTail = readLogTail('errors.log', logLines);
  const coreTail = readLogTail('core-app.log', logLines);
  const webTail = readLogTail('web-app.log', Math.min(logLines, 25));

  const eventList = roomEvents?.eventSystem?.events ?? gameloopRes.data?.events ?? [];
  const listenerLines = formatListenerWarnings(eventList);
  const duplicateListeners = listenerLines
    .filter((l) => l.startsWith('duplicate:'))
    .map((l) => l.replace('duplicate:', ''));

  const alerts = buildAlerts({
    dbOk,
    coreOk,
    coreHealth: coreHealthRes.data,
    runningImages: running.map((r) => ({ name: r.name, ruid: r.ruid })),
    ruid,
    roomOk,
    errorLogLines: errorTail,
    duplicateListeners
  });

  lines.push(...section('ALERTS', alerts));

  lines.push(
    ...section('HEALTH', [
      kv('web.database', dbOk ? 'connected' : 'disconnected'),
      kv('web.core', coreOk ? 'connected' : 'disconnected'),
      kv('core.status', coreHealthRes.data?.status ?? 'unknown'),
      kv('core.database', coreHealthRes.data?.database ?? 'unknown'),
      kv('core.activeRooms', coreHealthRes.data?.activeRooms ?? 'unknown'),
      kv('logs.directory', getLogsDirectory()),
      kv('node.version', process.version),
      kv('env.NODE_ENV', process.env.NODE_ENV ?? 'unset'),
      kv('env.LOG_LEVEL', process.env.LOG_LEVEL ?? 'unset')
    ])
  );

  const imageLines = images.map((img) => {
    const prefix = img.status === 'running' ? '@RUNNING' : '@INACTIVE';
    return `${prefix} id=${img.id} name=${img.name} ruid=${img.ruid ?? '-'} link=${img.roomLink ?? '-'}`;
  });
  lines.push(...section('SERVER_IMAGES', imageLines.length ? imageLines : ['none']));

  if (ruid) {
    const gl = roomBalance?.gameLoop ?? gameloopRes.data;
    const loop = gl?.loop ?? gl;
    const stats = gl?.stats ?? roomBalance?.gameLoop?.stats;
    lines.push(
      ...section(`ROOM ruid=${ruid}`, [
        kv('room.found', roomOk),
        kv('loop.active', loop?.activeLoop ?? loop?.active ?? 'unknown'),
        kv('loop.state', loop?.state ?? 'unknown'),
        kv('loop.isTransitioning', loop?.isTransitioning ?? false),
        kv('players.total', roomBalance?.players?.total ?? gameloopRes.data?.players?.total ?? 0),
        kv('players.red', roomBalance?.players?.red ?? 0),
        kv('players.blue', roomBalance?.players?.blue ?? 0),
        kv('stats.training.activations', stats?.training?.activations ?? 0),
        kv('stats.match.matchesPlayed', stats?.match?.matchesPlayed ?? 0),
        kv('stats.isMatchActive', roomStats?.isMatchActive ?? false),
        kv('matchLog.entries', matchLogRes.data?.total ?? 0),
        kv('balance.mode', roomBalance?.status?.mode ?? '-'),
        kv('balance.enabled', roomBalance?.status?.enabled ?? '-')
      ])
    );
  } else {
    lines.push(...section('ROOM', ['status=no_running_room ruid=unset']));
  }

  if (eventList.length > 0) {
    lines.push(...section('EVENT_LISTENERS', listenerLines.filter((l) => !l.startsWith('duplicate:'))));
  }

  const matchEntries = matchLogRes.data?.entries ?? roomStats?.matchLog ?? [];
  if (matchEntries.length > 0) {
    lines.push(
      ...section('MATCH_LOG', [
        ...matchEntries.slice(-15).map(
          (e: any) =>
            `[${e.timestamp}] ${e.action} ${e.playerName}${e.details ? ` — ${e.details}` : ''}`
        )
      ])
    );
  }

  if (dbDebugRes.ok && dbDebugRes.data?.summary) {
    const s = dbDebugRes.data.summary;
    lines.push(
      ...section('DB_SUMMARY', [
        kv('playerIdentities', s.playerIdentities),
        kv('serverImages', s.serverImages),
        kv('statEvents', s.statEvents),
        kv('connections', s.connections),
        kv('runningImages', running.length)
      ])
    );
  }

  lines.push(...section('ACTIVE_PROBS', readActiveProbs()));

  if (errorTail.length > 0) {
    lines.push(...section('LOG_ERRORS', errorTail.map((l) => `| ${l}`)));
  }
  if (coreTail.length > 0) {
    lines.push(...section('LOG_CORE_APP', coreTail.map((l) => `| ${l}`)));
  }
  if (webTail.length > 0) {
    lines.push(...section('LOG_WEB_APP', webTail.map((l) => `| ${l}`)));
  }

  const logFiles = listLogFiles();
  lines.push(
    ...section('LOG_FILES', logFiles.map((f) => `${f.name} size=${f.sizeBytes} modified=${f.modifiedAt}`))
  );

  lines.push(
    ...section('FIX_ROUTING', [
      'gameloop|EventBus|training|match → core/src/shared/gameloop/, EventBus.ts',
      'stats|goals|MatchStats → core/src/shared/stats/, MatchLoop.ts',
      'balance|JT|teams → core/src/shared/balance/',
      'player|identity|cache → core/src/shared/player/, PlayerIdentityManager.ts',
      'web|panel|proxy|zip → web/backend/, web/frontend/',
      'database|prisma|schema → database/prisma/',
      'deploy|pm2|chrome → scripts/, ecosystem.config.js, core/app.ts',
      'small_fix=patch en archivos clave del subsistema (ideal)',
      'rebuild=contrato roto, duplicación masiva, o diseño incorrecto → coordinador redefine DEPLOY'
    ])
  );

  lines.push(
    ...section('DEPLOY_LOOP', [
      '1. worker: implement + npm run build',
      '2. coordinator: GET /api/debug/report → leer @SECTION ALERTS',
      '3. si [FAIL] o [WARN] crítico → clasificar small_fix vs rebuild',
      '4. derivar worker con subsistema de FIX_ROUTING + manifest DEPLOY-xxx',
      '5. repetir hasta ALERTS=[OK] y criterios del manifest'
    ])
  );

  return lines.join('\n');
}
