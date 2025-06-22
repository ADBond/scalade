import { Card } from './card';
import { Pack } from './pack';
import { Player } from './player';

export class GameState {
  public players: Player[] = [];
  public pack: Pack = new Pack();
  public dealerIndex: number;
  public currentPlayerIndex: number;

  constructor(public playerNames: string[]) {
    // for (const name of playerNames) {
    //   this.players.set(name, []);
    // }
    this.dealerIndex = 0;
    this.currentPlayerIndex = 0;
  }

  giveCardToPlayer(playerIndex: number, card: Card) {
    this.players[playerIndex].hand.push(card);
  }

  getPlayerHand(playerIndex: number): Card[] {
    return this.players[playerIndex].hand ?? [];
  }

  playCard(playerIndex: number, card: Card): boolean {
    const hand = this.getPlayerHand(playerIndex);
    if (!hand) return false;

    const index = hand.findIndex(
      c => c.rank === card.rank && c.suit === card.suit
    );
    if (index >= 0) {
      const [playedCard] = hand.splice(index, 1);
    //   this.pile.push(playedCard);
      return true;
    }
    return false;
  }
}
