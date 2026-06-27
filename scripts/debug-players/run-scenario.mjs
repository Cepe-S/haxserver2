#!/usr/bin/env node
/** Escenario no-interactivo: node run-scenario.mjs map-vote [--ruid pito] */

import { BotPool } from './BotPool.mjs';
import {
  getGameloop,
  waitForPlayerCount,
  refreshMatchLoop,
  transitionLoop,
} from './lib/server-api.mjs';

const scenario = process.argv[2];
const preferredRuid = process.argv.includes('--ruid')
  ? process.argv[process.argv.indexOf('--ruid') + 1]
  : process.env.DEBUG_RUID;
const withHuman = process.argv.includes('--with-human');
const humanWaitSec = process.argv.includes('--human-wait')
  ? Number(process.argv[process.argv.indexOf('--human-wait') + 1])
  : 180;
const humanWaitMs = humanWaitSec * 1000;

const pool = new BotPool();

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const FIELD_TEAMS = [
  ['R1', 1], ['R2', 1], ['R3', 1], ['R4', 1],
  ['B1', 2], ['B2', 2], ['B3', 2], ['B4', 2],
];

function uniqueFieldBots() {
  const tag = Date.now().toString(36).slice(-3);
  return FIELD_TEAMS.map(([n, t]) => [`${n}${tag}`, t]);
}

async function waitForHumanOnField(timeoutMs) {
  const room = await pool.resolveRoom(preferredRuid);
  console.log('\n👤 Modo con humano — unite a la sala y elegí un equipo (rojo o azul):\n');
  console.log(`   ${room.roomLink}\n`);
  console.log(`Esperando hasta ${Math.round(timeoutMs / 1000)}s a que haya al menos 1 jugador en cancha...\n`);

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const gl = await getGameloop();
    const onField = (gl.players?.red ?? 0) + (gl.players?.blue ?? 0);
    if (onField >= 1) {
      console.log(`✅ Humano detectado: ${gl.players?.red ?? 0}R + ${gl.players?.blue ?? 0}B (${onField} en cancha)`);
      return { ...gl, onField };
    }
    const left = Math.ceil((timeoutMs - (Date.now() - start)) / 1000);
    process.stdout.write(`\r   ...esperando (${left}s restantes, cancha=${onField})`);
    await delay(2000);
  }
  throw new Error('Timeout — no se detectó ningún jugador en cancha. Elegí rojo o azul en Haxball.');
}

async function setupEightOnField() {
  await pool.clear();
  const room = await pool.resolveRoom(preferredRuid);
  console.log(`Room: ${room.ruid} (${room.roomId})`);
  if (!withHuman) {
    console.log(`Link: ${room.roomLink}`);
  }

  await transitionLoop('training', 'setup bots in training');
  await delay(2000);

  let humanOnField = 0;
  if (withHuman) {
    const humanGl = await waitForHumanOnField(humanWaitMs);
    humanOnField = humanGl.onField;
  }

  const botsNeeded = 8 - humanOnField;
  if (botsNeeded <= 0) {
    console.log(`Ya hay ${humanOnField} en cancha — no hace falta conectar bots para llegar a 8.`);
  } else {
    const bots = uniqueFieldBots().slice(0, botsNeeded);
    console.log(`Conectando ${botsNeeded} bots (tandas 4+4, anti-flood)...`);
    await pool.joinAll(bots, { innerGapMs: 8000 });
  }

  const gl = await waitForPlayerCount(8);
  console.log(`✅ ${gl.onField} en cancha (cache)`);

  const midGl = await getGameloop();
  const currentStadium = midGl.currentMatch?.stadium;
  const expectedStadium = 'futx4';

  if (currentStadium !== expectedStadium) {
    if (withHuman) {
      console.log('\n⚠️  El estadio sigue siendo distinto de futx4 (el partido arrancó con pocos jugadores).');
      console.log('    El script va a hacer refresh automático del loop — eso NO es tu voto !mapa.\n');
    }
    console.log('Refresh match loop → re-pick estadio con count completo...');
    return refreshMatchLoop('run-scenario map8');
  }

  console.log(`Estadio ya es ${expectedStadium} — sin refresh.`);
  return midGl;
}

async function map8() {
  const gl = await setupEightOnField();
  const expected = 'futx4';
  const stadium = gl.currentMatch?.stadium;
  const pass = stadium === expected;
  console.log(JSON.stringify({
    ok: pass,
    stadium,
    expected,
    players: gl.players,
    loop: gl.loop,
  }, null, 2));
  return { gl, pass, stadium, expected };
}

async function mapVote() {
  const { gl: before, stadium: beforeStadium } = await map8();
  console.log('\n➕ +2 azules (10 total → mismatch vs futx4)...');
  console.log('⏳ Pausa anti-flood 65s antes de bots extra...');
  await delay(65_000);

  const tag = Date.now().toString(36).slice(-3);
  await pool.join(`B5${tag}`, 2);
  await delay(8000);
  await pool.join(`B6${tag}`, 2);
  await waitForPlayerCount(10, 90_000);
  await delay(2000);

  const mid = await getGameloop();
  console.log(`Jugadores: ${mid.players?.red}+${mid.players?.blue}, estadio: ${mid.currentMatch?.stadium}`);

  const bots = pool.list().filter((b) => b.connected);
  console.log(`\n🗳️ !mapa desde ${bots.length} bots...`);
  for (const b of bots) {
    pool.say(b.name, '!mapa');
    await delay(350);
  }

  console.log('Esperando cierre de partido + cambio de mapa...');
  await delay(15_000);

  const after = await getGameloop();
  const expectedAfter = 'futx5';
  const afterStadium = after.currentMatch?.stadium;
  const pass = afterStadium === expectedAfter && after.loop?.active === 'match';

  console.log('\n📊 Resultado final:');
  console.log(JSON.stringify({
    ok: pass,
    beforeStadium,
    afterStadium,
    expectedAfter,
    loop: after.loop,
    players: after.players,
  }, null, 2));

  await pool.clear();
  process.exit(pass ? 0 : 1);
}

async function main() {
  if (scenario === 'map8') {
    const { pass } = await map8();
    await pool.clear();
    process.exit(pass ? 0 : 1);
  }
  if (scenario === 'map-vote') {
    await mapVote();
    return;
  }
  console.error('Uso: node run-scenario.mjs <map8|map-vote> [--ruid pito] [--with-human] [--human-wait 180]');
  process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await pool.clear().catch(() => {});
  process.exit(1);
});
