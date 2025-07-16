export class ScoreBreakdown {
    constructor(
        // [rung_value, multiplier]
        public ladderScores: [number, number][] = [],
        public finalTrickScore: number,
    ) { }

    get score(): number {
        const laddersTotal = this.ladderScores.map(
            ([rungValue, multiplier]) => rungValue * multiplier
        ).reduce(
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
