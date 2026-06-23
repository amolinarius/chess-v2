import { Color, PieceType, Square, type Piece } from "../enums";
import Utils from "../utils";
import Chess from "./main";

const UP = -8, RIGHT = 1, DOWN = 8, LEFT = -1;

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
    const forward = piece.color == Color.WHITE ? UP : DOWN;
    const baseRank = piece.color == Color.WHITE ? 6 : 1;

    if (Utils.inBounds(y+forward/8) && (getPieces(board) & (1n << BigInt(square+forward))) == 0n) {
        moves.push(createMove(square, square+forward));
        if (y == baseRank && (getPieces(board) & (1n << BigInt(square+forward*2))) == 0n) moves.push(createMove(square, square+forward*2, 1));
    }
    for (const dir of [LEFT, RIGHT]) {
        if (Utils.inBounds(x+dir, y+forward/8) && (getPieces(board, opponentColor) & (1n << BigInt(square+dir+forward))) > 0n) moves.push(createMove(square, square+dir+forward, 0b100));
    }
    if (chess.enpassantFile && y == baseRank + 3*(forward/8) && Math.abs(chess.enpassantFile - x) == 1) moves.push(createMove(square, square+forward+chess.enpassantFile-x, 0b101));
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
export function generateKingMoves(chess: Chess, piece: Piece, square: Square, ignoreCastling: boolean = false): Move[] {
    const { board } = chess, moves = [], opponentColor = (piece.color+1)%2 as Color;
    const pieces = [getPieces(board, Color.WHITE), getPieces(board, Color.BLACK)];
    const [x, y] = [square%8, Math.floor(square/8)];

    const directions = [[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1]];
    for (const dir of directions) {
        const isCapture = (pieces[opponentColor] & (1n << BigInt(square+dir[0]+dir[1]*8))) > 0n;
        if (Utils.inBounds(x+dir[0],y+dir[1]) && (pieces[piece.color] & (1n << BigInt(square+dir[0]+dir[1]*8))) == 0n) moves.push(createMove(square, square+dir[0]+dir[1]*8, +isCapture*0b100));
    }

    if (ignoreCastling) return moves;

    const backranks = [[Square.B8, Square.C8, Square.D8], [Square.F8, Square.G8]]; //? Queenside, kingside (reversed from bitmask to keep index)
    if (piece.color == Color.WHITE) {
        for (let i=0; i<2; i++) {
            backranks[i] = backranks[i].map(sq => sq + DOWN*7);
        }
    }

    const canCastle = {
        queenSide: chess.castlingRights & (1 << 2*opponentColor) && backranks[0].every(sq => chess.get(sq) == undefined && (sq == Square.B8 || sq == Square.B1 || !isUnderAttack(chess, piece, backranks[0][1]))),
        kingside: chess.castlingRights & (0b10 << 2*opponentColor) && backranks[1].every(sq => chess.get(sq) == undefined && !isUnderAttack(chess, piece, backranks[1][1]))
    }
    if (canCastle.queenSide) moves.push(createMove(square, square+2*LEFT, 0b11));
    if (canCastle.kingside) moves.push(createMove(square, square+2*RIGHT, 0b10));

    return moves;
}

let LOCAL_CHESS: Chess;
export function generateMoves(chess: Chess, piece: Piece, square: Square) {
    if (piece.color != chess.nextPlayer) return [];
    let moves;
    const processedMoves = [];

    switch (piece.type) {
        case PieceType.PAWN: moves = generatePawnMoves(chess, piece, square); break;
        case PieceType.BISHOP: moves = generateBishopMoves(chess, piece, square); break;
        case PieceType.KNIGHT: moves = generateKnightMoves(chess, piece, square); break;
        case PieceType.ROOK: moves = generateRookMoves(chess, piece, square); break;
        case PieceType.QUEEN: moves = generateQueenMoves(chess, piece, square); break;
        case PieceType.KING: moves = generateKingMoves(chess, piece, square); break;
    }

    //? Post-processing: Checks and pins
    if (LOCAL_CHESS == undefined) LOCAL_CHESS = new Chess();
    const _chess = LOCAL_CHESS;
    const board = chess.board;
    const nextPlayer = chess.nextPlayer;
    const enpassantFile = chess.enpassantFile;
    const castlingRights = chess.castlingRights;
    let king = board.kings[nextPlayer == Color.WHITE ? 'white' : 'black'];
    let oldking;
    for (const move of moves) {
        _chess.board = structuredClone(board);
        _chess.nextPlayer = nextPlayer;
        _chess.enpassantFile = enpassantFile;
        _chess.castlingRights = castlingRights;
        _chess.applyMove(move, nextPlayer);
        const origin = (move.value&(63<<10))>>10;
        const dest = (move.value&(63<<4))>>4;

        if (origin == king) {
            oldking = king;
            king = dest;
        }

        if (!isUnderAttack(_chess, { type: PieceType.KING, color: nextPlayer }, king)) processedMoves.push(move);
        if (king == dest) king = oldking!;
    }

    return processedMoves;
}

