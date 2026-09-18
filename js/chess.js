/* =========================================================
   GAMEHUB CHESS ENGINE
   ---------------------------------------------------------
   Handles:
   - Legal movement
   - Captures
   - Check / Checkmate
   - Stalemate
   - Castling
   - En Passant
   - Promotion
   - King safety
   - Board rendering
   - Game messages
   ========================================================= */


/* =========================================================
   DOM
   ========================================================= */

const opponentCards =
    document.querySelectorAll(".opponent-card");

const opponentSelection =
    document.getElementById("opponent-selection");

const chessMatch =
    document.getElementById("chess-match");

const opponentDisplay =
    document.getElementById("opponent-display");

const gamePlayerElement =
    document.getElementById("game-player");

const turnDisplay =
    document.getElementById("turn-display");

const turnMessage =
    document.getElementById("turn-message");

const boardElement =
    document.getElementById("chess-board");

const statusElement =
    document.getElementById("chess-status");

const newMatchButton =
    document.getElementById("new-match");
const gameOverOverlay =
    document.getElementById("game-over-overlay");

const gameOverLabel =
    document.getElementById("game-over-label");

const gameOverTitle =
    document.getElementById("game-over-title");

const gameOverSubtitle =
    document.getElementById("game-over-subtitle");

const rematchButton =
    document.getElementById("rematch-button");


/* =========================================================
   GAME STATE
   ========================================================= */

let selectedOpponent = {
    name: "Friend",
    rating: "Offline",
    mode: "offline"
};

let boardState = [];
let currentTurn = "white";

let selectedSquare = null;

let gameOver = false;
let aiThinking = false;
let leaderboardScoreSaved = false;

let enPassantTarget = null;

let castlingRights = {
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true
};


/* =========================================================
   PIECES
   ========================================================= */

const PIECE_SYMBOLS = {

    wk: "♔",
    wq: "♕",
    wr: "♖",
    wb: "♗",
    wn: "♘",
    wp: "♙",

    bk: "♚",
    bq: "♛",
    br: "♜",
    bb: "♝",
    bn: "♞",
    bp: "♟"

};


const PIECE_NAMES = {

    p: "pawn",
    n: "knight",
    b: "bishop",
    r: "rook",
    q: "queen",
    k: "king"

};


/* =========================================================
   STARTING BOARD
   ========================================================= */

const STARTING_BOARD = [

    [
        "br", "bn", "bb", "bq",
        "bk", "bb", "bn", "br"
    ],

    [
        "bp", "bp", "bp", "bp",
        "bp", "bp", "bp", "bp"
    ],

    [
        null, null, null, null,
        null, null, null, null
    ],

    [
        null, null, null, null,
        null, null, null, null
    ],

    [
        null, null, null, null,
        null, null, null, null
    ],

    [
        null, null, null, null,
        null, null, null, null
    ],

    [
        "wp", "wp", "wp", "wp",
        "wp", "wp", "wp", "wp"
    ],

    [
        "wr", "wn", "wb", "wq",
        "wk", "wb", "wn", "wr"
    ]

];


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function copyBoard(board) {

    return board.map(row => row.slice());

}


function getPieceColor(piece) {

    if (!piece) {
        return null;
    }

    return piece.charAt(0) === "w"
        ? "white"
        : "black";

}


function getPieceType(piece) {

    if (!piece) {
        return null;
    }

    return piece.charAt(1);

}


function oppositeColor(color) {

    return color === "white"
        ? "black"
        : "white";

}


function colorName(color) {

    return color.charAt(0).toUpperCase()
        + color.slice(1);

}


function inBounds(row, col) {

    return (
        row >= 0 &&
        row < 8 &&
        col >= 0 &&
        col < 8
    );

}


function isPromotionRow(row, color) {

    return (
        color === "white"
            ? row === 0
            : row === 7
    );

}


/* =========================================================
   FIND KING
   ========================================================= */

function findKing(color, board = boardState) {

    const king =
        color === "white"
            ? "wk"
            : "bk";

    for (
        let row = 0;
        row < 8;
        row++
    ) {

        for (
            let col = 0;
            col < 8;
            col++
        ) {

            if (board[row][col] === king) {

                return {
                    row,
                    col
                };

            }

        }

    }

    return null;

}


/* =========================================================
   IS SQUARE ATTACKED?
   ---------------------------------------------------------
   Important:
   This checks attacks directly instead of using legal
   moves, which prevents recursive check calculations.
   ========================================================= */

