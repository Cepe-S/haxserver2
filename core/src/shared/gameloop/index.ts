/**
 * Game Loop System
 * 
 * Sistema modular de loops de juego para Haxball
 * Cada loop maneja un modo de juego específico de forma lineal y predecible
 */

export { GameLoop, GameLoopState, GameLoopConfig, LoopTransitionInfo } from './GameLoop';
export { TrainingLoop } from './TrainingLoop';
export { MatchLoop } from './MatchLoop';
export { GameLoopController } from './GameLoopController';
