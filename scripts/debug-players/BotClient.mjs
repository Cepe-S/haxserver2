import createHaxball from 'node-haxball';

const { Utils, Room } = createHaxball();

const JOIN_TIMEOUT_MS = 45_000;

/**
 * Cliente Haxball real (WebRTC) — externo al core.
 * Se conecta a la sala ya hosteada por MikuServerPro.
 */
export class BotClient {
  constructor(name) {
    this.name = name.slice(0, 12);
    this.room = null;
    this.playerId = null;
    this.roomId = null;
    this._joinHandle = null;
    this._closed = false;
  }

  async join(roomId, team = 0) {
    if (this.room) throw new Error(`${this.name} ya está conectado`);
    this.roomId = roomId;

    const [, authObj] = await Utils.generateAuth();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        try {
          this._joinHandle?.cancel?.();
        } catch {
          /* ignore */
        }
        reject(new Error(`Timeout uniendo ${this.name} a ${roomId}`));
      }, JOIN_TIMEOUT_MS);

      this._joinHandle = Room.join(
        { id: roomId, authObj },
        {
          storage: { player_name: this.name, crappy_router: true },
          noPluginMechanism: true,
          onOpen: (room) => {
            clearTimeout(timer);
            this.room = room;
            this.playerId = room.currentPlayerId ?? null;
            if (team === 1 || team === 2) {
              setTimeout(() => {
                try {
                  room.changeTeam(team);
                } catch (err) {
                  console.warn(`⚠️ ${this.name} changeTeam(${team}): ${err.message}`);
                }
              }, 500);
            }
            resolve(this);
          },
          onClose: (error) => {
            if (!this.room) {
              clearTimeout(timer);
              reject(new Error(`Join falló (${this.name}): ${error?.message || 'conexión cerrada'}`));
              return;
            }
            this._closed = true;
            this.room = null;
            if (error) {
              console.warn(`🔌 ${this.name} desconectado: ${error.message || error}`);
            }
          },
        }
      );
    });
  }

  setTeam(team) {
    if (!this.room) throw new Error(`${this.name} no conectado`);
    if (team === 0) {
      this.room.resetTeams?.();
      return;
    }
    this.room.changeTeam(team);
  }

  say(message) {
    if (!this.room) throw new Error(`${this.name} no conectado`);
    this.room.sendChat(message);
  }

  leave() {
    if (this.room && !this._closed) {
      this.room.leave();
    }
    this.room = null;
    this._joinHandle = null;
  }

  toJSON() {
    return {
      name: this.name,
      playerId: this.playerId,
      roomId: this.roomId,
      connected: !!this.room && !this._closed,
    };
  }
}