function isSquareAttacked(
    targetRow,
    targetCol,
    attackingColor,
    board = boardState
) {

    /* ---------------------------------------------------------
       PAWNS
       --------------------------------------------------------- */

    const pawnRow =
        attackingColor === "white"
            ? targetRow + 1
            : targetRow - 1;


    for (
        const colOffset of [-1, 1]
    ) {

        const pawnCol =
            targetCol + colOffset;


        if (
            inBounds(
                pawnRow,
                pawnCol
            )
        ) {

            const piece =
                board[pawnRow][pawnCol];


            if (
                piece &&
                getPieceColor(piece) === attackingColor &&
                getPieceType(piece) === "p"
            ) {

                return true;

            }

        }

    }


    /* ---------------------------------------------------------
       KNIGHTS
       --------------------------------------------------------- */

    const knightOffsets = [

        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],

        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1]

    ];


    for (
        const offset of knightOffsets
    ) {

        const row =
            targetRow + offset[0];

        const col =
            targetCol + offset[1];


        if (
            !inBounds(row, col)
        ) {
            continue;
        }


        const piece =
            board[row][col];


        if (
            piece &&
            getPieceColor(piece) === attackingColor &&
            getPieceType(piece) === "n"
        ) {

            return true;

        }

    }


    /* ---------------------------------------------------------
       KING
       --------------------------------------------------------- */

    for (
        let rowOffset = -1;
        rowOffset <= 1;
        rowOffset++
    ) {

        for (
            let colOffset = -1;
            colOffset <= 1;
            colOffset++
        ) {

            if (
                rowOffset === 0 &&
                colOffset === 0
            ) {
                continue;
            }


            const row =
                targetRow + rowOffset;

            const col =
                targetCol + colOffset;


            if (
                !inBounds(row, col)
            ) {
                continue;
            }


            const piece =
                board[row][col];


            if (
                piece &&
                getPieceColor(piece) === attackingColor &&
                getPieceType(piece) === "k"
            ) {

                return true;

            }

        }

    }


    /* ---------------------------------------------------------
       DIAGONALS
       Bishop / Queen
       --------------------------------------------------------- */

    const diagonalDirections = [

        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]

    ];


    for (
        const direction of diagonalDirections
    ) {

        let row =
            targetRow + direction[0];

        let col =
            targetCol + direction[1];


        while (
            inBounds(row, col)
        ) {

            const piece =
                board[row][col];


            if (piece) {

                if (
                    getPieceColor(piece) === attackingColor &&
                    (
                        getPieceType(piece) === "b" ||
                        getPieceType(piece) === "q"
                    )
                ) {

                    return true;

                }

                break;

            }


            row += direction[0];
            col += direction[1];

        }

    }


    /* ---------------------------------------------------------
       STRAIGHT LINES
       Rook / Queen
       --------------------------------------------------------- */

    const straightDirections = [

        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]

    ];


    for (
        const direction of straightDirections
    ) {

        let row =
            targetRow + direction[0];

        let col =
            targetCol + direction[1];


        while (
            inBounds(row, col)
        ) {

            const piece =
                board[row][col];


            if (piece) {

                if (
                    getPieceColor(piece) === attackingColor &&
                    (
                        getPieceType(piece) === "r" ||
                        getPieceType(piece) === "q"
                    )
                ) {

                    return true;

                }

                break;

            }


            row += direction[0];
            col += direction[1];

        }

    }


    return false;

}


/* =========================================================
   CHECK
   ========================================================= */

function isInCheck(
    color,
    board = boardState
) {

    const king =
        findKing(color, board);


    if (!king) {
        return true;
    }


    return isSquareAttacked(
        king.row,
        king.col,
        oppositeColor(color),
        board
    );

}


/* =========================================================
   TARGET VALIDATION
   ========================================================= */

function canCaptureTarget(
    target,
    movingColor
) {

    if (!target) {
        return false;
    }


    if (
        getPieceColor(target) === movingColor
    ) {
        return false;
    }


    /*
       The king is never captured directly.
       Checkmate happens when the king is attacked and
       has no legal escape.
    */

    if (
        getPieceType(target) === "k"
    ) {
        return false;
    }


    return true;

}


/* =========================================================
   PSEUDO-LEGAL MOVES
   ---------------------------------------------------------
   These moves follow piece movement rules but are not yet
   filtered for leaving your own king in check.
   ========================================================= */

