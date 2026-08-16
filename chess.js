const PIECES = {

    w: {
        k: "♔",
        q: "♕",
        r: "♖",
        b: "♗",
        n: "♘",
        p: "♙"
    },

    b: {
        k: "♚",
        q: "♛",
        r: "♜",
        b: "♝",
        n: "♞",
        p: "♟"
    }

};


const VALUES = {

    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000

};


let board = [];

let turn = "w";

let selected = null;

let selectedMoves = [];

let history = [];

let capturedWhite = [];

let capturedBlack = [];

let lastMove = null;

let gameTime = 300;

let whiteTime = 300;

let blackTime = 300;

let timer = null;

let gameOver = false;

let enPassant = null;

let promotionMove = null;


let castle = {

    wK: true,
    wQ: true,
    bK: true,
    bQ: true

};



const boardElement =
    document.getElementById("chessBoard");

const gameStatus =
    document.getElementById("gameStatus");

const moveNumber =
    document.getElementById("moveNumber");

const moveList =
    document.getElementById("moveList");

const whiteClock =
    document.getElementById("whiteClock");

const blackClock =
    document.getElementById("blackClock");

const whiteState =
    document.getElementById("whiteState");

const blackState =
    document.getElementById("blackState");

const whiteCaptured =
    document.getElementById("whiteCaptured");

const blackCaptured =
    document.getElementById("blackCaptured");

const promotionModal =
    document.getElementById("promotionModal");

const gameOverModal =
    document.getElementById("gameOverModal");

const gameOverTitle =
    document.getElementById("gameOverTitle");

const gameOverMessage =
    document.getElementById("gameOverMessage");



function initialBoard() {

    return [

        [
            "br","bn","bb","bq",
            "bk","bb","bn","br"
        ],

        [
            "bp","bp","bp","bp",
            "bp","bp","bp","bp"
        ],

        [
            null,null,null,null,
            null,null,null,null
        ],

        [
            null,null,null,null,
            null,null,null,null
        ],

        [
            null,null,null,null,
            null,null,null,null
        ],

        [
            null,null,null,null,
            null,null,null,null
        ],

        [
            "wp","wp","wp","wp",
            "wp","wp","wp","wp"
        ],

        [
            "wr","wn","wb","wq",
            "wk","wb","wn","wr"
        ]

    ];

}


function cloneBoard(b) {

    return b.map(
        row => [...row]
    );

}


function inside(r, c) {

    return (
        r >= 0 &&
        r < 8 &&
        c >= 0 &&
        c < 8
    );

}


function color(piece) {

    return piece
        ? piece[0]
        : null;

}


function type(piece) {

    return piece
        ? piece[1]
        : null;

}


function enemy(c) {

    return c === "w"
        ? "b"
        : "w";

}


function squareName(r, c) {

    return (
        String.fromCharCode(97 + c) +
        (8 - r)
    );

}


function formatTime(seconds) {

    seconds =
        Math.max(
            0,
            Math.floor(seconds)
        );

    return (
        String(
            Math.floor(seconds / 60)
        ).padStart(2,"0")
        +
        ":"
        +
        String(
            seconds % 60
        ).padStart(2,"0")
    );

}


/* =========================
   RENDER BOARD
   ========================= */

