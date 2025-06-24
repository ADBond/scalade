import { Agent } from "./agent"
import { GameState } from "../gamestate"

export const randomAgent: Agent = {
    chooseMove: (gameState: GameState, legalMoveIndices: number[]) => {
        const randomIndex = Math.floor(Math.random() * legalMoveIndices.length);
        return legalMoveIndices[randomIndex];
    }
}
