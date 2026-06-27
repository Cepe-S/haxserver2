#!/usr/bin/env node
/**
 * REPL externo — clientes Haxball reales contra la sala hosteada por MikuServerPro.
 * NO forma parte del runtime core/web.
 *
 * Setup (una vez):
 *   cd scripts/debug-players && npm install
 *
 * Uso:
 *   npm run debug-players
 *   npm run debug-players -- --ruid pito
 */

import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { BotPool } from './BotPool.mjs';
import {
  getGameloop,
  getDebugStatus,
  transitionLoop,
  getHealth,
} from './lib/server-api.mjs';

const preferredRuid = process.argv.includes('--ruid')
  ? process.argv[process.argv.indexOf('--ruid') + 1]
  : process.env.DEBUG_RUID;

const pool = new BotPool();

function printHelp() {
  console.log(`
Comandos (script EXTERNO — clientes Haxball reales):
  help                         — esta ayuda
  status                       — sala + gameloop + bots conectados
  room                         — resolver link/id de sala running
  list                         — bots activos
  join <nombre> [equipo]       — conectar bot (1=red 2=blue 0=spec)
  team <nombre> <equipo>       — cambiar equipo
  say <nombre> <mensaje>       — chat / comando (!mapa, !afk, ...)
  all say <mensaje>            — chat desde todos los bots
  leave <nombre>               — desconectar bot
  clear                        — desconectar todos
  match                        — POST debug → transición a partido
  training                     — POST debug → transición a training
  scenario map8                — 8 bots 4v4 + partido
  scenario map-vote            — mismatch + !mapa (DEPLOY-007)
  quit | exit                  — salir (clear recomendado antes)
`);
}

async function cmdStatus() {
  const [health, gl, roomInfo] = await Promise.all([
    getHealth().catch((e) => ({ error: e.message })),
    getGameloop().catch((e) => ({ error: e.message })),
    pool.roomId
      ? Promise.resolve({ roomId: pool.roomId, ruid: pool.ruid, link: pool.roomLink })
      : pool.resolveRoom(preferredRuid).catch((e) => ({ error: e.message })),
  ]);
  console.log(JSON.stringify({
    health,
    room: roomInfo,
    loop: gl.loop,
    players: gl.players,
    stadium: gl.currentMatch?.stadium ?? null,
    bots: pool.list(),
  }, null, 2));
}

async function cmdJoin(args) {
  let team = 0;
  let name;
  if (args.length >= 2 && /^[012]$/.test(args[args.length - 1])) {
    team = parseInt(args.pop(), 10);
  }
  name = args.join(' ') || `Bot${pool.list().length + 1}`;
  const bot = await pool.join(name, team);
  console.log(`✅ ${name} conectado →`, bot);
}

async function cmdScenarioMap8() {
  await pool.clear();
  await pool.resolveRoom(preferredRuid);
  console.log(`📡 Sala: ${pool.ruid} (${pool.roomId})`);

  for (let i = 1; i <= 4; i++) {
    await pool.join(`R${i}`, 1);
    await pool.join(`B${i}`, 2);
  }
  await transitionLoop('match', 'debug-players scenario map8');
  await delay(2500);
  const gl = await getGameloop();
  console.log(`\n📍 map8: ${gl.players?.red ?? '?'}R + ${gl.players?.blue ?? '?'}B → estadio: ${gl.currentMatch?.stadium ?? '?'}`);
}

async function cmdScenarioMapVote() {
  await cmdScenarioMap8();
  console.log('\n➕ +2 azules (10 total → mismatch)...');
  await pool.join('B5', 2);
  await pool.join('B6', 2);
  await delay(2000);

  const gl = await getGameloop();
  const bots = pool.list().filter((b) => b.connected);
  console.log(`\n🗳️ !mapa desde ${bots.length} bots...`);
  for (const b of bots) {
    pool.say(b.name, '!mapa');
    await delay(300);
  }

  await delay(4000);
  const after = await getGameloop();
  console.log('\n📊 Resultado:');
  console.log(JSON.stringify({
    beforeStadium: gl.currentMatch?.stadium,
    afterStadium: after.currentMatch?.stadium,
    loop: after.loop,
    players: after.players,
  }, null, 2));
}

async function handleLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  try {
    switch (cmd) {
      case 'help':
      case '?':
        printHelp();
        break;
      case 'status':
        await cmdStatus();
        break;
      case 'room':
        console.log(await pool.resolveRoom(preferredRuid));
        break;
      case 'list':
        console.log(JSON.stringify(pool.list(), null, 2));
        break;
      case 'join':
        await cmdJoin(args);
        break;
      case 'team':
        if (args.length < 2) throw new Error('Uso: team <nombre> <0|1|2>');
        pool.setTeam(args[0], parseInt(args[1], 10));
        console.log(`✅ ${args[0]} → team ${args[1]}`);
        break;
      case 'say':
        if (args.length < 2) throw new Error('Uso: say <nombre> <mensaje>');
        pool.say(args[0], args.slice(1).join(' '));
        console.log(`💬 ${args[0]}: ${args.slice(1).join(' ')}`);
        break;
      case 'all':
        if (args[0] === 'say' && args.length >= 2) {
          const msg = args.slice(1).join(' ');
          for (const b of pool.list()) {
            if (b.connected) pool.say(b.name, msg);
          }
          console.log(`💬 all (${pool.list().length}): ${msg}`);
        } else {
          throw new Error('Uso: all say <mensaje>');
        }
        break;
      case 'leave':
        pool.leave(args[0]);
        console.log(`👋 ${args[0]} desconectado`);
        break;
      case 'clear':
        await pool.clear();
        console.log('✅ todos los bots desconectados');
        break;
      case 'match':
        await transitionLoop('match');
        console.log('✅ transition → match');
        break;
      case 'training':
        await transitionLoop('training');
        console.log('✅ transition → training');
        break;
      case 'scenario':
        if (args[0] === 'map8') await cmdScenarioMap8();
        else if (args[0] === 'map-vote') await cmdScenarioMapVote();
        else throw new Error('Escenarios: map8 | map-vote');
        break;
      case 'quit':
      case 'exit':
        console.log('Saliendo... (ejecutá clear si querés desconectar bots)');
        process.exit(0);
        break;
      default:
        console.log(`Comando desconocido: ${cmd}. Escribí help.`);
    }
  } catch (err) {
    console.error(`❌ ${err.message}`);
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('\n🤖 Debug Players REPL (externo — node-haxball clients)');
  console.log('   No modifica el core. Conecta bots reales a la sala hosteada.\n');

  try {
    await getHealth();
    const room = await pool.resolveRoom(preferredRuid).catch(() => null);
    if (room) {
      console.log(`✅ Web OK — sala: ${room.name} ruid=${room.ruid}`);
      console.log(`   ${room.roomLink}\n`);
    } else {
      console.warn('⚠️  Stack OK pero sin sala running. Ejecutá Execute primero.\n');
    }
  } catch (err) {
    console.error(`⚠️  No se pudo conectar a web :3000 — ${err.message}`);
    console.error('   ¿Corre npm run start:prod?\n');
  }

  printHelp();

  const rl = readline.createInterface({ input, output, prompt: 'bots> ' });
  rl.prompt();

  rl.on('line', async (line) => {
    await handleLine(line);
    rl.prompt();
  });

  rl.on('close', () => process.exit(0));

  process.on('SIGINT', async () => {
    console.log('\n\nInterrupción — desconectando bots...');
    await pool.clear();
    process.exit(0);
  });
}

main();
