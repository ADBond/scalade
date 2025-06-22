export class Rank {
    constructor(public name: string, public trickTakingRank: number, public score: number, public ttRankAbove: number) { }

    toString(): string {
        return this.name;
    }

    toStringShort(): string {
        return this.name[0];
    }
}
export class Suit {
    constructor(public name: string, public rankForTrumpPreference: number) { }

    toString(): string {
        return this.name;
    }

    toStringShort(): string {
        return this.name[0];
    }
}

export class Card {
    constructor(public suit: Suit, public rank: Rank) { }

    toString(): string {
        return `${this.rank.toString()} of ${this.suit.toString()}`;
    }

    toStringShort(): string {
        return `${this.rank.toStringShort()}${this.suit.toStringShort()}`;
    }
}

export const RANKS: Rank[] = [
    ...Array.from({ length: 9 }, (_, i) => {
        const val = i + 2;
        return new Rank(val !== 10 ? String(val) : "T", val, val, val + 1);
    }),
    new Rank("J", 11, 12, 12),
    new Rank("Q", 12, 15, 13),
    new Rank("K", 13, 18, 14),
    // Default rank above
    new Rank("A", 14, 1, 4),
];

export const SUITS: Suit[] = [
    new Suit("Diamonds", 0),
    new Suit("Hearts", 1),
    new Suit("Spades", 2),
    new Suit("Clubs", 3),
];
