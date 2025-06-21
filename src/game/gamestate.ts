import { Card } from './card';

export class GameState {
  public players: Map<string, Card[]> = new Map();
  public pile: Card[] = [];

  constructor(public playerNames: string[]) {
    for (const name of playerNames) {
      this.players.set(name, []);
    }
  }

  giveCardToPlayer(player: string, card: Card) {
    this.players.get(player)?.push(card);
  }

  getPlayerHand(player: string): Card[] {
    return this.players.get(player) ?? [];
  }

  playCard(player: string, card: Card): boolean {
    const hand = this.players.get(player);
    if (!hand) return false;

    const index = hand.findIndex(
      c => c.rank === card.rank && c.suit === card.suit
    );
    if (index >= 0) {
      const [playedCard] = hand.splice(index, 1);
      this.pile.push(playedCard);
      return true;
    }
    return false;
  }
}
