import * as tf from '@tensorflow/tfjs';

import { ComputerAgent } from "./agent"
import { GameState } from "../gamestate"
import { modelName, modelCatalogue } from '../models';

export async function loadModel(name: modelName) {
  const modelUrl = `${import.meta.env.BASE_URL}models/${name}/model.json`;
  const model = await tf.loadLayersModel(modelUrl);
  const inputShape = model.inputs[0].shape;
  const inputLength = inputShape[1]!;
  // console.log(inputShape);
  const inputTensor = tf.zeros([1, inputLength]);
  // console.log(inputTensor);
  return model;
}

export const nnAgent = (name: modelName): ComputerAgent => ({
  chooseMove: async (gameState: GameState, legalMoveIndices: number[]) => {
    const model = await loadModel(name);
    const inputLength = model.inputs[0].shape[1]!;

    const encoder = modelCatalogue[name];
    const inputTensor = encoder.encode(gameState);

    const prediction = model.predict(inputTensor) as tf.Tensor;
    const predictionData = await prediction.data();
    const legalPredictions = predictionData.filter(
      (value, index) => legalMoveIndices.includes(index)
    );
    // might want probabilities for frontend, but this should
    // be separate functionality
    // const probabilities = await tf.softmax(legalPredictions).data();
    const maxLegalPrediction = Math.max(...legalPredictions)

    const maxIndex = predictionData.indexOf(maxLegalPrediction);

    // console.log('Prediction:', predictionData);
    // console.log('Probs: ', probabilities);
    // console.log('Max index:', maxIndex);
    // console.log(`From options ${legalMoveIndices} I picked ${maxIndex}`);

    return maxIndex;
  }
});

