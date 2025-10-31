import { Suit } from "./card";

export class ScoreBreakdown {
    constructor(
        // [rung_value, multiplier]
        public ladderScores: [Suit, number, number][] = [],
        public finalTrickScore: number = 0,
    ) { }

    get score(): number {
        const laddersValues = this.ladderScores.map(
            ([_suit, rungValue, multiplier]) => rungValue * multiplier
        )
        const laddersTotal = laddersValues.length === 0 ? 0 : laddersValues.reduce(
            (total, value) => total + value
        )
        return laddersTotal + this.finalTrickScore;
    }

    // TODO: can we ditch entirely?
    get display(): string {
        const laddersDisplay = this.ladderScores.map(
            ([_suit, rungValue, multiplier]) => `${rungValue} &times; ${multiplier}`
        ).join(" + ");
        return `${laddersDisplay} + ${this.finalTrickScore} (FT) = ${this.score}`;
    }

    baseAndMultiplier(suit: Suit): [number, number] | null {
        const suitScores = this.ladderScores.filter(
            ([ladderSuit, _r, _m]) => Suit.suitEquals(suit, ladderSuit)
        );
        if (suitScores.length > 1) {
            // TODO: error
            console.log(`Error: ladderSuit logic issue: ${suitScores}`);
        }
        if (suitScores.length === 0) {
            return null;
        }
        // single entry - return the details!
        const suitScore = suitScores[0];
        return [suitScore[1], suitScore[2]]
    }
}
