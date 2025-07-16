export class ScoreBreakdown {
    constructor(
        // [rung_value, multiplier]
        public ladderScores: [number, number][] = [],
        public finalTrickScore: number = 0,
    ) { }

    get score(): number {
        const laddersValues = this.ladderScores.map(
            ([rungValue, multiplier]) => rungValue * multiplier
        )
        const laddersTotal = laddersValues.length === 0 ? 0 : laddersValues.reduce(
            (total, value) => total + value
        )
        return laddersTotal + this.finalTrickScore;
    }

    get display(): string {
        const laddersDisplay = this.ladderScores.map(
            ([rungValue, multiplier]) => `${rungValue} &times; ${multiplier}`
        ).join(" + ");
        return `${laddersDisplay} + ${this.finalTrickScore} (FT) = ${this.score}`;
    }
}
