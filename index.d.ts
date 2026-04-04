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