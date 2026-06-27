import { createLogger } from '../logger/Logger';
import { eventBus } from '../events/EventBus';
import { PlayerCacheManager } from '../player/PlayerCacheManager';
import { ChatManager } from '../../chat-manager/ChatManager';
import { StadiumSelector, MismatchReason } from './StadiumSelector';
import { MapVoteConfig } from './StadiumRegistry';
import { STRINGS, interpolateString } from '../strings';

export interface MapVoteState {
  active: boolean;
  votes: Set<number>;
  startedAt: number;
  reason: MismatchReason;
}

export class MapVoteManager {
  private logger = createLogger('MapVoteManager');
  private state: MapVoteState | null = null;
  private lastMismatchNotifyAt = 0;
  private lastMismatchEpisodeKey = '';
  private readonly mismatchDebounceMs = 30_000;

  constructor(
    private selector: StadiumSelector,
    private chatManager: ChatManager,
    private mapVoteConfig: MapVoteConfig,
    private getActiveLoopName: () => string | null,
    private getCurrentStadium: () => string
  ) {}

  isEnabled(): boolean {
    return this.mapVoteConfig.enabled !== false;
  }

  getState(): MapVoteState | null {
    return this.state;
  }

  clearVote(): void {
    this.state = null;
  }

  onPlayerCountChanged(playerCount: number): void {
    if (!this.isEnabled() || this.getActiveLoopName() !== 'match') return;

    const current = this.getCurrentStadium();
    const reason = this.selector.getMismatchReason(playerCount, current);

    if (reason === 'ok') {
      if (this.state?.active) {
        this.clearVote();
        this.chatManager.send(STRINGS.mapVote.cancelled, { color: 0xFFAA00 }).catch(() => {});
      }
      this.lastMismatchEpisodeKey = '';
      return;
    }

    this.maybeNotifyMismatch(playerCount, reason);

    if (this.state?.active) {
      this.recalculateQuorum(playerCount);
    }
  }

  async registerVote(playerId: number, playerTeam: number): Promise<{ ok: boolean; message: string }> {
    if (!this.isEnabled()) {
      return { ok: false, message: STRINGS.command._ErrorDisabled };
    }

    if (this.getActiveLoopName() !== 'match') {
      return { ok: false, message: STRINGS.mapVote.notInMatch };
    }

    const { total } = this.getEligibleCount();
    const current = this.getCurrentStadium();
    const reason = this.selector.getMismatchReason(total, current);

    if (reason === 'ok') {
      return { ok: false, message: STRINGS.mapVote.alreadyIdeal };
    }

    if (total < 2) {
      return { ok: false, message: STRINGS.mapVote.notEnoughPlayers };
    }

    if (playerTeam !== 1 && playerTeam !== 2) {
      return { ok: false, message: STRINGS.mapVote.mustBePlaying };
    }

    if (!this.state?.active) {
      this.state = {
        active: true,
        votes: new Set(),
        startedAt: Date.now(),
        reason,
      };
    }

    this.state.votes.add(playerId);
    this.pruneInvalidVotes();

    const required = this.getRequiredVotes(total);
    const progress = interpolateString(STRINGS.mapVote.progress, {
      votes: String(this.state.votes.size),
      required: String(required),
    });

    if (this.state.votes.size >= required) {
      this.logger.info('Map vote quorum reached', { votes: this.state.votes.size, required, total });
      eventBus.emitEvent('map.vote.passed', { playerCountAtClose: total });
      this.clearVote();
      return { ok: true, message: STRINGS.mapVote.passed };
    }

    return { ok: true, message: progress };
  }

  private getEligibleCount(): { total: number; red: number; blue: number } {
    const counts = PlayerCacheManager.getInstance().getActiveTeamCounts();
    return { ...counts, total: counts.red + counts.blue };
  }

  private getRequiredVotes(eligibleCount: number): number {
    const pct = Math.min(100, Math.max(1, this.mapVoteConfig.thresholdPercent ?? 60));
    const byPercent = Math.ceil(eligibleCount * pct / 100);
    // Con 2+ en cancha, nunca basta un solo voto (60% de 1 = 1 era demasiado fácil).
    return Math.max(2, byPercent);
  }

  private maybeNotifyMismatch(playerCount: number, reason: MismatchReason): void {
    const episodeKey = `${reason}:${this.getCurrentStadium()}:${playerCount}`;
    const now = Date.now();

    if (
      episodeKey === this.lastMismatchEpisodeKey &&
      now - this.lastMismatchNotifyAt < this.mismatchDebounceMs
    ) {
      return;
    }

    this.lastMismatchEpisodeKey = episodeKey;
    this.lastMismatchNotifyAt = now;

    const message = interpolateString(STRINGS.mapVote.mismatch, { count: String(playerCount) });
    this.chatManager.send(message, { color: 0xFFAA00 }).catch(err => {
      this.logger.warn('Failed to send mismatch notification', err);
    });
  }

  private recalculateQuorum(playerCount: number): void {
    if (!this.state) return;
    this.pruneInvalidVotes();
    const required = this.getRequiredVotes(playerCount);
    if (this.state.votes.size >= required) {
      eventBus.emitEvent('map.vote.passed', { playerCountAtClose: playerCount });
      this.clearVote();
    }
  }

  private pruneInvalidVotes(): void {
    if (!this.state) return;
    const cache = PlayerCacheManager.getInstance();
    for (const id of [...this.state.votes]) {
      const player = cache.getPlayerByHaxballId(id);
      if (!player || player.team !== 1 && player.team !== 2) {
        this.state.votes.delete(id);
      }
    }
  }
}
