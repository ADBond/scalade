import * as tf from '@tensorflow/tfjs';

import { ComputerAgent } from "./agent"
import { GameState } from "../gamestate"
import { smallEncoder } from '../encode';


export async function loadModel() {
  const model = await tf.loadLayersModel('static/models/model-tfjs/model.json');
  const inputShape = model.inputs[0].shape;
  const inputLength = inputShape[1]!;
  console.log(inputShape);
  const inputTensor = tf.zeros([1, inputLength]);
  console.log(inputTensor);
  return model;
}
export const nnAgent: ComputerAgent = {
    chooseMove: async (gameState: GameState, legalMoveIndices: number[]) => {
      const model = await loadModel();
      const inputLength = model.inputs[0].shape[1]!;
  
      // TODO: allow this to vary depending on model
      const inputTensor = smallEncoder.encode(gameState);
  
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const predictionData = await prediction.data();
      const legalPredictions = predictionData.filter(
        (value, index) => legalMoveIndices.includes(index)
      );
      // const probabilities = await tf.softmax(legalPredictions).data();
      const maxLegalPrediction = Math.max(...legalPredictions)
  
      const maxIndex = predictionData.indexOf(maxLegalPrediction);
  
      console.log('Prediction:', predictionData);
      // console.log('Probs: ', probabilities);
      console.log('Max index:', maxIndex);
  
      // TODO: map maxIndex to one of the legalMoveIndices
      // need to filter predictionData on legal moves
      // For now, just return a legal move (placeholder)
      return maxIndex;
    }
  };
  
