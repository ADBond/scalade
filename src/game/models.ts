import { smallEncoder, extendedEncoder } from "./encode";

export const modelCatalogue = {
    arundel: smallEncoder,
    bodiam: extendedEncoder,
    camber: extendedEncoder,
}
export type modelName = keyof typeof modelCatalogue;
