import { smallEncoder, extendedEncoder } from "./encode";

export const modelCatalogue = {
    arundel: smallEncoder,
    bodiam: extendedEncoder,
}
export type modelName = keyof typeof modelCatalogue;