function renderBoard() {

    boardElement.innerHTML = "";

    for (
        let r = 0;
        r < 8;
        r++
    ) {

        for (
            let c = 0;
            c < 8;
            c++
        ) {

            const square =
                document.createElement("div");


            square.className =
                "square " +
                (
                    (r + c) % 2 === 0
                        ? "light"
                        : "dark"
                );


            square.dataset.row = r;
            square.dataset.col = c;


            if (
                selected &&
                selected.r === r &&
                selected.c === c
            ) {

                square.classList.add(
                    "selected"
                );

            }


            if (
                lastMove &&
                (
                    (
                        lastMove.from.r === r &&
                        lastMove.from.c === c
                    )
                    ||
                    (
                        lastMove.to.r === r &&
                        lastMove.to.c === c
                    )
                )
            ) {

                square.classList.add(
                    "last-move"
                );

            }


            const piece =
                board[r][c];


            if (piece) {

                const element =
                    document.createElement("div");


                element.className =
                    "piece " +
                    (
                        color(piece) === "w"
                            ? "white"
                            : "black"
                    );


                element.textContent =
                    PIECES[
                        color(piece)
                    ][
                        type(piece)
                    ];


                square.appendChild(
                    element
                );

            }


            const possible =
                selectedMoves.find(
                    m =>
                        m.to.r === r &&
                        m.to.c === c
                );


            if (possible) {

                if (board[r][c]) {

                    square.classList.add(
                        "capture-target"
                    );

                } else {

                    square.classList.add(
                        "legal-dot"
                    );

                }

            }


            if (
                piece &&
                type(piece) === "k" &&
                isCheck(
                    board,
                    color(piece)
                )
            ) {

                square.classList.add(
                    "check"
                );

            }


            square.addEventListener(
                "click",
                () => clickSquare(r,c)
            );


            boardElement.appendChild(
                square
            );

        }

    }

}


/* =========================
   SLIDING MOVES
   ========================= */

function slide(
    position,
    r,
    c,
    dirs,
    moves
) {

    const moving =
        position[r][c];

    const movingColor =
        color(moving);


    for (
        const [dr,dc]
        of dirs
    ) {

        let rr = r + dr;
        let cc = c + dc;


        while (
            inside(rr,cc)
        ) {

            const target =
                position[rr][cc];


            if (!target) {

                moves.push({

                    from:{r,c},

                    to:{
                        r:rr,
                        c:cc
                    }

                });

            } else {

                if (
                    color(target) !==
                    movingColor
                ) {

                    moves.push({

                        from:{r,c},

                        to:{
                            r:rr,
                            c:cc
                        }

                    });

                }

                break;

            }


            rr += dr;
            cc += dc;

        }

    }

}


/* =========================
   PSEUDO MOVES
   ========================= */

