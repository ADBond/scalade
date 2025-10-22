import { GameState } from "../gamestate";
import { modelName } from "../models";
import { nnAgent } from "./nn";

export interface ComputerAgent {
    chooseMove: (gameState: GameState, legalMoveIndices: number[]) => Promise<number>
}


export type Agent = ComputerAgent | 'human';
export type AgentName = 'human' | modelName;

export function agentLookup(name: AgentName): Agent {
    if (name === 'human') {
        return name;
    }
    return nnAgent(name);
}