function getPseudoLegalMoves(
    fromRow,
    fromCol,
    board = boardState
) {

    const piece =
        board[fromRow][fromCol];


    if (!piece) {
        return [];
    }


    const color =
        getPieceColor(piece);

    const type =
        getPieceType(piece);

    const moves = [];


    /* =========================================================
       PAWN
       ========================================================= */

    if (type === "p") {

        const direction =
            color === "white"
                ? -1
                : 1;

        const startRow =
            color === "white"
                ? 6
                : 1;


        /* -----------------------------------------------------
           One step
           ----------------------------------------------------- */

        const oneStepRow =
            fromRow + direction;


        if (
            inBounds(
                oneStepRow,
                fromCol
            ) &&
            !board[oneStepRow][fromCol]
        ) {

            moves.push({

                row: oneStepRow,
                col: fromCol,

                promotion:
                    isPromotionRow(
                        oneStepRow,
                        color
                    )
                        ? "q"
                        : null

            });


            /* -------------------------------------------------
               Two steps
               ------------------------------------------------- */

            const twoStepRow =
                fromRow +
                direction * 2;


            if (
                fromRow === startRow &&
                !board[twoStepRow][fromCol]
            ) {

                moves.push({

                    row: twoStepRow,
                    col: fromCol

                });

            }

        }


        /* -----------------------------------------------------
           Diagonal captures
           ----------------------------------------------------- */

        for (
            const colOffset of [-1, 1]
        ) {

            const captureRow =
                fromRow + direction;

            const captureCol =
                fromCol + colOffset;


            if (
                !inBounds(
                    captureRow,
                    captureCol
                )
            ) {
                continue;
            }


            const target =
                board[
                    captureRow
                ][
                    captureCol
                ];


            if (
                canCaptureTarget(
                    target,
                    color
                )
            ) {

                moves.push({

                    row: captureRow,
                    col: captureCol,

                    capture: true,

                    promotion:
                        isPromotionRow(
                            captureRow,
                            color
                        )
                            ? "q"
                            : null

                });

            }


            /* -------------------------------------------------
               En passant
               ------------------------------------------------- */

            if (
                !target &&
                enPassantTarget &&
                enPassantTarget.row === captureRow &&
                enPassantTarget.col === captureCol
            ) {

                moves.push({

                    row: captureRow,
                    col: captureCol,

                    enPassant: true

                });

            }

        }

    }


    /* =========================================================
       KNIGHT
       ========================================================= */

    if (type === "n") {

        const offsets = [

            [-2, -1],
            [-2, 1],
            [-1, -2],
            [-1, 2],

            [1, -2],
            [1, 2],
            [2, -1],
            [2, 1]

        ];


        for (
            const offset of offsets
        ) {

            const row =
                fromRow + offset[0];

            const col =
                fromCol + offset[1];


            if (
                !inBounds(row, col)
            ) {
                continue;
            }


            const target =
                board[row][col];


            if (
                !target
            ) {

                moves.push({
                    row,
                    col
                });

            } else if (
                canCaptureTarget(
                    target,
                    color
                )
            ) {

                moves.push({

                    row,
                    col,

                    capture: true

                });

            }

        }

    }


    /* =========================================================
       BISHOP / ROOK / QUEEN
       ========================================================= */

    if (
        type === "b" ||
        type === "r" ||
        type === "q"
    ) {

        const directions = [];


        if (
            type === "b" ||
            type === "q"
        ) {

            directions.push(

                [-1, -1],
                [-1, 1],
                [1, -1],
                [1, 1]

            );

        }


        if (
            type === "r" ||
            type === "q"
        ) {

            directions.push(

                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1]

            );

        }


        for (
            const direction of directions
        ) {

            let row =
                fromRow + direction[0];

            let col =
                fromCol + direction[1];


            while (
                inBounds(row, col)
            ) {

                const target =
                    board[row][col];


                if (!target) {

                    moves.push({
                        row,
                        col
                    });

                } else {

                    if (
                        canCaptureTarget(
                            target,
                            color
                        )
                    ) {

                        moves.push({

                            row,
                            col,

                            capture: true

                        });

                    }

                    break;

                }


                row += direction[0];
                col += direction[1];

            }

        }

    }


    /* =========================================================
       KING
       ========================================================= */

    if (type === "k") {

        for (
            let rowOffset = -1;
            rowOffset <= 1;
            rowOffset++
        ) {

            for (
                let colOffset = -1;
                colOffset <= 1;
                colOffset++
            ) {

                if (
                    rowOffset === 0 &&
                    colOffset === 0
                ) {
                    continue;
                }


                const row =
                    fromRow + rowOffset;

                const col =
                    fromCol + colOffset;


                if (
                    !inBounds(row, col)
                ) {
                    continue;
                }


                const target =
                    board[row][col];


                if (!target) {

                    moves.push({

                        row,
                        col

                    });

                } else if (
                    canCaptureTarget(
                        target,
                        color
                    )
                ) {

                    moves.push({

                        row,
                        col,

                        capture: true

                    });

                }

            }

        }


        /* -----------------------------------------------------
           Castling
           ----------------------------------------------------- */

        const enemyColor =
            oppositeColor(color);


        /* -----------------------------------------------------
           King side
           ----------------------------------------------------- */

        if (
            color === "white" &&
            fromRow === 7 &&
            fromCol === 4 &&
            castlingRights.whiteKingSide &&
            board[7][7] === "wr" &&
            !board[7][5] &&
            !board[7][6] &&
            !isSquareAttacked(
                7,
                4,
                enemyColor,
                board
            ) &&
            !isSquareAttacked(
                7,
                5,
                enemyColor,
                board
            )
        ) {

            moves.push({

                row: 7,
                col: 6,

                castle: "king"

            });

        }


        if (
            color === "black" &&
            fromRow === 0 &&
            fromCol === 4 &&
            castlingRights.blackKingSide &&
            board[0][7] === "br" &&
            !board[0][5] &&
            !board[0][6] &&
            !isSquareAttacked(
                0,
                4,
                enemyColor,
                board
            ) &&
            !isSquareAttacked(
                0,
                5,
                enemyColor,
                board
            )
        ) {

            moves.push({

                row: 0,
                col: 6,

                castle: "king"

            });

        }


        /* -----------------------------------------------------
           Queen side
           ----------------------------------------------------- */

        if (
            color === "white" &&
            fromRow === 7 &&
            fromCol === 4 &&
            castlingRights.whiteQueenSide &&
            board[7][0] === "wr" &&
            !board[7][1] &&
            !board[7][2] &&
            !board[7][3] &&
            !isSquareAttacked(
                7,
                4,
                enemyColor,
                board
            ) &&
            !isSquareAttacked(
                7,
                3,
                enemyColor,
                board
            )
        ) {

            moves.push({

                row: 7,
                col: 2,

                castle: "queen"

            });

        }


        if (
            color === "black" &&
            fromRow === 0 &&
            fromCol === 4 &&
            castlingRights.blackQueenSide &&
            board[0][0] === "br" &&
            !board[0][1] &&
            !board[0][2] &&
            !board[0][3] &&
            !isSquareAttacked(
                0,
                4,
                enemyColor,
                board
            ) &&
            !isSquareAttacked(
                0,
                3,
                enemyColor,
                board
            )
        ) {

            moves.push({

                row: 0,
                col: 2,

                castle: "queen"

            });

        }

    }


    return moves;

}


