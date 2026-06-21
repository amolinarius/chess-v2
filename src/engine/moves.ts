import { Color, PieceType, type Piece, type Square } from "../enums";
import Utils from "../utils";
import Chess from "./main";

const UP = -8, RIGHT = 1, BOTTOM = 8, LEFT = -1;

export function createMove(from: Square, to: Square, flags: MoveFlags = 0, isCheck: boolean = false, isMate: boolean = false): Move {
    return { value: (from<<10) | (to<<4) | flags, isCheck, isMate };
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
            moves[lastMove].value = moves[lastMove].value | 0b100; //? Mark move as capture
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
    if (piece.color != chess.nextPlayer) return [];
    let moves;

    switch (piece.type) {
        case PieceType.PAWN: moves = generatePawnMoves(chess, piece, square); break;
        case PieceType.BISHOP: moves = generateBishopMoves(chess, piece, square); break;
        case PieceType.KNIGHT: moves = generateKnightMoves(chess, piece, square); break;
        case PieceType.ROOK: moves = generateRookMoves(chess, piece, square); break;
        case PieceType.QUEEN: moves = generateQueenMoves(chess, piece, square); break;
        case PieceType.KING: moves = generateKingMoves(chess, piece, square); break;
    }
    //TODO Post-processing: Checks and pins
    return moves;
}

export function getPieceOnSquare(chess: Chess, square: Square, color?: Color) {
    const { board } = chess;
    const possibleColors: ('white'|'black')[] = color == undefined ? ['black','white'] : [color == Color.WHITE ? 'white' : 'black'];
    const possibleBitboardKeys: Exclude<BitboardKey, "kings">[] = ["pawns", "bishops", "knights", "rooks", "queens"];
    let sourceBitboard: [typeof possibleBitboardKeys[number] | "kings", typeof possibleColors[number]]|undefined;
    let piece: Piece|undefined;
    for (const color of possibleColors) {
        if (board.kings[color] == square) {
            piece = { type: PieceType.KING, color: color == "black" ? Color.BLACK : Color.WHITE };
            sourceBitboard = ["kings", color];
            break;
        }
        for (const key of possibleBitboardKeys) {
            if ((board[key][color] & (1n << BigInt(square))) > 0n) {
                piece = { type: PieceType[key.slice(-1).toUpperCase() as keyof typeof PieceType], color: color == "black" ? Color.BLACK : Color.WHITE };
                sourceBitboard = [key, color];
                break;
            }
        }
    }
    if (piece == undefined || sourceBitboard == undefined) return undefined;
    return { piece, sourceBitboard };
}

export function applyMove(chess: Chess, move: Move, player?: Color) {
    const { board } = chess;
    const { value } = move;
    const origin = (value&(63<<10))>>10;
    const dest = (value&(63<<4))>>4;
    const flags = value & 0xF;

    const _originPiece = getPieceOnSquare(chess, origin, player);
    if (_originPiece == undefined) {
        console.error(...Utils.formatLog('moves', "Can't apply move: no piece found"));
        return board;
    }
    const { piece, sourceBitboard } = _originPiece;
    if (piece.color != chess.nextPlayer) {
        console.error(...Utils.formatLog('moves', "Can't apply move: wrong player"));
        return board;
    }
    
    if (piece.type == PieceType.KING || sourceBitboard[0] == "kings") { //? Second condition is for TypeScript
        board.kings[sourceBitboard[1]] = dest;
        return board;
    }

    if ((flags & 0b100) > 0) { //? Capture
        const _capture = getPieceOnSquare(chess, dest, player);
        if (_capture == undefined) {
            console.error(...Utils.formatLog('moves', "Invalid move: no piece to capture"));
            return board;
        }
        const { sourceBitboard: captureBitboard } = _capture;
        if (captureBitboard[0] == "kings") {
            console.error(...Utils.formatLog('moves', "Invalid move: can't capture king"));
            return board;
        }
        board[captureBitboard[0]][captureBitboard[1]] &= ~(1n << BigInt(dest));
    }

    board[sourceBitboard[0]][sourceBitboard[1]] &= ~(1n << BigInt(origin));
    board[sourceBitboard[0]][sourceBitboard[1]] |= 1n << BigInt(dest); //? Can use sourceBitboard, piece type/color didn't change
    chess.nextPlayer = (piece.color+1)%2;

    return board;
}