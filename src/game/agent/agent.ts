import { GameState } from "../gamestate";

export interface Agent {
    chooseMove: (gameState: GameState, legalMoveIndices: number[]) => number
}
