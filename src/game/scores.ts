import { mul } from "@tensorflow/tfjs";

export class ScoreBreakdown {
    constructor(
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
}