/* =========================================================
   APPLY MOVE TO A COPY
   ---------------------------------------------------------
   Used to test whether moving a piece would leave its own
   king in check.
   ========================================================= */

function applyMoveToBoard(
    board,
    fromRow,
    fromCol,
    move
) {

    const nextBoard =
        copyBoard(board);


    const movingPiece =
        nextBoard[fromRow][fromCol];


    const color =
        getPieceColor(movingPiece);


    nextBoard[fromRow][fromCol] =
        null;


    /* ---------------------------------------------------------
       En passant capture
       --------------------------------------------------------- */

    if (
        move.enPassant
    ) {

        const capturedPawnRow =
            move.row +
            (
                color === "white"
                    ? 1
                    : -1
            );


        nextBoard[
            capturedPawnRow
        ][
            move.col
        ] = null;

    }


    /* ---------------------------------------------------------
       Promotion
       --------------------------------------------------------- */

    if (
        move.promotion
    ) {

        nextBoard[move.row][move.col] =
            color.charAt(0)
            + move.promotion;

    } else {

        nextBoard[move.row][move.col] =
            movingPiece;

    }


    /* ---------------------------------------------------------
       Castling rook movement
       --------------------------------------------------------- */

    if (
        move.castle === "king"
    ) {

        if (color === "white") {

            nextBoard[7][5] =
                nextBoard[7][7];

            nextBoard[7][7] =
                null;

        } else {

            nextBoard[0][5] =
                nextBoard[0][7];

            nextBoard[0][7] =
                null;

        }

    }


    if (
        move.castle === "queen"
    ) {

        if (color === "white") {

            nextBoard[7][3] =
                nextBoard[7][0];

            nextBoard[7][0] =
                null;

        } else {

            nextBoard[0][3] =
                nextBoard[0][0];

            nextBoard[0][0] =
                null;

        }

    }


    return nextBoard;

}


/* =========================================================
   LEGAL MOVES
   ========================================================= */

function getLegalMovesForPiece(
    fromRow,
    fromCol
) {

    const piece =
        boardState[fromRow][fromCol];


    if (!piece) {
        return [];
    }


    const color =
        getPieceColor(piece);


    const pseudoMoves =
        getPseudoLegalMoves(
            fromRow,
            fromCol
        );


    return pseudoMoves.filter(move => {

        const simulatedBoard =
            applyMoveToBoard(
                boardState,
                fromRow,
                fromCol,
                move
            );


        const king =
            findKing(
                color,
                simulatedBoard
            );


        if (!king) {
            return false;
        }


        return !isSquareAttacked(
            king.row,
            king.col,
            oppositeColor(color),
            simulatedBoard
        );

    });

}


/* =========================================================
   ALL LEGAL MOVES FOR A COLOR
   ========================================================= */

function getAllLegalMoves(color) {

    const allMoves = [];


    for (
        let row = 0;
        row < 8;
        row++
    ) {

        for (
            let col = 0;
            col < 8;
            col++
        ) {

            const piece =
                boardState[row][col];


            if (
                piece &&
                getPieceColor(piece) === color
            ) {

                const moves =
                    getLegalMovesForPiece(
                        row,
                        col
                    );


                moves.forEach(move => {

                    allMoves.push({

                        fromRow: row,
                        fromCol: col,

                        ...move

                    });

                });

            }

        }

    }


    return allMoves;

}


/* =========================================================
   CASTLING RIGHTS
   ========================================================= */

function updateCastlingRights(
    movingPiece,
    fromRow,
    fromCol,
    capturedPiece,
    toRow,
    toCol
) {

    const type =
        getPieceType(movingPiece);

    const color =
        getPieceColor(movingPiece);


    /* ---------------------------------------------------------
       King moved
       --------------------------------------------------------- */

    if (type === "k") {

        if (color === "white") {

            castlingRights.whiteKingSide =
                false;

            castlingRights.whiteQueenSide =
                false;

        } else {

            castlingRights.blackKingSide =
                false;

            castlingRights.blackQueenSide =
                false;

        }

    }


    /* ---------------------------------------------------------
       Rook moved
       --------------------------------------------------------- */

    if (type === "r") {

        if (
            fromRow === 7 &&
            fromCol === 0
        ) {

            castlingRights.whiteQueenSide =
                false;

        }

        if (
            fromRow === 7 &&
            fromCol === 7
        ) {

            castlingRights.whiteKingSide =
                false;

        }

        if (
            fromRow === 0 &&
            fromCol === 0
        ) {

            castlingRights.blackQueenSide =
                false;

        }

        if (
            fromRow === 0 &&
            fromCol === 7
        ) {

            castlingRights.blackKingSide =
                false;

        }

    }


    /* ---------------------------------------------------------
       Rook captured
       --------------------------------------------------------- */

    if (
        capturedPiece &&
        getPieceType(capturedPiece) === "r"
    ) {

        if (
            toRow === 7 &&
            toCol === 0
        ) {

            castlingRights.whiteQueenSide =
                false;

        }

        if (
            toRow === 7 &&
            toCol === 7
        ) {

            castlingRights.whiteKingSide =
                false;

        }

        if (
            toRow === 0 &&
            toCol === 0
        ) {

            castlingRights.blackQueenSide =
                false;

        }

        if (
            toRow === 0 &&
            toCol === 7
        ) {

            castlingRights.blackKingSide =
                false;

        }

    }

}

