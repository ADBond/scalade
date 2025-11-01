
import { Game } from '../game/game';
import { GameConfig } from '../game/gamestate';
import { AgentName } from '../game/agent/agent';

export async function simulate(agents: AgentName[]): Promise<Game> {
    const config: GameConfig = {
        trumpRule: 'mobile',
        capping: 'uncapped',
        escalations: 4,
    };
    let game = new Game(agents, config, true);
    let current = game.getGameStateForUI();

    // getout for infinite loop
    let counter = 0;
    const maxCounter = 15000;  // should be enough, i think?

    // console.log(current);

    while ((current.gameState !== 'gameComplete') && counter < maxCounter) {
        // console.log("state...")
        await game.incrementState();
        current = game.getGameStateForUI();
        counter++;
    }

    // console.log(game.logs);
    // console.log(counter);
    return game;
}

export async function simulateN(agents: AgentName[], n: number): Promise<Partial<Record<AgentName, number>>[]> {
    let game: Game;
    let scores: Partial<Record<string, any>>[] = [];
    let gameRecord: Partial<Record<string, any>>[];
    for (let index = 0; index < n; index++) {
        console.log(`Simulating: ${index}`)
        game = await simulate(agents);
        let finalScores = game.logs[game.logs.length - 1].finalScores;
        gameRecord = [];
        agents.forEach(
            (agent, i) => gameRecord.push({agent: agent, score: finalScores[i], position: i})
        );
        scores.push(gameRecord);
    }
    return scores;
}

function product<T>(...arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) =>
      acc.flatMap(a => curr.map(b => [...a, b])),
    [[]]
  );
}

export async function roundRobin(agents: AgentName[], n: number) {
    let allScores: Partial<Record<string, any>>[] = [];
    for (const [a1, a2, a3] of product(agents, agents, agents)) {
        let scores = await simulateN([a1, a2, a3], n);
        allScores.push(...scores);
    }
    console.log(allScores);
}