export function isUnderAttack(chess: Chess, piece: Piece, square: Square) {
    const attacker = (piece.color+1)%2;
    const pawnDirection = (attacker == Color.WHITE) ? UP : DOWN;
    const piecesMoves = [generateBishopMoves(chess, piece, square), generateKnightMoves(chess, piece, square), generateRookMoves(chess, piece, square), generateKingMoves(chess, piece, square, true)];
    for (let i=0; i<4; i++) {
        const moves = piecesMoves[i];
        for (const move of moves) {
            const dest = (move.value&(63<<4))>>4;//? Attacker's dest is from since moves are reversed
            if ((move.value&0b100) == 0) continue; //? Not a capture

            const capture = chess.get(dest, attacker);
            if (!capture) {
                console.error(...Utils.formatLog('moves', 'isUnderAttack failed: no piece to capture'));
                return;
            }

            if (!(
                (i == 0 && (capture.type == PieceType.BISHOP || capture.type == PieceType.QUEEN || capture.type == PieceType.PAWN /*Pawn conditions later*/)) ||
                (i == 1 && capture.type == PieceType.KNIGHT) ||
                (i == 2 && (capture.type == PieceType.ROOK || capture.type == PieceType.QUEEN)) ||
                (i == 3 && capture.type == PieceType.KING)
            )) continue;

            if (i == 0 && capture.type == PieceType.PAWN && dest != square+pawnDirection+LEFT && dest != square+pawnDirection+RIGHT) continue;
            return true;
        }
    }
    return false;
}

export function getBitboardFromPiece(piece: Piece) {
    return { name: PieceType[piece.type].toLowerCase()+'s', color: ['white','black'][piece.color] } as { name: BitboardKey, color: 'white'|'black' };
}

export function applyMove(chess: Chess, move: Move, player?: Color) {
    const { board } = chess;
    const { value } = move;
    const origin = (value&(63<<10))>>10;
    const dest = (value&(63<<4))>>4;
    const flags = value & 0xF;

    const piece = chess.get(origin, player);
    if (piece == undefined) {
        console.error(...Utils.formatLog('moves', "Can't apply move: no piece found"));
        return board;
    }
    const sourceBitboard = getBitboardFromPiece(piece);
    if (piece.color != chess.nextPlayer) {
        console.error(...Utils.formatLog('moves', "Can't apply move: wrong player"));
        return board;
    }
    
    if ((flags & 0b100) > 0) { //? Capture
        if ((flags & 1) == 1) board.pawns[piece.color == Color.WHITE ? 'black' : 'white'] &= ~(1n << BigInt(dest + DOWN)); //? En-passant
        else {
            const _capture = chess.get(dest, player == undefined ? undefined : (player+1)%2);
            if (_capture == undefined) {
                console.error(...Utils.formatLog('moves', "Invalid move: no piece to capture"));
                return board;
            }
            const captureBitboard = getBitboardFromPiece(_capture);
            if (captureBitboard.name == "kings") {
                console.error(...Utils.formatLog('moves', "Invalid move: can't capture king"));
                return board;
            }
            board[captureBitboard.name][captureBitboard.color] &= ~(1n << BigInt(dest));
        }
    }
    
    if (piece.type == PieceType.ROOK && (origin%8 == 0 || origin%8 == 7)) chess.castlingRights &= ~(1 << (+(origin%8 == 7) + 2*((piece.color+1)%2))); //? If moving a rook from its base square
    
    if (flags == 1) chess.enpassantFile = dest % 8; //? Double pawn
    else delete chess.enpassantFile;
    chess.nextPlayer = (piece.color+1)%2;

    if (piece.type == PieceType.KING || sourceBitboard.name == "kings") { //? Second condition is for TypeScript
        board.kings[sourceBitboard.color] = dest;
        chess.castlingRights &= ~(0b11 << 2*((piece.color+1)%2));

        if (flags == 0b10 || flags == 0b11) { //? Castling
            board.rooks[sourceBitboard.color] &= ~(1n << BigInt(7*+(flags == 0b10) + 7*DOWN*+(piece.color==Color.WHITE)));
            board.rooks[sourceBitboard.color] |= 1n << BigInt((flags == 0b10 ? Square.F8 : Square.D8) + 7*DOWN*+(piece.color==Color.WHITE));
        }
        return board;
    }
    board[sourceBitboard.name][sourceBitboard.color] &= ~(1n << BigInt(origin));
    board[sourceBitboard.name][sourceBitboard.color] |= 1n << BigInt(dest); //? Can use sourceBitboard, piece type/color didn't change

    return board;
}