export class Card {
    constructor(public suit: string, public rank: string) {}
  
    toString(): string {
      return `${this.rank} of ${this.suit}`;
    }
  }
  