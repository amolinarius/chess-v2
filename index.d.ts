/**
 * A Forsyth-Edwards Notation (FEN) string
 * @structure gamestate nextplayer castle enpassant halfmoves fullmoves
 * @see https://en.wikipedia.org/wiki/Forsyth-Edwards_Notation
 * @example
 * // Starting position
 * rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
 * 
 * // After the move 1.e4
 * rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1
 */
type FEN = string;

/**
 * A 64-bit unsigned integer containing the position of certain pieces starting at top left-hand corner
 * @see https://www.chessprogramming.org/Bitboards
 * @example
 * // Black rooks bitmask on base position
 * 0b10000001 // = 129
 * // White pawns bitmask on base position
 * 0b11111111 << 48
 */
type Bitboard = bigint;
type BitboardKey = 'pawns'|'bishops'|'knights'|'rooks'|'queens'|'kings';

type Bitboards = { [key in Exclude<BitboardKey, 'kings'>]: {white: bigint, black: bigint} } & { kings: {white: number, black: number} }; //? Since there is only one king, we can just store its index

/**
 * A 4-bit unsigned integer representing the properties of a move
 * @see https://www.chessprogramming.org/Encoding_Moves
 * @structure promotion capture special0 special1
 * @values
 * | Code | Binary value | Move type                  |
 * | ---- | ------------ | -------------------------- |
 * | 0    | `0b0000`     | Quiet move                 |
 * | 1    | `0b0001`     | Double pawn                |
 * | 2    | `0b0010`     | Kingside castle            |
 * | 3    | `0b0011`     | Queenside castle           |
 * | 4    | `0b0100`     | Capture                    |
 * | 5    | `0b0101`     | En-passant                 |
 * | 8    | `0b1000`     | Knight promotion           |
 * | 9    | `0b1001`     | Bishop promotion           |
 * | 10   | `0b1010`     | Rook promotion             |
 * | 11   | `0b1011`     | Queen promotion            |
 * | 12   | `0b1100`     | Knight promotion + capture |
 * | 13   | `0b1101`     | Bishop promotion + capture |
 * | 14   | `0b1110`     | Rook promotion + capture   |
 * | 15   | `0b1111`     | Queen promotion + capture  |
 */
type MoveFlags = number;

/**
 * A 16-bit unsigned integer representing a move, with 12 bits for origin/destination squares (6 bits each) + 4 bits for move flags
 * @see https://www.chessprogramming.org/Encoding_Moves
 * @see {@link MoveFlags}
 * @structure origin destination flags
 */
type MoveRepresentation = number;

interface Move {
    value: MoveRepresentation;
    isCheck: boolean;
    isMate: boolean;
}

/**
 * A 4-bit unsigned integer representing players' castling rights
 * @see https://www.chessprogramming.org/Castling_Rights
 * @structure white_kingside white_queenside black_kingside black_queenside
 */
type CastlingRights = number;