/* =========================================================
   FLASH CHECKED KING
========================================================= */

function flashCheckedKing(color) {

    const king =
        findKing(color);

    if (!king) {
        return;
    }

    const squares =
        boardElement.querySelectorAll(
            ".chess-square"
        );

    const index =
        king.row * 8 +
        king.col;

    const kingSquare =
        squares[index];

    if (!kingSquare) {
        return;
    }

    /*
       Remove the class first so the animation can be
       triggered again on the next check.
    */
    kingSquare.classList.remove(
        "check-flash"
    );

    /*
       Force browser reflow so the animation restarts.
    */
    void kingSquare.offsetWidth;

    kingSquare.classList.add(
        "check-flash"
    );

    setTimeout(() => {

        kingSquare.classList.remove(
            "check-flash"
        );

    }, 1000);

}
/* =========================================================
   PROMOTION
   ========================================================= */

function choosePromotion(color) {

    let choice =
        window.prompt(
            "Promote your pawn:\n\n" +
            "Q = Queen\n" +
            "R = Rook\n" +
            "B = Bishop\n" +
            "N = Knight",
            "Q"
        );


    if (!choice) {
        return "q";
    }


    choice =
        choice.trim().toLowerCase();


    if (
        !["q", "r", "b", "n"].includes(choice)
    ) {

        return "q";

    }


    return choice;

}


/* =========================================================
   MOVE EXECUTION
   ========================================================= */

function makeMove(
    fromRow,
    fromCol,
    move,
    isAI = false
) {

    if (gameOver) {
        return;
    }


    const movingPiece =
        boardState[fromRow][fromCol];


    if (!movingPiece) {
        return;
    }


    const movingColor =
        getPieceColor(movingPiece);


    const capturedPiece =
        boardState[
            move.row
        ][
            move.col
        ];


    /* ---------------------------------------------------------
       Promotion choice
       --------------------------------------------------------- */

    let promotionPiece =
    move.promotion;

if (
    move.promotion
) {

    promotionPiece =
        isAI
            ? "q"
            : choosePromotion(
                movingColor
            );

}


    const actualMove = {
        ...move,
        promotion: promotionPiece
    };


    /* ---------------------------------------------------------
       Castling rights
       --------------------------------------------------------- */

    updateCastlingRights(
        movingPiece,
        fromRow,
        fromCol,
        capturedPiece,
        move.row,
        move.col
    );


    /* ---------------------------------------------------------
       Apply actual move
       --------------------------------------------------------- */

    boardState =
        applyMoveToBoard(
            boardState,
            fromRow,
            fromCol,
            actualMove
        );


    /* ---------------------------------------------------------
       En passant target
       --------------------------------------------------------- */

    enPassantTarget = null;


    if (
        getPieceType(movingPiece) === "p" &&
        Math.abs(move.row - fromRow) === 2
    ) {

        enPassantTarget = {

            row:
                (move.row + fromRow) / 2,

            col:
                fromCol

        };

    }


    /* ---------------------------------------------------------
       Turn changes
       --------------------------------------------------------- */

    selectedSquare = null;


    currentTurn =
        oppositeColor(currentTurn);


    renderBoard();


    updateGameStatus(
        movingColor,
        movingPiece,
        capturedPiece,
        actualMove
    );
   if (
    !gameOver &&
    selectedOpponent.mode === "ai" &&
    currentTurn === "black"
) {

    scheduleAIMove();

}

}


/* =========================================================
   GAME STATUS
   ========================================================= */