function pseudoMoves(
    position,
    r,
    c
) {

    const piece =
        position[r][c];

    if (!piece) {
        return [];
    }


    const cColor =
        color(piece);

    const pType =
        type(piece);

    const moves = [];


    function add(
        rr,
        cc,
        extra = {}
    ) {

        if (!inside(rr,cc)) {
            return;
        }


        const target =
            position[rr][cc];


        if (
            target &&
            color(target) === cColor
        ) {
            return;
        }


        moves.push({

            from:{r,c},

            to:{
                r:rr,
                c:cc
            },

            ...extra

        });

    }


    /* PAWN */

    if (pType === "p") {

        const direction =
            cColor === "w"
                ? -1
                : 1;


        const start =
            cColor === "w"
                ? 6
                : 1;


        const promotionRow =
            cColor === "w"
                ? 0
                : 7;


        const one =
            r + direction;


        if (
            inside(one,c) &&
            !position[one][c]
        ) {

            add(
                one,
                c,
                {
                    promotion:
                        one === promotionRow
                }
            );


            const two =
                r +
                direction * 2;


            if (
                r === start &&
                !position[two][c]
            ) {

                add(
                    two,
                    c
                );

            }

        }


        for (
            const dc of [-1,1]
        ) {

            const rr =
                r + direction;

            const cc =
                c + dc;


            if (!inside(rr,cc)) {
                continue;
            }


            const target =
                position[rr][cc];


            if (
                target &&
                color(target) !== cColor
            ) {

                add(
                    rr,
                    cc,
                    {
                        promotion:
                            rr === promotionRow
                    }
                );

            }


            if (
                enPassant &&
                enPassant.r === rr &&
                enPassant.c === cc
            ) {

                add(
                    rr,
                    cc,
                    {
                        enPassant:true
                    }
                );

            }

        }

    }


    /* KNIGHT */

    if (pType === "n") {

        const jumps = [

            [-2,-1],
            [-2,1],
            [-1,-2],
            [-1,2],
            [1,-2],
            [1,2],
            [2,-1],
            [2,1]

        ];


        jumps.forEach(
            ([dr,dc]) =>
                add(
                    r+dr,
                    c+dc
                )
        );

    }


    /* BISHOP */

    if (pType === "b") {

        slide(
            position,
            r,
            c,
            [
                [-1,-1],
                [-1,1],
                [1,-1],
                [1,1]
            ],
            moves
        );

    }


    /* ROOK */

    if (pType === "r") {

        slide(
            position,
            r,
            c,
            [
                [-1,0],
                [1,0],
                [0,-1],
                [0,1]
            ],
            moves
        );

    }


    /* QUEEN */

    if (pType === "q") {

        slide(
            position,
            r,
            c,
            [
                [-1,-1],
                [-1,1],
                [1,-1],
                [1,1],
                [-1,0],
                [1,0],
                [0,-1],
                [0,1]
            ],
            moves
        );

    }


    /* KING */

    if (pType === "k") {

        for (
            let dr=-1;
            dr<=1;
            dr++
        ) {

            for (
                let dc=-1;
                dc<=1;
                dc++
            ) {

                if (
                    dr === 0 &&
                    dc === 0
                ) {
                    continue;
                }


                add(
                    r+dr,
                    c+dc
                );

            }

        }


        /* CASTLING */

        if (
            cColor === "w" &&
            r === 7 &&
            c === 4
        ) {

            if (
                castle.wK &&
                position[7][5] === null &&
                position[7][6] === null &&
                position[7][7] === "wr" &&
                !attacked(
                    position,
                    7,
                    4,
                    "b"
                ) &&
                !attacked(
                    position,
                    7,
                    5,
                    "b"
                ) &&
                !attacked(
                    position,
                    7,
                    6,
                    "b"
                )
            ) {

                add(
                    7,
                    6,
                    {
                        castle:"king"
                    }
                );

            }


            if (
                castle.wQ &&
                position[7][1] === null &&
                position[7][2] === null &&
                position[7][3] === null &&
                position[7][0] === "wr" &&
                !attacked(
                    position,
                    7,
                    4,
                    "b"
                ) &&
                !attacked(
                    position,
                    7,
                    3,
                    "b"
                ) &&
                !attacked(
                    position,
                    7,
                    2,
                    "b"
                )
            ) {

                add(
                    7,
                    2,
                    {
                        castle:"queen"
                    }
                );

            }

        }


        if (
            cColor === "b" &&
            r === 0 &&
            c === 4
        ) {

            if (
                castle.bK &&
                position[0][5] === null &&
                position[0][6] === null &&
                position[0][7] === "br" &&
                !attacked(
                    position,
                    0,
                    4,
                    "w"
                ) &&
                !attacked(
                    position,
                    0,
                    5,
                    "w"
                ) &&
                !attacked(
                    position,
                    0,
                    6,
                    "w"
                )
            ) {

                add(
                    0,
                    6,
                    {
                        castle:"king"
                    }
                );

            }


            if (
                castle.bQ &&
                position[0][1] === null &&
                position[0][2] === null &&
                position[0][3] === null &&
                position[0][0] === "br" &&
                !attacked(
                    position,
                    0,
                    4,
                    "w"
                ) &&
                !attacked(
                    position,
                    0,
                    3,
                    "w"
                ) &&
                !attacked(
                    position,
                    0,
                    2,
                    "w"
                )
            ) {

                add(
                    0,
                    2,
                    {
                        castle:"queen"
                    }
                );

            }

        }

    }


    return moves;

}


/* =========================
   KING
   ========================= */

function findKing(
    position,
    cColor
) {

    for (
        let r=0;
        r<8;
        r++
    ) {

        for (
            let c=0;
            c<8;
            c++
        ) {

            if (
                position[r][c] ===
                cColor + "k"
            ) {

                return {r,c};

            }

        }

    }

    return null;

}


