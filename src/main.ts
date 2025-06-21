class Card {
  constructor(public suit: string, public rank: string) { }

  toString(): string {
    return `${this.rank} of ${this.suit}`;
  }
}

const card = new Card('Hearts', 'A');
console.log(card.toString());
