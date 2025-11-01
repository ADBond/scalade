import { smallEncoder, flawedExtendedEncoder } from "./encode";

export const modelCatalogue = {
    arundel: smallEncoder,
    bodiam: flawedExtendedEncoder,
    camber: flawedExtendedEncoder,
}
export type modelName = keyof typeof modelCatalogue;
