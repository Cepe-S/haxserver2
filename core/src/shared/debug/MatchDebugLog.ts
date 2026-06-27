export interface MatchDebugEntry {
  timestamp: number;
  action: string;
  playerName: string;
  details: string;
}

const MAX_ENTRIES = 100;
const buffer: MatchDebugEntry[] = [];

export function pushMatchDebug(
  action: string,
  playerName: string,
  details: string
): void {
  buffer.unshift({
    timestamp: Date.now(),
    action,
    playerName,
    details
  });
  if (buffer.length > MAX_ENTRIES) {
    buffer.length = MAX_ENTRIES;
  }
}

export function getMatchDebugLog(limit = 50): MatchDebugEntry[] {
  return buffer.slice(0, limit);
}