/* =========================
   ATTACKED SQUARE
   ========================= */

function attacked(
    position,
    row,
    col,
    attacker
) {

    for (
        let r=0;
        r<8;
        r++
    ) {

        for (
            let c=0;
            c<8;
            c++
        ) {

            const piece =
                position[r][c];


            if (
                !piece ||
                color(piece) !== attacker
            ) {
                continue;
            }


            const p =
                type(piece);


            /* Pawn */

            if (p === "p") {

                const dir =
                    attacker === "w"
                        ? -1
                        : 1;


                if (
                    r + dir === row &&
                    (
                        c - 1 === col ||
                        c + 1 === col
                    )
                ) {

                    return true;

                }

            }


            /* Knight */

            if (p === "n") {

                const dr =
                    Math.abs(r-row);

                const dc =
                    Math.abs(c-col);


                if (
                    (
                        dr === 2 &&
                        dc === 1
                    )
                    ||
                    (
                        dr === 1 &&
                        dc === 2
                    )
                ) {

                    return true;

                }

            }


            /* King */

            if (p === "k") {

                if (
                    Math.abs(r-row) <= 1 &&
                    Math.abs(c-col) <= 1
                ) {

                    return true;

                }

            }


            let dirs = [];


            if (
                p === "b" ||
                p === "q"
            ) {

                dirs.push(
                    [-1,-1],
                    [-1,1],
                    [1,-1],
                    [1,1]
                );

            }


            if (
                p === "r" ||
                p === "q"
            ) {

                dirs.push(
                    [-1,0],
                    [1,0],
                    [0,-1],
                    [0,1]
                );

            }


            for (
                const [dr,dc]
                of dirs
            ) {

                let rr = r+dr;
                let cc = c+dc;


                while (
                    inside(rr,cc)
                ) {

                    if (
                        rr === row &&
                        cc === col
                    ) {

                        return true;

                    }


                    if (
                        position[rr][cc]
                    ) {

                        break;

                    }


                    rr += dr;
                    cc += dc;

                }

            }

        }

    }

    return false;

}


/* =========================
   CHECK
   ========================= */

function isCheck(
    position,
    cColor
) {

    const king =
        findKing(
            position,
            cColor
        );


    if (!king) {
        return true;
    }


    return attacked(
        position,
        king.r,
        king.c,
        enemy(cColor)
    );

}


/* =========================
   APPLY MOVE
   ========================= */

function applyMove(
    position,
    move,
    promotion = "q"
) {

    const result =
        cloneBoard(position);


    const piece =
        result[
            move.from.r
        ][
            move.from.c
        ];


    result[
        move.from.r
    ][
        move.from.c
    ] = null;


    result[
        move.to.r
    ][
        move.to.c
    ] = piece;


    /* En passant */

    if (
        move.enPassant
    ) {

        result[
            move.from.r
        ][
            move.to.c
        ] = null;

    }


    /* Castle */

    if (
        move.castle === "king"
    ) {

        const r =
            move.from.r;


        result[r][5] =
            result[r][7];

        result[r][7] =
            null;

    }


    if (
        move.castle === "queen"
    ) {

        const r =
            move.from.r;


        result[r][3] =
            result[r][0];

        result[r][0] =
            null;

    }


    /* Promotion */

    if (
        move.promotion
    ) {

        result[
            move.to.r
        ][
            move.to.c
        ] =
            color(piece) +
            promotion;

    }


    return result;

}


/* =========================
   LEGAL MOVES
   ========================= */

function legalMoves(
    position,
    cColor
) {

    const result = [];


    for (
        let r=0;
        r<8;
        r++
    ) {

        for (
            let c=0;
            c<8;
            c++
        ) {

            const piece =
                position[r][c];


            if (
                !piece ||
                color(piece) !== cColor
            ) {
                continue;
            }


            const moves =
                pseudoMoves(
                    position,
                    r,
                    c
                );


            for (
                const move of moves
            ) {

                const next =
                    applyMove(
                        position,
                        move
                    );


                if (
                    !isCheck(
                        next,
                        cColor
                    )
                ) {

                    result.push(
                        move
                    );

                }

            }

        }

    }


    return result;

}


