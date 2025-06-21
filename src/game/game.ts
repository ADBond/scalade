import { Pack } from './pack';
import { GameState } from './gamestate';
import { Card } from './card';

export class Game {
  private pack = new Pack();
  private state: GameState;

  constructor(playerNames: string[]) {
    this.state = new GameState(playerNames);
    this.dealInitialCards();
  }

  private dealInitialCards(count: number = 5) {
    for (let i = 0; i < count; i++) {
      for (const player of this.state.playerNames) {
        const card = this.pack.draw();
        if (card) this.state.giveCardToPlayer(player, card);
      }
    }
  }

  getGameState(): GameState {
    return this.state;
  }

  playCard(player: string, card: Card): boolean {
    return this.state.playCard(player, card);
  }
}
