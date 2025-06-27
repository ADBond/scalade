export class Rank {
    constructor(public name: string, public trickTakingRank: number, public score: number, public ttRankAbove: number) { }

    toString(): string {
        return this.name;
    }

    toStringShort(): string {
        return this.name[0];
    }

    static rankEquals(r1: Rank, r2: Rank): boolean {
        return r1.name == r2.name;
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

    static suitEquals(s1: Suit, s2: Suit): boolean {
        return s1.name == s2.name;
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

    public nextCardUp(pack: Card[]): Card {
        /*
        From a given pack, return the next card up from the current one
        */
        const ttrRank = this.rank.ttRankAbove;
        const suit = this.suit;
        const matchingCards = pack.filter(
            card => Suit.suitEquals(card.suit, suit) && (card.rank.trickTakingRank == ttrRank)
        )
        if (matchingCards.length != 1) {
            console.log(`Error in nextCardUp: ${matchingCards}`);
        }
        return matchingCards[0];
    }

    static cardEquals(c1: Card, c2: Card): boolean {
        return Rank.rankEquals(c1.rank, c2.rank) && Suit.suitEquals(c1.suit, c2.suit);
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
