import { Color, PieceType, type Piece, type Square } from "../enums";

export default class Chess {
    static default_position: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    board: Bitboards;
    get ctor() {return this.constructor as {[key: string]: any}}
    constructor(fen?: FEN) {
        this.board = this.bitboardsFromFen(fen ?? this.ctor.default_position);
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
        console.log(bitboards);
        return bitboards;
    }
    load(fen: FEN) {this.board = this.bitboardsFromFen(fen);}
    get(square: Square): Piece|undefined { //TODO
        if (this.board.kings.white == square) {return {type: PieceType.KING, color: Color.WHITE}}
        else if (this.board.kings.black == square) {return {type: PieceType.KING, color: Color.BLACK}}

        for (const key of ['pawns','bishops','knights','rooks','queens']) {
            for (const color of ['white','black']) {
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
}