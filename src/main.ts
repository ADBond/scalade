import { Game } from './game/game';

const game = new Game(['Alice', 'Bob']);
console.log(game.getGameState().getPlayerHand('Alice'));

const cardToPlay = game.getGameState().getPlayerHand('Alice')[0];
if (cardToPlay) {
  const success = game.playCard('Alice', cardToPlay);
  console.log(`Alice played ${cardToPlay.toString()}: ${success}`);
}

console.log('Pile:', game.getGameState().pile.map(c => c.toString()));
