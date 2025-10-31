
import { Game } from '../game/game';
import { GameConfig } from '../game/gamestate';

export async function simulate(): Promise<Game> {
    const config: GameConfig = {
        trumpRule: 'mobile',
        capping: 'uncapped',
        escalations: 4,
    };
    let game = new Game(['camber', 'camber', 'camber'], config, true);
    let current = game.getGameStateForUI();

    // getout for infinite loop
    let counter = 0;
    const maxCounter = 15000;  // should be enough, i think?

    console.log(current);

    while ((current.gameState !== 'gameComplete') && counter < maxCounter) {
        console.log("state...")
        await game.incrementState();
        counter++;
    }

    console.log(counter);
    return game;
}

export async function simulateN(n: number): Promise<void> {
    let game: Game;
    for (let index = 0; index < n; index++) {
        game = await simulate();
    }
}
