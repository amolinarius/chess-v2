import { Color, PieceType, Square, type Piece } from "../enums";
import Utils from "../utils";
import { applyMove, generateMoves } from "./moves";

export default class Chess {
    static default_position: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    board!: Bitboards;
    nextPlayer!: Color;
    enpassantFile?: number;
    castlingRights: CastlingRights = 0;

    get ctor() {return this.constructor as {[key: string]: any}}
    constructor(_fen?: FEN) {
        const fen: string = _fen ?? this.ctor.default_position;
        this.load(fen);
    }
    bitboardsFromFen(fen: FEN): Bitboards {
        const bitboards: Bitboards = {
            pawns: {white: 0n, black: 0n},
            bishops: {white: 0n, black: 0n},
            knights: {white: 0n, black: 0n},
            rooks: {white: 0n, black: 0n},
            queens: {white: 0n, black: 0n},
            kings: {white: 0, black: 0}
        };
        const position = fen.split(' ')[0];
        const formattedPos = position.split('').map(chr => Number.isNaN(parseInt(chr)) ? chr : "".padEnd(parseInt(chr)," ")).join('');
        const board = formattedPos.split('/').map(row => row.split(''));

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const chr = board[y][x];
                if (chr == " ") continue;

                let bitboard: BitboardKey|undefined;
                const color = chr == chr.toLowerCase() ? 'black' : 'white';
                switch (chr.toLowerCase()) {
                    case "p": bitboard = 'pawns'; break;
                    case "b": bitboard = 'bishops'; break;
                    case "n": bitboard = 'knights'; break;
                    case "r": bitboard = 'rooks'; break;
                    case "q": bitboard = 'queens'; break;
                    case "k": bitboard = 'kings'; break;
                }
                if (!bitboard) continue;

                if (bitboard == "kings") bitboards.kings[color] = y*8 + x;
                else bitboards[bitboard][color] |= (1n << BigInt(y*8 + x));
            }
        }
        Utils.log('bitboards', 'Initialized engine with bitboards', bitboards);
        return bitboards;
    }
    load(fen: FEN) {
        const [position, nextPlayer, castlingRights, enpassantSquare] = fen.split(' ');
        this.board = this.bitboardsFromFen(fen);
        this.nextPlayer = nextPlayer == 'b' ? Color.BLACK : Color.WHITE;
        if (enpassantSquare == "-") delete this.enpassantFile;
        else this.enpassantFile = Utils.chars.indexOf(enpassantSquare.charAt(0));
        this.castlingRights = 0;
        for (const chr of castlingRights.split('')) {
            switch (chr.toLowerCase()) {
                case "k": this.castlingRights |= 1 << 1+2*+(chr == chr.toUpperCase()); break;
                case "q": this.castlingRights |= 1 << 2*+(chr == chr.toUpperCase()); break;
            }
        }
    }
    get(square: Square, _color?: Color): Piece|undefined {
        if (this.board.kings.white == square) {return {type: PieceType.KING, color: Color.WHITE}}
        else if (this.board.kings.black == square) {return {type: PieceType.KING, color: Color.BLACK}}
        
        let possibleColors = ['white','black'];
        if (_color != undefined) possibleColors = [possibleColors[_color]];

        for (const key of ['pawns','bishops','knights','rooks','queens']) {
            for (const color of possibleColors) {
                const bitboard = this.board[key as Exclude<BitboardKey,'kings'>][color as 'white'|'black'];
                if ((bitboard & (1n << BigInt(square))) == 0n) {continue}
                return {
                    type: PieceType[key.slice(0, -1).toUpperCase() as keyof typeof PieceType],
                    color: color == 'white' ? Color.WHITE : Color.BLACK
                };
            }
        }
        return undefined;
    }
    moves(from: { piece: Piece, square: Square }): Move[] {
        return generateMoves(this, from.piece, from.square);
    }
    applyMove(move: Move, player?: Color): Bitboards {
        return applyMove(this, move, player);
    }
}