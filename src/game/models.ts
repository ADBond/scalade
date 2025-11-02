import { flawedSmallEncoder, flawedExtendedEncoder } from "./encode";

export const modelCatalogue = {
    arundel: flawedSmallEncoder,
    bodiam: flawedExtendedEncoder,
    camber: flawedExtendedEncoder,
}
export type modelName = keyof typeof modelCatalogue;
