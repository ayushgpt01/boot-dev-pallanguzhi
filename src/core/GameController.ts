import { GameEvent } from '../types/GameTypes';
import { Game } from './Game';
import { GameView } from './GameView';
import { Player } from './Player';

export class GameController {
  private game: Game;
  private view: GameView;

  constructor(p1: Player, p2: Player, view: GameView) {
    this.game = new Game(p1, p2);
    this.view = view;

    this.game.onEvent = this.handleEvent.bind(this);
  }

  async startGame() {
    this.view.renderBoard(this.game.board);
    while (this.game.state !== 'over') {
      await this.game.playTurn(); // emits events on move
    }
  }

  private handleEvent(event: GameEvent) {
    switch (event.type) {
      case 'move':
        this.view.updateBoard(event.data.board);
        break;
      case 'pause':
        this.view.showPauseOverlay();
        break;
      case 'resume':
        this.view.hidePauseOverlay();
        break;
      case 'game_over':
        this.view.showWinner(event.data.winner);
        break;
    }
  }

  pauseGame() {
    this.game.pause();
  }

  resumeGame() {
    this.game.resume();
  }
}