function updateGameStatus(
    previousTurn,
    movingPiece,
    capturedPiece,
    move
) {

    const nextColor =
        currentTurn;


    const nextColorInCheck =
        isInCheck(
            nextColor
        );


    const nextLegalMoves =
        getAllLegalMoves(
            nextColor
        );


    const movingColorName =
        colorName(
            previousTurn
        );


    const nextColorName =
        colorName(
            nextColor
        );


    /* =========================================================
       CHECKMATE
       ========================================================= */

    if (
        nextColorInCheck &&
        nextLegalMoves.length === 0
    ) {

       gameOver = true;

turnDisplay.textContent =
    "Game Over";

turnMessage.textContent =
    `Checkmate — ${movingColorName} wins.`;

statusElement.textContent =
    `CHECKMATE — ${movingColorName} wins!`;

showGameOver(
    "CHECKMATE",
    `${movingColorName} Wins`,
    "The king has no legal escape."
);


        if (
            selectedOpponent.mode === "ai"
        ) {

            saveChessLeaderboardResult(
    currentTurn === "black"
        ? "win"
        : "loss"
);

        }


        statusElement.classList.add(
            "accent"
        );


        renderBoard();

        return;

    }


    /* =========================================================
       STALEMATE
       ========================================================= */

    if (
        !nextColorInCheck &&
        nextLegalMoves.length === 0
    ) {

        gameOver = true;


        turnDisplay.textContent =
            "Game Over";


        turnMessage.textContent =
            "Stalemate — Draw.";


        statusElement.textContent =
            "STALEMATE — The game is a draw.";
       showGameOver(
    "STALEMATE",
    "Draw",
    "Neither side has a legal move."
);


        if (
            selectedOpponent.mode === "ai"
        ) {

            saveChessLeaderboardResult(
                "draw"
            );

        }


        statusElement.classList.add(
            "accent"
        );


        renderBoard();

        return;

    }


    /* =========================================================
       BUILD MOVE MESSAGE
       ========================================================= */

    const pieceName =
        PIECE_NAMES[
            getPieceType(movingPiece)
        ];


    if (
        move.castle === "king"
    ) {

        statusElement.textContent =
            `${movingColorName} castled kingside. ${nextColorName}'s turn.`;

    } else if (
        move.castle === "queen"
    ) {

        statusElement.textContent =
            `${movingColorName} castled queenside. ${nextColorName}'s turn.`;

    } else if (
        move.promotion
    ) {

        const promotedName =
            PIECE_NAMES[
                move.promotion
            ];


        statusElement.textContent =
            `${movingColorName}'s pawn promoted to ${promotedName}. ${nextColorName}'s turn.`;

    } else if (
        move.enPassant
    ) {

        statusElement.textContent =
            `${movingColorName} captured en passant. ${nextColorName}'s turn.`;

    } else if (
        capturedPiece
    ) {

        const capturedName =
            PIECE_NAMES[
                getPieceType(capturedPiece)
            ];


        statusElement.textContent =
            `${movingColorName} ${pieceName} captured ${nextColorName} ${capturedName}.`;

    } else {

        statusElement.textContent =
            `${movingColorName} moved the ${pieceName}. ${nextColorName}'s turn.`;

    }


    /* =========================================================
       CHECK
       ========================================================= */

 if (
    nextColorInCheck
) {

    statusElement.textContent =
        `CHECK — ${nextColorName}'s king is under attack.`;

    statusElement.classList.add(
        "accent"
    );

    turnMessage.textContent =
        `${nextColorName} is in check.`;

    flashCheckedKing(
        nextColor
    );

    } else {

        statusElement.classList.remove(
            "accent"
        );


        turnMessage.textContent =
            `${nextColorName}'s turn.`;

    }


    turnDisplay.textContent =
        nextColorName;

}


/* =========================================================
   SQUARE MESSAGE
   ========================================================= */

function describeSquare(
    row,
    col
) {

    const file =
        String.fromCharCode(
            97 + col
        );

    const rank =
        8 - row;


    return `${file}${rank}`;

}


/* =========================================================
   CLICK HANDLING
   ========================================================= */

function handleSquareClick(
    row,
    col
) {
if (
    aiThinking
) {

    statusElement.textContent =
        `${selectedOpponent.name} is thinking...`;

    return;

}
    if (gameOver) {

        statusElement.textContent =
            "The game is over. Start a new match to play again.";

        return;

    }


    const clickedPiece =
        boardState[row][col];


    /* =========================================================
       A PIECE IS ALREADY SELECTED
       ========================================================= */

    if (selectedSquare) {

        const legalMoves =
            getLegalMovesForPiece(
                selectedSquare.row,
                selectedSquare.col
            );


        const chosenMove =
            legalMoves.find(move =>
                move.row === row &&
                move.col === col
            );


        /* -----------------------------------------------------
           Valid move
           ----------------------------------------------------- */

        if (chosenMove) {

            makeMove(
                selectedSquare.row,
                selectedSquare.col,
                chosenMove
            );

            return;

        }


        /* -----------------------------------------------------
           Was it a pseudo-legal but king-exposing move?
           ----------------------------------------------------- */

        const pseudoMoves =
            getPseudoLegalMoves(
                selectedSquare.row,
                selectedSquare.col
            );


        const attemptedPseudoMove =
            pseudoMoves.find(move =>
                move.row === row &&
                move.col === col
            );


        if (
            attemptedPseudoMove
        ) {

            statusElement.textContent =
                "Illegal move — your king would be left in check.";

            statusElement.classList.add(
                "accent"
            );

            return;

        }


        /* -----------------------------------------------------
           Clicked another own piece
           ----------------------------------------------------- */

        if (
            clickedPiece &&
            getPieceColor(clickedPiece)
                === currentTurn
        ) {

            selectedSquare = {

                row,
                col

            };


            const newMoves =
                getLegalMovesForPiece(
                    row,
                    col
                );


            if (
                newMoves.length === 0
            ) {

                statusElement.textContent =
                    `The ${PIECE_NAMES[getPieceType(clickedPiece)]} has no legal moves.`;

                statusElement.classList.remove(
                    "accent"
                );

            } else {

                statusElement.textContent =
                    `${PIECE_NAMES[getPieceType(clickedPiece)]} selected — choose a highlighted square.`;

                statusElement.classList.add(
                    "accent"
                );

            }


            renderBoard();

            return;

        }


        /* -----------------------------------------------------
           Clicked opponent piece
           ----------------------------------------------------- */

        if (clickedPiece) {

            const clickedColor =
                getPieceColor(
                    clickedPiece
                );


            statusElement.textContent =
                `That's a ${clickedColor} piece. It's ${colorName(currentTurn)}'s turn.`;

            statusElement.classList.remove(
                "accent"
            );


            return;

        }


        /* -----------------------------------------------------
           Clicked empty square
           ----------------------------------------------------- */

        statusElement.textContent =
            "That square is not a legal destination.";

        statusElement.classList.remove(
            "accent"
        );


        return;

    }


    /* =========================================================
       NO PIECE SELECTED
       ========================================================= */

    if (
        clickedPiece &&
        getPieceColor(clickedPiece)
            === currentTurn
    ) {

        selectedSquare = {

            row,
            col

        };


        const legalMoves =
            getLegalMovesForPiece(
                row,
                col
            );


        if (
            legalMoves.length === 0
        ) {

            statusElement.textContent =
                `The ${PIECE_NAMES[getPieceType(clickedPiece)]} has no legal moves.`;

            statusElement.classList.remove(
                "accent"
            );

        } else {

            statusElement.textContent =
                `${PIECE_NAMES[getPieceType(clickedPiece)]} selected — choose a highlighted destination.`;

            statusElement.classList.add(
                "accent"
            );

        }


        renderBoard();

        return;

    }


    /* =========================================================
       CLICKED WRONG COLOR
       ========================================================= */

    if (clickedPiece) {

        const clickedColor =
            getPieceColor(
                clickedPiece
            );


        statusElement.textContent =
            `That's a ${clickedColor} piece. It's ${colorName(currentTurn)}'s turn.`;

        statusElement.classList.remove(
            "accent"
        );


        return;

    }


    /* =========================================================
       EMPTY BOARD
       ========================================================= */

    statusElement.textContent =
        `It's ${colorName(currentTurn)}'s turn. Select a ${currentTurn} piece.`;

}


