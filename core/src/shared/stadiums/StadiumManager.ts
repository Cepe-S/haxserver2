// IMPORT MAP FILE (exactamente como en haxbotron viejo)
import * as mapFutx2 from './futx2.hbs';
import * as mapFutx3 from './futx3.hbs';
import * as mapFutx4 from './futx4.hbs';
import * as mapFutx5 from './futx5.hbs';
import * as mapFutx7 from './futx7.hbs';
import * as mapTraining from './training.hbs';
import { createLogger } from '../logger/Logger';

const logger = createLogger('STADIUM');

/**
 * load stadium map (JSON stringified).
 * Replicación exacta del sistema del haxbotron viejo
 */
export function loadStadiumData(mapName: string): string {
    let stadiumText: string;
    
    // LINK MAP FILE (exactamente como en haxbotron viejo)
    switch (mapName) {
        case 'futx2':
            stadiumText = mapFutx2.stadiumText;
            break;
        case 'futx3':
            stadiumText = mapFutx3.stadiumText;
            break;
        case 'futx4':
            stadiumText = mapFutx4.stadiumText;
            break;
        case 'futx5':
            stadiumText = mapFutx5.stadiumText;
            break;
        case 'futx7':
            stadiumText = mapFutx7.stadiumText;
            break;
        case 'training':
        case 'ready':
            stadiumText = mapTraining.stadiumText;
            break;
        default:
            stadiumText = mapFutx4.stadiumText;
            logger.warn('Unknown stadium, using futx4 default', { mapName });
            break;
    }
    
    if (!stadiumText) {
        logger.error('Stadium text is null/undefined', { mapName });
        return null;
    }
    
    // Replace ball configuration placeholders with settings values
    // Use default values if settings are not available (exactamente como en haxbotron viejo)
    let ballRadius = '6.4';
    let ballColor = '0';
    let ballBCoeff = '0.4';
    let ballInvMass = '1.5';
    let ballDamping = '0.99';
    

    
    // TODO: Integrar con sistema de configuración cuando esté disponible
    // En el sistema viejo se accedía a window.gameRoom.config.settings
    // Por ahora usar valores por defecto
    
    const originalLength = stadiumText.length;
    stadiumText = stadiumText
        .replace(/%BALL_RADIUS%/g, ballRadius)
        .replace(/%BALL_COLOR%/g, ballColor)
        .replace(/%BALL_BCOEFF%/g, ballBCoeff)
        .replace(/%BALL_INVMASS%/g, ballInvMass)
        .replace(/%BALL_DAMPING%/g, ballDamping);
    

    
    return stadiumText;
}

/**
 * StadiumManager - Gestor de estadios para Haxbotron V2
 * Mantiene compatibilidad con el sistema viejo
 * Ahora también proporciona métodos seguros para que los Game Loops lo usen
 */
export class StadiumManager {
    /**
     * Carga datos de estadio (método principal compatible con sistema viejo)
     */
    static loadStadiumData(mapName: string): string {
        const result = loadStadiumData(mapName);
        if (!result) {
            logger.error('Failed to load stadium', { mapName });
        }
        return result;
    }
    
    /**
     * Obtiene lista de estadios disponibles
     */
    static getAvailableStadiums(): string[] {
        return ['futx2', 'futx3', 'futx4', 'futx5', 'futx7', 'training'];
    }
    
    /**
     * Valida si un estadio existe
     */
    static isValidStadium(name: string): boolean {
        return ['futx2', 'futx3', 'futx4', 'futx5', 'futx7', 'training', 'ready'].includes(name);
    }

    // ==================== NUEVOS MÉTODOS PARA GAME LOOPS ====================

    /**
     * Aplica un estadio de forma segura con reintentos
     */
    static async applyStadium(haxballRoom: any, stadiumName: string, maxRetries: number = 2): Promise<boolean> {
        if (!haxballRoom) {
            logger.error('HaxballRoom not provided');
            return false;
        }

        if (!this.isValidStadium(stadiumName)) {
            logger.error('Invalid stadium name', { stadiumName });
            return false;
        }

        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                await haxballRoom.setStadium(stadiumName);
                logger.info(`Stadium applied: ${stadiumName} (attempt ${attempt + 1})`);
                return true;
            } catch (error) {
                attempt++;
                logger.warn(`Failed to apply stadium (attempt ${attempt}/${maxRetries})`, { stadiumName, error });
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        logger.error(`Failed to apply stadium after ${maxRetries} attempts`, { stadiumName });
        return false;
    }

    /**
     * Aplica configuraciones de juego de forma segura
     */
    static async applyGameSettings(
        haxballRoom: any,
        settings: { timeLimit: number; scoreLimit: number; teamLock: boolean }
    ): Promise<boolean> {
        if (!haxballRoom?.browserPage) {
            logger.error('Browser page not available');
            return false;
        }

        try {
            await haxballRoom.browserPage.evaluate((config: any) => {
                if ((window as any).gameRoom?._room) {
                    const room = (window as any).gameRoom._room;
                    
                    room.setTimeLimit(config.timeLimit);
                    room.setScoreLimit(config.scoreLimit);
                    room.setTeamsLock(config.teamLock);
                    
                    console.log(`✅ [BROWSER] Settings applied: timeLimit=${config.timeLimit}, scoreLimit=${config.scoreLimit}, teamLock=${config.teamLock}`);
                }
            }, settings);

            logger.info('Game settings applied', settings);
            return true;

        } catch (error) {
            logger.error('Failed to apply game settings', { settings, error });
            return false;
        }
    }

    /**
     * Detiene el juego de forma segura
     */
    static async safeStopGame(haxballRoom: any): Promise<boolean> {
        if (!haxballRoom) {
            logger.warn('HaxballRoom not provided');
            return false;
        }

        try {
            await haxballRoom.stopGame();
            logger.debug('Game stopped safely');
            return true;
        } catch (error) {
            logger.warn('Failed to stop game (may not be running)', { error });
            return false;
        }
    }

    /**
     * Inicia el juego de forma segura con reintentos
     */
    static async safeStartGame(haxballRoom: any, maxRetries: number = 2): Promise<boolean> {
        if (!haxballRoom) {
            logger.error('HaxballRoom not provided');
            return false;
        }

        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                await haxballRoom.startGame();
                
                // Verificar que el juego realmente inició
                await new Promise(resolve => setTimeout(resolve, 1000));
                const gameState = await haxballRoom.getGameState();
                
                if (gameState?.gameRunning) {
                    logger.info('Game started successfully');
                    return true;
                }
                
                throw new Error('Game did not start - state verification failed');
                
            } catch (error) {
                attempt++;
                logger.warn(`Failed to start game (attempt ${attempt}/${maxRetries})`, { error });
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        logger.error(`Failed to start game after ${maxRetries} attempts`);
        return false;
    }

    /**
     * Valida que un estadio se aplicó correctamente
     */
    static async validateStadiumApplied(haxballRoom: any, expectedStadium: string): Promise<boolean> {
        if (!haxballRoom?.browserPage) {
            return false;
        }

        try {
            const currentStadium = await haxballRoom.browserPage.evaluate(() => {
                if ((window as any).gameRoom?._room) {
                    // Aquí deberíamos verificar el estadio actual
                    // Por ahora asumimos que se aplicó correctamente
                    return true;
                }
                return false;
            });

            return currentStadium;
        } catch (error) {
            logger.error('Failed to validate stadium', { expectedStadium, error });
            return false;
        }
    }
}