/* =========================
   CLICK SQUARE
   ========================= */

function clickSquare(r,c) {

    if (
        gameOver
    ) {
        return;
    }


    const piece =
        board[r][c];


    /* Select piece */

    if (
        piece &&
        color(piece) === turn
    ) {

        selected = {r,c};


        selectedMoves =
            legalMoves(
                board,
                turn
            ).filter(
                move =>
                    move.from.r === r &&
                    move.from.c === c
            );


        renderBoard();

        return;

    }


    /* Move */

    if (selected) {

        const move =
            selectedMoves.find(
                m =>
                    m.to.r === r &&
                    m.to.c === c
            );


        if (!move) {
            return;
        }


        if (
            move.promotion
        ) {

            promotionMove =
                move;


            promotionModal.classList.remove(
                "hidden"
            );

        } else {

            makeMove(move);

        }

    }

}


/* =========================
   MAKE MOVE
   ========================= */

function makeMove(
    move,
    promotion = null
) {

    const movingPiece =
        board[
            move.from.r
        ][
            move.from.c
        ];


    const captured =
        board[
            move.to.r
        ][
            move.to.c
        ];


    /* Capture */

    if (captured) {

        if (
            color(captured) === "w"
        ) {

            capturedWhite.push(
                captured
            );

        } else {

            capturedBlack.push(
                captured
            );

        }

    }


    /* En passant capture */

    if (
        move.enPassant
    ) {

        const pawn =
            board[
                move.from.r
            ][
                move.to.c
            ];


        if (pawn) {

            if (
                color(pawn) === "w"
            ) {

                capturedWhite.push(
                    pawn
                );

            } else {

                capturedBlack.push(
                    pawn
                );

            }

        }

    }


    const notation =
        notationForMove(
            board,
            move,
            promotion
        );


    board =
        applyMove(
            board,
            move,
            promotion || "q"
        );


    /* Castling rights */

    if (
        movingPiece === "wk"
    ) {

        castle.wK = false;
        castle.wQ = false;

    }


    if (
        movingPiece === "bk"
    ) {

        castle.bK = false;
        castle.bQ = false;

    }


    if (
        move.from.r === 7 &&
        move.from.c === 0
    ) {
        castle.wQ = false;
    }


    if (
        move.from.r === 7 &&
        move.from.c === 7
    ) {
        castle.wK = false;
    }


    if (
        move.from.r === 0 &&
        move.from.c === 0
    ) {
        castle.bQ = false;
    }


    if (
        move.from.r === 0 &&
        move.from.c === 7
    ) {
        castle.bK = false;
    }


    /* En passant target */

    enPassant = null;


    if (
        type(movingPiece) === "p" &&
        Math.abs(
            move.to.r -
            move.from.r
        ) === 2
    ) {

        enPassant = {

            r:
                (
                    move.from.r +
                    move.to.r
                ) / 2,

            c:
                move.from.c

        };

    }


    history.push({

        color:
            color(movingPiece),

        notation

    });


    lastMove = {

        from:{
            ...move.from
        },

        to:{
            ...move.to
        }

    };


    turn =
        enemy(turn);


    selected = null;

    selectedMoves = [];


    update();


    checkGame();

}


/* =========================
   NOTATION
   ========================= */

function notationForMove(
    position,
    move,
    promotion
) {

    const piece =
        position[
            move.from.r
        ][
            move.from.c
        ];


    if (
        move.castle === "king"
    ) {
        return "O-O";
    }


    if (
        move.castle === "queen"
    ) {
        return "O-O-O";
    }


    const letters = {

        p:"",
        n:"N",
        b:"B",
        r:"R",
        q:"Q",
        k:"K"

    };


    let result =
        letters[
            type(piece)
        ];


    const capture =
        position[
            move.to.r
        ][
            move.to.c
        ] ||
        move.enPassant;


    if (capture) {

        if (
            type(piece) === "p"
        ) {

            result +=
                String.fromCharCode(
                    97 +
                    move.from.c
                );

        }


        result += "x";

    }


    result +=
        squareName(
            move.to.r,
            move.to.c
        );


    if (promotion) {

        result +=
            "=" +
            promotion.toUpperCase();

    }


    return result;

}


