import { BotClient } from './BotClient.mjs';
import { parseRoomId } from './lib/parse-room-id.mjs';
import { getRunningRoom } from './lib/server-api.mjs';

export class BotPool {
  constructor() {
    /** @type {Map<string, BotClient>} */
    this.bots = new Map();
    this.roomId = null;
    this.roomLink = null;
    this.ruid = null;
  }

  async resolveRoom(preferredRuid) {
    const image = await getRunningRoom(preferredRuid);
    this.roomLink = image.roomLink;
    this.roomId = parseRoomId(image.roomLink);
    this.ruid = image.ruid || image.config?.ruid;
    return { roomId: this.roomId, roomLink: this.roomLink, ruid: this.ruid, name: image.name };
  }

  list() {
    return [...this.bots.values()].map((b) => b.toJSON());
  }

  get(name) {
    return this.bots.get(name);
  }

  /** Conecta en tandas para respetar anti-join-flood (5/min). */
  async joinAll(entries, options = {}) {
    const batchSize = options.batchSize ?? 4;
    const batchPauseMs = options.batchPauseMs ?? 65_000;
    const innerGapMs = options.innerGapMs ?? 2_000;
    const results = [];

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      for (const [name, team] of batch) {
        results.push(await this.join(name, team));
        await delay(innerGapMs);
      }
      if (i + batchSize < entries.length) {
        console.log(`⏳ Pausa anti-flood ${Math.round(batchPauseMs / 1000)}s...`);
        await delay(batchPauseMs);
      }
    }
    return results;
  }

  async join(name, team = 0, retries = 3) {
    if (!this.roomId) {
      await this.resolveRoom();
    }
    if (this.bots.has(name)) {
      throw new Error(`Bot "${name}" ya existe — usá otro nombre o leave ${name}`);
    }

    let lastErr;
    for (let attempt = 1; attempt <= retries; attempt++) {
      const bot = new BotClient(name);
      try {
        await bot.join(this.roomId, team);
        await delay(800);
        this.bots.set(name, bot);
        return bot.toJSON();
      } catch (err) {
        lastErr = err;
        bot.leave();
        if (attempt < retries) {
          console.warn(`↻ Reintento ${attempt}/${retries - 1} para ${name}: ${err.message}`);
          await delay(10_000);
        }
      }
    }
    throw lastErr;
  }

  say(name, message) {
    const bot = this.require(name);
    bot.say(message);
  }

  setTeam(name, team) {
    const bot = this.require(name);
    bot.setTeam(team);
  }

  leave(name) {
    const bot = this.bots.get(name);
    if (!bot) return false;
    bot.leave();
    this.bots.delete(name);
    return true;
  }

  async clear() {
    for (const name of [...this.bots.keys()]) {
      this.leave(name);
    }
    await delay(300);
    return this.bots.size;
  }

  require(name) {
    const bot = this.bots.get(name);
    if (!bot) throw new Error(`Bot "${name}" no encontrado — usá list`);
    return bot;
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
