import { Card } from "../../card";
import { Pack } from "../../pack";
import { GameState } from "../../gamestate";
import { ComputerAgent } from "../agent";
import { randomArrayElement } from "../random";

export class ISMCTSNode {
    public children: {[key: string]: ISMCTSNode} = {};
    public visits: number = 0;
    public availability: number = 0;
    public score: number = 0;

    constructor(
        public playerIndex: number,
        public move: number = -1,
        public parent: ISMCTSNode | null = null,
    ) {}

    private legalChildren(legalMoves: number[]): ISMCTSNode[] {
        return legalMoves.filter(
            (move) => `${move}` in this.children
        ).map(
            (move) => this.children[`${move}`]
        );
    }

    public untriedNodes(legalMoves: number[]): ISMCTSNode[] {
        const untriedNodes = this.legalChildren(legalMoves).filter(
            node => node.visits === 0
        );
        return untriedNodes;
    }

    private ucb(c: number): number {
        if (this.visits === 0) {
            return Infinity;
        }
        const exploitation = this.score / this.visits;
        const exploration = c * Math.sqrt(Math.log(this.availability) / this.visits);
        return exploitation + exploration;
    }

    public bestChildByUCB(legalMoves: number[], c: number): ISMCTSNode {
        const legalChildren = this.legalChildren(legalMoves);
        const ucbs = legalChildren.map(
            childNode => childNode.ucb(c)
        );
        const topUCB = Math.max(
            ...ucbs
        );
        return legalChildren.filter(childNode => childNode.ucb(c) === topUCB)[0];
    }

    public ensureChildrenExist(playerIndex: number, legalMoves: number[]) {
        legalMoves.forEach(
            move => {
                if (!(`${move}` in this.children)) {
                    const newChild = new ISMCTSNode(playerIndex, move, this);
                    this.children[`${move}`] = newChild;
                }
            }
        );
    }

    public isFullyExpanded(legalMoves: number[]) {
        // all legal children have been visited at least once
        // TODO: do we need this as a separate thing? Seems inefficient
        return this.untriedNodes(legalMoves).length === 0;
    }
}

function determiniseNaive(state: GameState, agent: ComputerAgent): GameState {
    // don't remember voids, or grounding
    const newState = state.clone();
    const unknownCards = state.pack.filterOut(
        state.pack.getFullPack(), [...state.currentPlayerHand, ...state.publicCards, ...state.ladderCards]
    )
    // console.log(`Cards left: ${unknownCards.length}`);
    // console.log(`current hand: ${state.currentPlayerHand.length}`);
    // console.log(`public cards: ${state.publicCards.length}`);
    // console.log(`ladder cards: ${state.ladderCards.length}`);
    // console.log(state.currentPlayerHand.join(', '));
    // console.log(state.publicCards.join(', '));
    // console.log(state.ladderCards.join(', '));
    Pack.shuffle(unknownCards);
    for (let playerIndex = 0; playerIndex < state.numPlayers; playerIndex++) {
        const player = newState.players[playerIndex];
        player.agent = agent;
        if (player.name === state.currentPlayer.name) {
            continue;
        }
        const cardsLeft = player.hand.length;
        player.hand = [];
        for (let cardNum = 0; cardNum < cardsLeft; cardNum++) {
            const card = unknownCards.pop();
            if (card) newState.giveCardToPlayer(playerIndex, card);
        }
    }
    newState.spoils = [];
    for (let i = 0; i < 2; i++) {
        const card = unknownCards.pop();
        if (card) newState.spoils.push(card);
    }
    newState.deadCards = [];
    for (let i = 0; i < 2; i++) {
        const card = unknownCards.pop();
        if (card) newState.deadCards.push(card);
    }
    if (unknownCards.length !== 0) {
        console.log(`Error, leftover cards: ${unknownCards}`);
        console.log(state);
        console.log(newState);
        throw Error();
    }
    return newState;
}


function determinise(state: GameState, agent: ComputerAgent): GameState {
    return determiniseNaive(state, agent);
}

export async function ismcts(
    rootState: GameState,
    rolloutAgent: ComputerAgent,
    iterations: number = 10,
    c: number = 10,
): Promise<[number, ISMCTSNode]> {
    // console.log(`ISMCTS called ${Math.random()}`);
    const initialPlayerIndex = rootState.currentPlayerIndex;
    const initialScores = zeroSum(rootState.scores);
    const numPlayers = rootState.numPlayers;
    const rootNode = new ISMCTSNode(initialPlayerIndex);
    let maxDepth = 0;
    let depth;
    for (let i = 0; i < iterations; i++) {
        // console.log(`ISMCTS iteration ${i}`);
        let state = determinise(rootState, rolloutAgent);
        let node = rootNode;
        // walk down tree until we get a node to expand
        while (!["handComplete", "gameComplete", "newHand"].includes(state.currentState)) {
            let legalMoves = state.legalMoveIndices;
            let currentPlayerIndex = state.currentPlayerIndex;
            node.ensureChildrenExist(currentPlayerIndex, legalMoves);

            legalMoves.forEach(
                move => node.children[move].availability += 1
            );

            let justExpanded = false;
            let untriedNodes = node.untriedNodes(legalMoves);
            if (untriedNodes.length > 0) {
                // console.log("Trying a new node");
                node = randomArrayElement(untriedNodes);
                justExpanded = true;
            } else {
                // console.log("Picking something good");
                // tried everything at least once - use UCB to decide where to go
                node = node.bestChildByUCB(legalMoves, c);
            }
            // console.log(state);
            // console.log(node);
            state.moveFromIndex(node.move);
            if (justExpanded) {
                break;
            }
            // roll forwards to an action state, or terminal state
            while (!["handComplete", "gameComplete", "newHand", "playCard"].includes(state.currentState)) {
                await state.increment();
            }
        }

        while (!["handComplete", "gameComplete", "newHand"].includes(state.currentState)) {  // false positive
            // console.log(`Rollout for ${i}... (${state.currentState}, hand is ${state.handNumber})`);
            await state.increment();
        }
        if (state.currentState === "handComplete") {
            await state.increment();
        }
        const rolloutRewards = state.scores;
        const rolloutZeroSum = zeroSum(rolloutRewards);

        let result = Array(numPlayers).fill(0.0);
        for (let j = 0; j < result.length; j++) {
            result[j] = rolloutZeroSum[j] - initialScores[j];
        }
        depth = 0;
        while (true) {
            depth += 1;
            node.visits += 1;
            if (node.move !== -1) {
                node.score += result[node.playerIndex];
            }
            if (node.parent === null) {
                break;
            }
            node = node.parent;
            // console.log(`Depth: ${depth}`);
        }
        maxDepth = Math.max(depth, maxDepth);
        // console.log(`Iteration ${i} complete`);
    }
    // console.log(`ISMCTS complete, ${iterations} iterations, maximum tree depth ${maxDepth}`);
    const highestVisits = Math.max(
        ...Object.values(rootNode.children).map(
            node => node.visits
        )
    );
    const bestChild = Object.values(rootNode.children).filter(
        node => node.visits === highestVisits
    )[0];
    return [bestChild.move, rootNode];
}

function zeroSum(arr: number[]): number[] {
    const total = arr.reduce((x, y) => x + y, 0);
    return arr.map(
        (val) => val - (total/arr.length)
    );
}