/* =========================
   GAME CHECK
   ========================= */

function checkGame() {

    const moves =
        legalMoves(
            board,
            turn
        );


    const check =
        isCheck(
            board,
            turn
        );


    if (
        moves.length === 0
    ) {

        gameOver = true;

        stopTimer();


        if (check) {

            const winner =
                enemy(turn) === "w"
                    ? "White"
                    : "Black";


            showGameOver(
                "CHECKMATE",
                winner +
                " wins the game."
            );

        } else {

            showGameOver(
                "STALEMATE",
                "The game ends in a draw."
            );

        }


        return;

    }


    gameStatus.textContent =
        (
            turn === "w"
                ? "White"
                : "Black"
        )
        +
        (
            check
                ? " is in check"
                : " to move"
        );

}


/* =========================
   GAME OVER
   ========================= */

function showGameOver(
    title,
    message
) {

    gameOverTitle.textContent =
        title;

    gameOverMessage.textContent =
        message;


    gameOverModal.classList.remove(
        "hidden"
    );

}


/* =========================
   TIMER
   ========================= */

function startTimer() {

    stopTimer();


    timer =
        setInterval(
            () => {

                if (
                    gameOver
                ) {
                    return;
                }


                if (
                    turn === "w"
                ) {

                    whiteTime--;

                } else {

                    blackTime--;

                }


                updateClocks();


                if (
                    whiteTime <= 0
                ) {

                    whiteTime = 0;

                    gameOver = true;

                    stopTimer();

                    showGameOver(
                        "TIME OUT",
                        "Black wins on time."
                    );

                }


                if (
                    blackTime <= 0
                ) {

                    blackTime = 0;

                    gameOver = true;

                    stopTimer();

                    showGameOver(
                        "TIME OUT",
                        "White wins on time."
                    );

                }

            },
            1000
        );

}


function stopTimer() {

    if (timer) {

        clearInterval(timer);

        timer = null;

    }

}


/* =========================
   CLOCK
   ========================= */

function updateClocks() {

    whiteClock.textContent =
        formatTime(
            whiteTime
        );


    blackClock.textContent =
        formatTime(
            blackTime
        );


    whiteClock.classList.toggle(
        "active",
        turn === "w" &&
        !gameOver
    );


    blackClock.classList.toggle(
        "active",
        turn === "b" &&
        !gameOver
    );


    whiteClock.classList.toggle(
        "low-time",
        whiteTime <= 30
    );


    blackClock.classList.toggle(
        "low-time",
        blackTime <= 30
    );

}


/* =========================
   HISTORY
   ========================= */

function renderHistory() {

    if (
        history.length === 0
    ) {

        moveList.innerHTML =
            `
            <div class="empty-moves">
                No moves yet
            </div>
            `;

        return;

    }


    moveList.innerHTML = "";


    for (
        let i=0;
        i<history.length;
        i+=2
    ) {

        const row =
            document.createElement("div");


        row.className =
            "move-row";


        row.innerHTML = `

            <span class="move-index">
                ${Math.floor(i/2)+1}.
            </span>

            <span class="move-white">
                ${
                    history[i]
                        ? history[i].notation
                        : ""
                }
            </span>

            <span class="move-black">
                ${
                    history[i+1]
                        ? history[i+1].notation
                        : ""
                }
            </span>

        `;


        moveList.appendChild(row);

    }

}


/* =========================
   CAPTURED
   ========================= */

