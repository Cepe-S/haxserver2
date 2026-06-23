import { eventBus } from '../EventBus';
import { HAXBALL_EVENTS, HaxballRoomLinkEvent } from '../HaxballEvents';
import { createLogger } from '../../logger/Logger';

export class RoomLinkHandler {
  private logger = createLogger('RoomLinkHandler');

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.onEvent(HAXBALL_EVENTS.ROOM_LINK, this.handleRoomLink.bind(this));
  }

  private async handleRoomLink(event: HaxballRoomLinkEvent): Promise<void> {
    const { url, timestamp } = event;
    
    this.logger.info(`[RoomLink] Room link obtained: ${url}`);

    try {
      eventBus.emitEvent('room.ready', {
        url,
        timestamp
      });
    } catch (error) {
      this.logger.error(`[RoomLink] Error processing room link:`, error);
    }
  }
}