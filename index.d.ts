/**
 * A Forsyth-Edwards Notation (FEN) string
 * @structure gamestate nextplayer castle enpassant halfmoves fullmoves
 * @link https://en.wikipedia.org/wiki/Forsyth-Edwards_Notation
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
 * @link https://www.chessprogramming.org/Bitboards
 * @example
 * // Black rooks bitmask on base position
 * 0b10000001 // = 129
 * // White pawns bitmask on base position
 * 0b11111111 << 48
 */
type Bitboard = bigint;
type BitboardKey = 'pawns'|'bishops'|'knights'|'rooks'|'queens'|'kings';

type Bitboards = { [key in Exclude<BitboardKey, 'kings'>]: {white: bigint, black: bigint} } & { kings: {white: number, black: number} }; //? Since there is only one king, we can just store its index
