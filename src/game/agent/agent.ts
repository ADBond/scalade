import { GameState } from "../gamestate";

export interface ComputerAgent {
    chooseMove: (gameState: GameState, legalMoveIndices: number[]) => number
}

export type Agent = ComputerAgent | 'human';
