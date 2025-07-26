import { Board } from './Board';

export interface Player {
  getMove(board: Board): Promise<number>;
  name: string;
}
