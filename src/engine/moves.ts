import { Color, PieceType, type Piece, type Square } from "../enums";
import Utils from "../utils";
import Chess from "./main";

const UP = -8, RIGHT = 1, BOTTOM = 8, LEFT = -1;

export function createMove(from: Square, to: Square, flags: MoveFlags = 0): Move {
    return (from<<10) | (to<<4) | flags;
}

export function getPieces(board: Bitboards, color?: Color): bigint {
    const colors = (color != undefined ? [['white','black'][color]] : ['white', 'black']) as Array<'white'|'black'>;
    const boards = colors.map(clr => board.pawns[clr] | board.bishops[clr] | board.knights[clr] | board.rooks[clr] | board.queens[clr] | (1n << BigInt(board.kings[clr])));
    return boards.reduce((prev, curr) => prev | curr, 0n);
}

export function generatePawnMoves(chess: Chess, piece: Piece, square: Square): Move[] {
    const { board } = chess, moves = [], opponentColor = (piece.color+1)%2 as Color;
    const [x, y] = [square%8, Math.floor(square/8)];
    const forward = piece.color == Color.WHITE ? UP : BOTTOM;
    const baseRank = piece.color == Color.WHITE ? 6 : 1;

    if (Utils.inBounds(y+forward/8) && (getPieces(board) & (1n << BigInt(square+forward))) == 0n) {
        moves.push(createMove(square, square+forward));
        if (y == baseRank && (getPieces(board) & (1n << BigInt(square+forward*2))) == 0n) moves.push(createMove(square, square+forward*2, 1));
    }
    for (const dir of [LEFT, RIGHT]) {
        if (Utils.inBounds(x+dir, y+forward/8) && (getPieces(board, opponentColor) & (1n << BigInt(square+dir+forward))) > 0n) moves.push(createMove(square, square+dir+forward, 0b100));
    }
    return moves;
}
export function generateKnightMoves(chess: Chess, piece: Piece, square: Square): Move[] {
    const { board } = chess, moves = [], opponentColor = (piece.color+1)%2 as Color;
    const pieces = [getPieces(board, Color.WHITE), getPieces(board, Color.BLACK)];
    const [x, y] = [square%8, Math.floor(square/8)];

    const directions = [[1,-2],[2,-1],[2,1],[1,2],[-1,2],[-2,1],[-2,-1],[-1,-2]];
    for (const dir of directions) {
        const isCapture = (pieces[opponentColor] & (1n << BigInt(square+dir[0]+dir[1]*8))) > 0n;
        if (Utils.inBounds(x+dir[0],y+dir[1]) && (pieces[piece.color] & (1n << BigInt(square+dir[0]+dir[1]*8))) == 0n) moves.push(createMove(square, square+dir[0]+dir[1]*8, +isCapture*0b100));
    }
    return moves;
}
export function generateSlidingMoves(chess: Chess, piece: Piece, square: Square, offset: [number, number]): Move[] {
    const { board } = chess, moves = [], opponentColor = (piece.color+1)%2 as Color;
    const pieces = [getPieces(board, Color.WHITE), getPieces(board, Color.BLACK)];
    const [x, y] = [square%8, Math.floor(square/8)];
    
    let _x = x+offset[0], _y = y+offset[1];
    while (Utils.inBounds(_x, _y) && (pieces[piece.color] & 1n << BigInt(_y*8+_x)) == 0n) {
        moves.push(createMove(square, _y*8+_x));
        if ((pieces[opponentColor] & 1n << BigInt(_y*8+_x)) > 0n) {
            const lastMove: number = moves.length - 1;
            moves[lastMove] = moves[lastMove] | 0b100; //? Mark move as capture
            break;
        }

        _x += offset[0]; _y += offset[1];
    }
    return moves;
}
export function generateBishopMoves(chess: Chess, piece: Piece, square: Square): Move[] {
    const directions: [number,number][] = [[-1,-1],[-1,1],[1,-1],[1,1]];
    return directions.flatMap(dir => generateSlidingMoves(chess, piece, square, dir));
}
export function generateRookMoves(chess: Chess, piece: Piece, square: Square): Move[] {
    const directions: [number,number][] = [[-1,0],[0,-1],[1,0],[0,1]];
    return directions.flatMap(dir => generateSlidingMoves(chess, piece, square, dir));
}
export function generateQueenMoves(chess: Chess, piece: Piece, square: Square): Move[] {
    return [...generateBishopMoves(chess, piece, square), ...generateRookMoves(chess, piece, square)];
}
export function generateKingMoves(chess: Chess, piece: Piece, square: Square): Move[] {
    const { board } = chess, moves = [], opponentColor = (piece.color+1)%2 as Color;
    const pieces = [getPieces(board, Color.WHITE), getPieces(board, Color.BLACK)];
    const [x, y] = [square%8, Math.floor(square/8)];

    const directions = [[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1]];
    for (const dir of directions) {
        const isCapture = (pieces[opponentColor] & (1n << BigInt(square+dir[0]+dir[1]*8))) > 0n;
        if (Utils.inBounds(x+dir[0],y+dir[1]) && (pieces[piece.color] & (1n << BigInt(square+dir[0]+dir[1]*8))) == 0n) moves.push(createMove(square, square+dir[0]+dir[1]*8, +isCapture*0b100));
    }
    return moves;
}

export function generateMoves(chess: Chess, piece: Piece, square: Square) {
    let moves;
    switch (piece.type) {
        case PieceType.PAWN: moves = generatePawnMoves(chess, piece, square); break;
        case PieceType.BISHOP: moves = generateBishopMoves(chess, piece, square); break;
        case PieceType.KNIGHT: moves = generateKnightMoves(chess, piece, square); break;
        case PieceType.ROOK: moves = generateRookMoves(chess, piece, square); break;
        case PieceType.QUEEN: moves = generateQueenMoves(chess, piece, square); break;
        case PieceType.KING: moves = generateKingMoves(chess, piece, square); break;
    }
    //TODO Handle checks/pins
    return moves;
}
