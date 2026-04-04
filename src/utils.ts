import { Chess, Square } from "chess.js";
import ChessboardElement, { Cell } from "./chessboard";

export default class Utils {
    static chars = 'abcdefgh'.split('');
    static isWhite(square: Square): boolean {
        const coords = [this.chars.indexOf(square.slice(0,1)), parseInt(square.slice(1))];
        return (coords[0]+coords[1]) % 2 === 0;
    }
    static boardFromChessInstance(_chess: Chess) {
        const board = [];
        for (let y=8; y>0; y--) {
            const row = [];
            for (let x=0; x<8; x++) {
                const square = this.chars[x]+y as Square;
                const cell = this.cellFromChessInstance(_chess, square);
                row.push(cell);
            }
            board.push(row);
        }
        return board;
    }
    static boardFromFEN(position: FEN) {
        return this.boardFromChessInstance(new Chess(position));
    }
    static cellFromChessInstance(_chess: Chess, square: Square): Cell {
        return new Cell({
            square,
            color: this.isWhite(square)?'white':'black',
            piece: _chess.get(square)
        });
    }
    static cellFromFEN(position: FEN, square: Square): Cell {
        return this.cellFromChessInstance(new Chess(position), square);
    }
    static cellFromBoard(board: Array<Cell[]>, square: Square): Cell {
        const y = parseInt(square.slice(1)), x = Utils.chars.indexOf(square.slice(0,1));
        return board[8-y][x];
    }
    static clearSelection(board: ChessboardElement) {
        if (board.selection) {
            board.selection.selected = false;
            board.selection.element?.classList.remove('selected');
            delete board.selection;
        }
        [...board.shadowRoot!.querySelectorAll('.move')].forEach(move => move.classList.remove('move'));
    }
    static stylesheet(strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet {return stylesheet(strings, ...values)}
}

export function stylesheet(strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet {
    const combined = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(combined);
    return sheet;
}