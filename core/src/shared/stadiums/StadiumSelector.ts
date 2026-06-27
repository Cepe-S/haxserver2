import { StadiumDefinition } from './StadiumRegistry';

const TIE_BREAK_ORDER = ['futx2', 'futx3', 'futx4', 'futx5', 'futx7'];

export type MismatchReason = 'ok' | 'too_small' | 'too_large';

export class StadiumSelector {
  private definitions: StadiumDefinition[];

  constructor(definitions: StadiumDefinition[]) {
    this.definitions = definitions.filter(d => d.enabled && d.matchEligible);
  }

  pick(playerCount: number): string {
    const eligible = this.definitions;
    if (eligible.length === 0) return 'futx4';

    const fitting = eligible.filter(
      d => d.minPlayers <= playerCount && playerCount <= d.maxPlayers
    );

    if (fitting.length > 0) {
      fitting.sort((a, b) => {
        if (a.maxPlayers !== b.maxPlayers) return a.maxPlayers - b.maxPlayers;
        return TIE_BREAK_ORDER.indexOf(a.name) - TIE_BREAK_ORDER.indexOf(b.name);
      });
      return fitting[0].name;
    }

    if (playerCount < eligible[0].minPlayers) {
      const sorted = [...eligible].sort(
        (a, b) => a.minPlayers - b.minPlayers || TIE_BREAK_ORDER.indexOf(a.name) - TIE_BREAK_ORDER.indexOf(b.name)
      );
      return sorted[0].name;
    }

    const sorted = [...eligible].sort(
      (a, b) => b.maxPlayers - a.maxPlayers || TIE_BREAK_ORDER.indexOf(a.name) - TIE_BREAK_ORDER.indexOf(b.name)
    );
    return sorted[0].name;
  }

  isIdeal(playerCount: number, stadiumName: string): boolean {
    const def = this.definitions.find(d => d.name === stadiumName);
    if (!def) return this.pick(playerCount) === stadiumName;
    return playerCount >= def.minPlayers && playerCount <= def.maxPlayers;
  }

  getMismatchReason(playerCount: number, current: string): MismatchReason {
    if (this.isIdeal(playerCount, current)) return 'ok';
    const def = this.definitions.find(d => d.name === current);
    if (!def) return 'ok';
    if (playerCount < def.minPlayers) return 'too_small';
    if (playerCount > def.maxPlayers) return 'too_large';
    return 'ok';
  }
}
