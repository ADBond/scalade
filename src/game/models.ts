import { flawedSmallEncoder, flawedExtendedEncoder, smallEncoder, partFlawedExtendedEncoder } from "./encode";

export const modelCatalogue = {
    arundel: {
        folder: "arundel",
        encoder: flawedSmallEncoder,
    },
    bodiam: {
        folder: "bodiam",
        encoder: flawedExtendedEncoder,
    },
    camber: {
        folder: "camber",
        encoder: flawedExtendedEncoder,
    },
    farnham: {
        folder: "arundel",
        encoder: smallEncoder,
    },
    gidleigh: {
        folder: "bodiam",
        encoder: partFlawedExtendedEncoder,
    },
    hastings: {
        folder: "camber",
        encoder: partFlawedExtendedEncoder,
    },
}
export type modelName = keyof typeof modelCatalogue;
