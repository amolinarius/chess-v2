import Chess from "./engine/main";
import Utils, { stylesheet } from "./utils";
import { Color, type Piece, type Square } from "./enums";

export class Cell {
    square: Square;
    color: Color;
    piece?: Piece;
    element?: HTMLTableCellElement;
    selected: boolean = false;
    highlighted: boolean = false;
    isMove: boolean = false;
    constructor({ square, color, piece }: {square: Square, color: Color, piece?: Piece}) {
        this.square = square;
        this.color = color;
        this.piece = piece;
    }
    //? Flowchart: https://excalidraw.com/#json=Ta0mvwLU3NPOdRCnEV1p9,VYQxz1VQLSunbY1bNgxhuQ
    onLeftClick(board: ChessboardElement) {
        if (!this.element) {
            console.error("No element linked to", this, "instance");
            return;
        }
        
        if (board.selection) {
            if (board.selection.square === this.square) {
                Utils.clearSelection(board);
                return
            }
            if (board.selection.isMove) {
                //TODO board.chess.move({ from: board.selection.square, to: this.square });
                Utils.clearSelection(board);
                return;
            }
        }
        Utils.clearSelection(board);
        if (this.piece) {
            this.select(board);
        }
    }
    select(board: ChessboardElement) {
        if (board.selection) {
            board.selection.selected = false;
            board.selection.element?.classList.remove('selected');
        }
        this.selected = true;
        this.element!.classList.add('selected');
        board.selection = this;
        //TODO
        // const moves = board.chess.moves({ square: this.square, verbose: true });
        // for (const move of moves) {
        //     Utils.cellFromBoard(board.board!, move.to).element?.classList.add('move');
        // }
        // console.log(moves);
    }
    
}

export default class ChessboardElement extends HTMLElement {
    chess: Chess;
    private get ctor() {return this.constructor as typeof ChessboardElement}
    constructor() {
        super();
        this.chess = new Chess();
    }
    static css: CSSStyleSheet = stylesheet`
        td {
            width: calc(100% / 8);
            height: calc(100% / 8); /* Considers 100% as width percentage: calc(100% / 8) != 12.5% */
            position: relative;
        }
        td img {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            user-select: none;
            -webkit-user-drag: none;
        }
        td[data-color="white"] { background-color: var(--theme-normal-white) }
        td[data-color="black"] { background-color: var(--theme-normal-black) }
        td.selected[data-color="white"] { background-color: var(--theme-selected-white) }
        td.selected[data-color="black"] { background-color: var(--theme-selected-black) }
        td.highlighted[data-color="white"] { background-color: var(--theme-highlight-white) }
        td.highlighted[data-color="black"] { background-color: var(--theme-highlight-black) }
        td.move::before {
            content: '';
            background-color: var(--theme-move);
            width: 30%;
            height: 30%;
            transform: translate(calc(350% / 3) /* 116.66..6% */, -50%);
            position: absolute;
            border-radius: 50%;
        }
        td.move:has(img)::before {
            background-color: transparent;
            position: absolute;
            width: calc(100% - 10px);
            height: calc(100% - 10px);
            top: 0; right: 0; bottom: 0; left: 0;
            transform: translate(0%);
            border: 5px solid #00000024;
        }
    `;
    
    defaultSize = "500px";
    get size(): string {return this.getAttribute('size') ?? this.defaultSize}
    
    table?: HTMLTableElement;
    board?: Array<Cell[]>;
    selection?: Cell;

    connectedCallback() {
        const fenAttr = this.getAttribute('baseFen');
        if (fenAttr) {this.chess.load(fenAttr)}
        this.board = Utils.boardFromChessInstance(this.chess);
        
        const root = this.attachShadow({ mode: 'open' });
        root.adoptedStyleSheets.push(this.ctor.css);
        this.initShadow(root);
    }

    initShadow(shadowRoot?: ShadowRoot) {
        const root = (shadowRoot??this.shadowRoot!);
        this.table = document.createElement('table');
        this.table.style.borderCollapse = 'collapse';
        this.table.style.width = this.table.style.height = this.size;
        const tbody = this.table.createTBody();

        for (let y=8; y>0; y--) {
            const row = document.createElement('tr');
            row.dataset.row = y.toString();
            for (let x=0; x<8; x++) {
                const cell = document.createElement('td');
                const label = Utils.chars[x]+y;
                cell.dataset.cell = Utils.chars[x];
                cell.dataset.row = y.toString();
                cell.dataset.square = label;
                cell.dataset.color = Utils.isWhite(y*8 + x)?'white':'black';
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
        root.appendChild(this.table);
        this.loadPosition();
    }
    loadPosition(_chess?: Chess) {
        const board = (_chess?Utils.boardFromChessInstance(_chess):this.board)!;
        for (let y=0; y<8; y++) {
            for (let x=0; x<8; x++) {
                const cell = board[y][x];
                const elm = this.shadowRoot!.querySelector<HTMLTableCellElement>(`[data-square=${Utils.chars[x] + (8-y)}]`)!;
                console.log(Utils.chars[x] + (y+1));
                cell.element = elm;
                elm.addEventListener('click', () => cell.onLeftClick(this));

                if (!cell.piece) {continue}
                const img = document.createElement('img');
                img.src = `pieces/${cell.piece.color==Color.WHITE?'w':'b'}${Utils.getPieceSymbol(cell.piece.type)}.png`;
                elm.innerHTML = '';
                elm.appendChild(img);
            }
        }
    }
}