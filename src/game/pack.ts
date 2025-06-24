import { Card, RANKS, SUITS } from './card';

export class Pack {
  private cards: Card[] = [];

  constructor(public minRank: number = 4) {
    this.reset();
    // console.log(this.cards);
  }

  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        if (rank.trickTakingRank < this.minRank) {
          continue;
        }
        let card = new Card(suit, rank)
        if (rank.name == "A") {
            card.rank.ttRankAbove = this.minRank;
        }
        this.cards.push(card);
        // console.log("The cards");
        // console.log(this.cards)
      }
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(): Card | undefined {
    return this.cards.pop();
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  get count(): number {
    return this.cards.length;
  }
}
