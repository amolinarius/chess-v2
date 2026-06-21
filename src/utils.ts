import Chess from "./engine/main";
import ChessboardElement, { Cell } from "./chessboard";
import { Color } from "./enums";
import type { PieceType, Square } from "./enums";

type LogType = 'moves'|'bitboards'|'debug';
export default class Utils {
    static chars: string[] = "abcdefgh".split('');
    static isWhite(square: Square): boolean {
        return (square - (Math.floor(square/8)%2)) % 2 === 0;
    }
    static boardFromChessInstance(_chess: Chess) {
        const board = [];
        for (let y=0; y<8; y++) {
            const row = [];
            for (let x=0; x<8; x++) {
                const square = y*8 + x;
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
            color: this.isWhite(square)?Color.WHITE:Color.BLACK,
            piece: _chess.get(square)
        });
    }
    static cellFromFEN(position: FEN, square: Square): Cell {
        return this.cellFromChessInstance(new Chess(position), square);
    }
    static cellFromBoard(board: Array<Cell[]>, square: Square): Cell {
        const y = Math.floor(square / 8), x = square % 8;
        return board[y][x];
    }
    static clearSelection(board: ChessboardElement) {
        if (board.selection) {
            board.selection.selected = false;
            board.selection.element?.classList.remove('selected');
            delete board.selection;
        }
        [...board.shadowRoot!.querySelectorAll('.move')].forEach(move => move.classList.remove('move'));
        if (board.board) board.board.forEach(row => row.forEach(c => c.isMove = false));
    }
    static getPieceSymbol(piece: PieceType) {return "pnbrqk".split('')[piece];}
    static inBounds(x: number): boolean;
    static inBounds(x: number, y: number): boolean;
    static inBounds(x: number, y?: number): boolean {
        return x >= 0 && x < 8 && (y == undefined || (y >= 0 && y < 8));
    }
    static stylesheet(strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet {return stylesheet(strings, ...values)}
    static capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    static formatLog(type: LogType, ...data: any[]) {
        const color: {[key in LogType]: string} = {
            moves: '#228b22',
            bitboards: '#b22222',
            debug: '#888'
        };
        return ['%c'+this.capitalize(type), 'color:white;padding:2px 5px;border-radius:3px;background-color:'+color[type], ...data];
    }
    static log(type: LogType, ...data: any[]) {
        console.log(...this.formatLog(type, ...data));
    }
}

export function stylesheet(strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet {
    const combined = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(combined);
    return sheet;
}