/* =========================================================
   UPDATE HIGHLIGHTS
   ========================================================= */

function updateHighlights() {

    const squares =
        boardElement.querySelectorAll(
            ".chess-square"
        );


    if (!selectedSquare) {
        return;
    }


    const selectedIndex =
        selectedSquare.row * 8 +
        selectedSquare.col;


    const selectedElement =
        squares[selectedIndex];


    if (
        selectedElement
    ) {

        selectedElement.classList.add(
            "selected"
        );

    }


    const legalMoves =
        getLegalMovesForPiece(
            selectedSquare.row,
            selectedSquare.col
        );


    legalMoves.forEach(move => {

        const index =
            move.row * 8 +
            move.col;


        const square =
            squares[index];


        if (!square) {
            return;
        }


        const target =
            boardState[
                move.row
            ][
                move.col
            ];


        if (
            move.enPassant ||
            target
        ) {

            square.classList.add(
                "capture"
            );

        } else {

            square.classList.add(
                "legal"
            );

        }

    });

}


/* =========================================================
   RENDER BOARD
   ========================================================= */

function renderBoard() {

    boardElement.innerHTML = "";


    for (
        let row = 0;
        row < 8;
        row++
    ) {

        for (
            let col = 0;
            col < 8;
            col++
        ) {

            const square =
                document.createElement(
                    "button"
                );


            square.type = "button";


            square.className =
                "chess-square " +
                (
                    (row + col) % 2 === 0
                        ? "light"
                        : "dark"
                );


            square.dataset.row =
                row;

            square.dataset.col =
                col;


            /* -------------------------------------------------
               Coordinates
               ------------------------------------------------- */

            if (
                col === 0
            ) {

                const rank =
                    document.createElement(
                        "span"
                    );


                rank.className =
                    "rank-label";


                rank.textContent =
                    8 - row;


                square.appendChild(
                    rank
                );

            }


            if (
                row === 7
            ) {

                const file =
                    document.createElement(
                        "span"
                    );


                file.className =
                    "file-label";


                file.textContent =
                    String.fromCharCode(
                        97 + col
                    );


                square.appendChild(
                    file
                );

            }


            /* -------------------------------------------------
               Piece
               ------------------------------------------------- */

            const piece =
                boardState[row][col];


            if (piece) {

                const pieceElement =
                    document.createElement(
                        "span"
                    );


                pieceElement.className =
                    "chess-piece " +
                    (
                        getPieceColor(piece)
                            === "white"
                            ? "white-piece"
                            : "black-piece"
                    );


                pieceElement.textContent =
                    PIECE_SYMBOLS[piece];


                pieceElement.setAttribute(
                    "aria-hidden",
                    "true"
                );


                square.appendChild(
                    pieceElement
                );


                /* ---------------------------------------------
                   King in check
                   --------------------------------------------- */

                if (
                    getPieceType(piece) === "k" &&
                    isInCheck(
                        getPieceColor(piece)
                    )
                ) {

                    square.setAttribute(
                        "data-in-check",
                        "true"
                    );

                }

            }


            /* -------------------------------------------------
               Accessibility label
               ------------------------------------------------- */

            const squareName =
                describeSquare(
                    row,
                    col
                );


            if (piece) {

                square.setAttribute(
                    "aria-label",
                    `${squareName}, ${colorName(getPieceColor(piece))} ${PIECE_NAMES[getPieceType(piece)]}`
                );

            } else {

                square.setAttribute(
                    "aria-label",
                    `${squareName}, empty`

                );

            }


            /* -------------------------------------------------
               Click
               ------------------------------------------------- */

            square.addEventListener(
                "click",
                () => {

                    handleSquareClick(
                        row,
                        col
                    );

                }
            );


            boardElement.appendChild(
                square
            );

        }

    }


    updateHighlights();

}