function renderCaptured() {

    blackCaptured.innerHTML =
        capturedBlack
            .map(
                p =>
                    PIECES[
                        color(p)
                    ][
                        type(p)
                    ]
            )
            .join("");


    whiteCaptured.innerHTML =
        capturedWhite
            .map(
                p =>
                    PIECES[
                        color(p)
                    ][
                        type(p)
                    ]
            )
            .join("");

}


/* =========================
   UPDATE UI
   ========================= */

function update() {

    renderBoard();

    renderHistory();

    renderCaptured();

    updateClocks();


    moveNumber.textContent =
        Math.floor(
            history.length / 2
        ) + 1;


    document.getElementById(
        "modeInfo"
    ).textContent =
        "Local 1v1";


    document.getElementById(
        "turnInfo"
    ).textContent =
        turn === "w"
            ? "White"
            : "Black";


    document.getElementById(
        "timeInfo"
    ).textContent =
        Math.floor(
            gameTime / 60
        )
        +
        " + 0";


    whiteState.textContent =
        turn === "w"
            ? "Your turn"
            : "Waiting";


    blackState.textContent =
        turn === "b"
            ? "Your turn"
            : "Waiting";

}


/* =========================
   NEW GAME
   ========================= */

function newGame() {

    stopTimer();


    board =
        initialBoard();


    turn = "w";

    selected = null;

    selectedMoves = [];

    history = [];

    capturedWhite = [];

    capturedBlack = [];

    lastMove = null;

    gameOver = false;

    promotionMove = null;

    enPassant = null;


    castle = {

        wK:true,
        wQ:true,
        bK:true,
        bQ:true

    };


    whiteTime =
        gameTime;

    blackTime =
        gameTime;


    gameOverModal.classList.add(
        "hidden"
    );


    gameStatus.textContent =
        "White to move";


    update();

    startTimer();

}


/* =========================
   TIME BUTTONS
   ========================= */

document
    .querySelectorAll(
        ".time-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".time-button"
                        )
                        .forEach(
                            b =>
                                b.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    gameTime =
                        Number(
                            button.dataset.time
                        );


                    newGame();

                }
            );

        }
    );


/* =========================
   BUTTONS
   ========================= */

document
    .getElementById(
        "newGameButton"
    )
    .addEventListener(
        "click",
        newGame
    );


document
    .getElementById(
        "mobileNewGame"
    )
    .addEventListener(
        "click",
        newGame
    );


document
    .getElementById(
        "modalNewGame"
    )
    .addEventListener(
        "click",
        newGame
    );


/* =========================
   RESIGN
   ========================= */

function resign() {

    if (gameOver) {
        return;
    }


    const winner =
        turn === "w"
            ? "Black"
            : "White";


    if (
        confirm(
            "Are you sure you want to resign?"
        )
    ) {

        gameOver = true;

        stopTimer();


        showGameOver(
            "RESIGNATION",
            winner +
            " wins the game."
        );

    }

}


document
    .getElementById(
        "resignButton"
    )
    .addEventListener(
        "click",
        resign
    );


document
    .getElementById(
        "mobileResign"
    )
    .addEventListener(
        "click",
        resign
    );


/* =========================
   DRAW
   ========================= */

document
    .getElementById(
        "drawButton"
    )
    .addEventListener(
        "click",
        () => {

            if (gameOver) {
                return;
            }


            if (
                confirm(
                    "Accept a draw?"
                )
            ) {

                gameOver = true;

                stopTimer();


                showGameOver(
                    "DRAW",
                    "The game ends in a draw."
                );

            }

        }
    );


/* =========================
   PROMOTION
   ========================= */

document
    .querySelectorAll(
        ".promotion-options button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        !promotionMove
                    ) {
                        return;
                    }


                    const piece =
                        button.dataset.piece;


                    promotionModal.classList.add(
                        "hidden"
                    );


                    makeMove(
                        promotionMove,
                        piece
                    );


                    promotionMove = null;

                }
            );

        }
    );


/* =========================
   START GAME
   ========================= */

newGame();