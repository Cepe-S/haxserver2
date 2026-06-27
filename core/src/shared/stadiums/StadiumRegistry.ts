import { createLogger } from '../logger/Logger';
import { StadiumManager } from './StadiumManager';

const logger = createLogger('StadiumRegistry');

export interface StadiumDefinition {
  name: string;
  minPlayers: number;
  maxPlayers: number;
  enabled: boolean;
  matchEligible: boolean;
}

export interface MapVoteStadiumConfig {
  name: string;
  enabled: boolean;
  minPlayers: number;
  maxPlayers: number;
}

export interface MapVoteConfig {
  enabled: boolean;
  thresholdPercent: number;
  stadiums: MapVoteStadiumConfig[];
}

/** Canonical defaults — must match web/backend ServerConfig.ts */
export const DEFAULT_MATCH_STADIUMS: readonly StadiumDefinition[] = [
  { name: 'futx2', minPlayers: 1, maxPlayers: 4, enabled: true, matchEligible: true },
  { name: 'futx3', minPlayers: 1, maxPlayers: 6, enabled: true, matchEligible: true },
  { name: 'futx4', minPlayers: 5, maxPlayers: 8, enabled: true, matchEligible: true },
  { name: 'futx5', minPlayers: 7, maxPlayers: 10, enabled: true, matchEligible: true },
  { name: 'futx7', minPlayers: 9, maxPlayers: 14, enabled: true, matchEligible: true },
  { name: 'training', minPlayers: 0, maxPlayers: 99, enabled: false, matchEligible: false },
];

const STADIUM_ORDER = ['futx2', 'futx3', 'futx4', 'futx5', 'futx7'];

function cloneDefinition(def: StadiumDefinition): StadiumDefinition {
  return { ...def };
}

function clampRange(min: number, max: number, name: string): { minPlayers: number; maxPlayers: number } {
  let minPlayers = Math.max(1, Math.floor(min));
  let maxPlayers = Math.max(minPlayers, Math.floor(max));
  if (min !== minPlayers || max !== maxPlayers) {
    logger.warn('Clamped invalid stadium range from config', { name, min, max, minPlayers, maxPlayers });
  }
  return { minPlayers, maxPlayers };
}

export function getDefaultMatchStadiums(): StadiumDefinition[] {
  return DEFAULT_MATCH_STADIUMS.filter(d => d.matchEligible).map(cloneDefinition);
}

export function getStadiumDefinition(name: string): StadiumDefinition | undefined {
  const def = DEFAULT_MATCH_STADIUMS.find(d => d.name === name);
  return def ? cloneDefinition(def) : undefined;
}

export function getAllLoadedStadiumNames(): string[] {
  return StadiumManager.getAvailableStadiums();
}

/**
 * Merge panel/runtime mapVote config with canonical defaults.
 * Legacy images without mapVote receive defaults unchanged.
 */
export function resolveStadiumDefinitions(mapVote?: MapVoteConfig | null): StadiumDefinition[] {
  const base = getDefaultMatchStadiums();

  if (!mapVote?.stadiums?.length) {
    return base;
  }

  const overrideMap = new Map(mapVote.stadiums.map(s => [s.name, s]));

  return base.map(def => {
    const override = overrideMap.get(def.name);
    if (!override) return def;

    const { minPlayers, maxPlayers } = clampRange(override.minPlayers, override.maxPlayers, def.name);
    return {
      ...def,
      enabled: override.enabled,
      minPlayers,
      maxPlayers,
    };
  }).sort((a, b) => STADIUM_ORDER.indexOf(a.name) - STADIUM_ORDER.indexOf(b.name));
}

export function buildDefaultMapVoteConfig(): MapVoteConfig {
  return {
    enabled: true,
    thresholdPercent: 60,
    stadiums: getDefaultMatchStadiums().map(({ name, enabled, minPlayers, maxPlayers }) => ({
      name,
      enabled,
      minPlayers,
      maxPlayers,
    })),
  };
}
