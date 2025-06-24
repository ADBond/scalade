import { Card, RANKS, SUITS } from './card';

export class Pack {
  private cards: Card[] = [];

  constructor(public minRank: number = 4) {
    this.cards = this.getFullPack();
  }

  getFullPack(): Card[] {
    const cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        if (rank.trickTakingRank < this.minRank) {
          continue;
        }
        let card = new Card(suit, rank)
        if (rank.name == "A") {
            card.rank.ttRankAbove = this.minRank;
        }
        cards.push(card);
      }
    }
    return cards;
  }

  getCard(card_string: string): Card {
    // define it here so we definitely have correct ttRankAbove
    for (const card of this.getFullPack()) {
      if (card.toStringShort() == card_string) {
        return card;
      }
    }
    throw new Error(`Failed to locate card: ${card_string}`);
  }

  static shuffle(cards: Card[]) {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  // draw(): Card | undefined {
  //   return this.cards.pop();
  // }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  filterOut(cards: Card[]): Card[] {
    const filteredCards = this.cards.filter((card: Card) => !cards.some(c => Card.cardEquals(card, c)));
    return filteredCards;
  }

  get count(): number {
    return this.cards.length;
  }
}
