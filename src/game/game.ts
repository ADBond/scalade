import { Pack } from './pack';
import { GameState, GameStateForUI } from './gamestate';
import { Card } from './card';

export class Game {
  private pack = new Pack();
  private state: GameState;

  constructor(playerNames: string[]) {
    this.state = new GameState(playerNames);
    this.dealInitialCards();
  }

  private dealInitialCards(count: number = 12) {
    for (let i = 0; i < count; i++) {
      // for (const player of this.state.players) {
        // TODO: loop this properly!
      for (let playerIndex = 0; playerIndex < 3; playerIndex++) {
        const card = this.pack.draw();
        console.log(card)
        if (card) this.state.giveCardToPlayer(playerIndex, card);
      }
    }
  }

  getGameState(): GameState {
    return this.state;
  }

  getGameStateForUI(): GameStateForUI {
    return this.state.getStateForUI();
  }

  playCard(player: string, card: Card): boolean {
    // return this.state.playCard(player, card);
    return true;
  }
}