/* =========================================================
   GAMEHUB PLAYER + LEADERBOARD
   ========================================================= */

function updateChessPlayerDisplay() {

    if (!gamePlayerElement) {
        return;
    }


    const currentPlayer =
        localStorage.getItem("gamehubPlayer") || "Guest";


    gamePlayerElement.textContent =
        currentPlayer;

}


function getChessLeaderboardScore(result) {

    if (
        selectedOpponent.mode !== "ai"
    ) {
        return 0;
    }


    const rating =
        Number(selectedOpponent.rating);


    if (!Number.isFinite(rating)) {
        return 0;
    }


    const winScore =
        100 + Math.round(rating / 10);


    if (result === "win") {
        return winScore;
    }


    if (result === "draw") {
        return Math.round(winScore / 2);
    }


    return 0;

}


function saveChessLeaderboardResult(result) {

    if (
        leaderboardScoreSaved ||
        selectedOpponent.mode !== "ai"
    ) {
        return;
    }


    const score =
        getChessLeaderboardScore(result);


    if (score <= 0) {
        return;
    }


    leaderboardScoreSaved = true;


    if (
        window.GameHub &&
        typeof window.GameHub.saveScore === "function"
    ) {

        window.GameHub.saveScore({

            game: "Chess",

            score: score,

            level: Number(selectedOpponent.rating) || 0,

            bestStreak: 0,

            lives: 0,

            completed: true
        }).then((savedRecord) => {

            if (savedRecord) {

                console.log(
                    "GameHub Chess score saved:",
                    savedRecord
                );

            }

        }).catch((error) => {

            console.error(
                "GameHub Chess score error:",
                error
            );

        });

    }

}


/* =========================================================
   RESET GAME
   ========================================================= */

function resetGame() {

    leaderboardScoreSaved = false;

    updateChessPlayerDisplay();


    boardState =
        copyBoard(
            STARTING_BOARD
        );


    currentTurn =
        "white";


    selectedSquare =
        null;


    gameOver =
        false;


    enPassantTarget =
        null;


    castlingRights = {

        whiteKingSide: true,
        whiteQueenSide: true,

        blackKingSide: true,
        blackQueenSide: true

    };


    turnDisplay.textContent =
        "White";


    turnMessage.textContent =
        "White's turn.";


    statusElement.classList.remove(
        "accent"
    );


    if (
        selectedOpponent.mode === "offline"
    ) {

        statusElement.textContent =
            "Offline 2-player mode — White moves first.";

    } else {

        statusElement.textContent =
            `${selectedOpponent.name} selected. White moves first.`;

    }


    renderBoard();

}


/* =========================================================
   START MATCH
   ========================================================= */

function startMatch() {

    opponentSelection.style.display =
        "none";


    chessMatch.classList.add(
        "active"
    );


    opponentDisplay.textContent =
        selectedOpponent.mode === "offline"
            ? "Friend"
            : selectedOpponent.name;


    resetGame();


    chessMatch.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================================
   OPPONENT SELECTION
   ========================================================= */

opponentCards.forEach(card => {

    const startButton =
        card.querySelector(
            ".card-start-btn"
        );


    card.addEventListener(
        "click",
        event => {

            if (
                event.target === startButton
            ) {
                return;
            }


            opponentCards.forEach(item => {

                item.classList.remove(
                    "selected"
                );

            });


            card.classList.add(
                "selected"
            );


            selectedOpponent = {

                name:
                    card.dataset.name,

                rating:
                    card.dataset.rating,

                mode:
                    card.dataset.mode

            };

        }
    );


    if (startButton) {

        startButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                opponentCards.forEach(item => {

                    item.classList.remove(
                        "selected"
                    );

                });


                card.classList.add(
                    "selected"
                );


                selectedOpponent = {

                    name:
                        card.dataset.name,

                    rating:
                        card.dataset.rating,

                    mode:
                        card.dataset.mode

                };


                startMatch();

            }
        );

    }

});


/* =========================================================
   NEW MATCH
   ========================================================= */

newMatchButton.addEventListener(
    "click",
    () => {

        chessMatch.classList.remove(
            "active"
        );


        opponentSelection.style.display =
            "block";


        resetGame();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);

/* =========================================================
   SHOW GAME OVER
========================================================= */

function showGameOver(
    label,
    title,
    subtitle
) {

    gameOverLabel.textContent =
        label;

    gameOverTitle.textContent =
        title;

    gameOverSubtitle.textContent =
        subtitle;

    gameOverOverlay.classList.add(
        "active"
    );

}
/* =========================================================
   HIDE GAME OVER
========================================================= */

function hideGameOver() {

    gameOverOverlay.classList.remove(
        "active"
    );

}
/* =========================================================
   REMATCH
========================================================= */

rematchButton.addEventListener(
    "click",
    () => {

        hideGameOver();

        resetGame();

    }
);
/* =========================================================
   INITIALIZE
   ========================================================= */

resetGame();
