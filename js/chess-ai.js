/* =========================================================
   GAMEHUB CHESS AI
   ---------------------------------------------------------
   Uses the legal-move engine from chess.js.
   The displayed ratings are GameHub difficulty labels,
   not official chess ratings.
   ========================================================= */


/* =========================================================
   AI PROFILES
========================================================= */

const CHESS_AI_PROFILES = {

    Dora: {
        depth: 1,
        randomness: 0.42,
        topChoices: 5,
        thinkDelay: 450,
        captureBias: 0.70,
        centerBias: 0.20
    },

    Alex: {
        depth: 2,
        randomness: 0.20,
        topChoices: 3,
        thinkDelay: 550,
        captureBias: 0.95,
        centerBias: 0.35
    },

    Usman: {
    depth: 3,
    randomness: 0.02,
    topChoices: 1,
    thinkDelay: 850,
    captureBias: 1.35,
    centerBias: 0.80
},

  Grandmaster: {
    depth: 4,
    randomness: 0.015,
    topChoices: 1,
    thinkDelay: 950,
    captureBias: 1.40,
    centerBias: 0.85
},

Magnus: {
    depth: 5,
    randomness: 0.005,
    topChoices: 1,
    thinkDelay: 1200,
    captureBias: 1.50,
    centerBias: 0.95
},

CPU: {
    depth: 5,
    randomness: 0.00,
    topChoices: 1,
    thinkDelay: 1400,
    captureBias: 1.60,
    centerBias: 1.15
}

};


/* =========================================================
   PIECE VALUES
========================================================= */

const AI_PIECE_VALUES = {

    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000

};


/* =========================================================
   CENTER SQUARES
========================================================= */

const AI_CENTER_SQUARES = [

    [3, 3],
    [3, 4],
    [4, 3],
    [4, 4]

];


/* =========================================================
   COPY CASTLING RIGHTS
========================================================= */

function aiCopyCastlingRights(rights) {

    return {

        whiteKingSide:
            rights.whiteKingSide,

        whiteQueenSide:
            rights.whiteQueenSide,

        blackKingSide:
            rights.blackKingSide,

        blackQueenSide:
            rights.blackQueenSide

    };

}


/* =========================================================
   GENERATE LEGAL MOVES FOR A TEMPORARY POSITION
========================================================= */

function aiGenerateLegalMoves(
    board,
    color,
    state
) {

    /*
       The existing chess engine stores these as global game
       variables. We temporarily replace them while searching,
       then restore them immediately.
    */

    const oldBoard =
        boardState;

    const oldEnPassant =
        enPassantTarget;

    const oldCastling =
        castlingRights;


    boardState =
        board;

    enPassantTarget =
        state.enPassantTarget;

    castlingRights =
        state.castlingRights;


    const moves =
        getAllLegalMoves(
            color
        );


    boardState =
        oldBoard;

    enPassantTarget =
        oldEnPassant;

    castlingRights =
        oldCastling;


    return moves;

}


/* =========================================================
   CREATE NEXT SEARCH STATE
========================================================= */

function aiCreateNextState(
    board,
    state,
    move
) {

    const movingPiece =
        board[
            move.fromRow
        ][
            move.fromCol
        ];


    const capturedPiece =
        board[
            move.row
        ][
            move.col
        ];


    const nextBoard =
        applyMoveToBoard(
            board,
            move.fromRow,
            move.fromCol,
            {
                ...move,
                promotion:
                    move.promotion || null
            }
        );


    const nextCastlingRights =
        aiCopyCastlingRights(
            state.castlingRights
        );


    aiUpdateCastlingRights(
        nextCastlingRights,
        movingPiece,
        move.fromRow,
        move.fromCol,
        capturedPiece,
        move.row,
        move.col
    );


    let nextEnPassantTarget =
        null;


    if (
        getPieceType(movingPiece) === "p" &&
        Math.abs(
            move.row -
            move.fromRow
        ) === 2
    ) {

        nextEnPassantTarget = {

            row:
                (
                    move.row +
                    move.fromRow
                ) / 2,

            col:
                move.fromCol

        };

    }


    return {

        board:
            nextBoard,

        castlingRights:
            nextCastlingRights,

        enPassantTarget:
            nextEnPassantTarget

    };

}


/* =========================================================
   UPDATE CASTLING RIGHTS FOR SEARCH
========================================================= */

function aiUpdateCastlingRights(
    rights,
    movingPiece,
    fromRow,
    fromCol,
    capturedPiece,
    toRow,
    toCol
) {

    const type =
        getPieceType(
            movingPiece
        );


    const color =
        getPieceColor(
            movingPiece
        );


    /* ---------------------------------------------------------
       King moved
    --------------------------------------------------------- */

    if (
        type === "k"
    ) {

        if (
            color === "white"
        ) {

            rights.whiteKingSide =
                false;

            rights.whiteQueenSide =
                false;

        } else {

            rights.blackKingSide =
                false;

            rights.blackQueenSide =
                false;

        }

    }


    /* ---------------------------------------------------------
       Rook moved
    --------------------------------------------------------- */

    if (
        type === "r"
    ) {

        if (
            fromRow === 7 &&
            fromCol === 0
        ) {

            rights.whiteQueenSide =
                false;

        }


        if (
            fromRow === 7 &&
            fromCol === 7
        ) {

            rights.whiteKingSide =
                false;

        }


        if (
            fromRow === 0 &&
            fromCol === 0
        ) {

            rights.blackQueenSide =
                false;

        }


        if (
            fromRow === 0 &&
            fromCol === 7
        ) {

            rights.blackKingSide =
                false;

        }

    }


    /* ---------------------------------------------------------
       Rook captured
    --------------------------------------------------------- */

    if (
        capturedPiece &&
        getPieceType(
            capturedPiece
        ) === "r"
    ) {

        if (
            toRow === 7 &&
            toCol === 0
        ) {

            rights.whiteQueenSide =
                false;

        }


        if (
            toRow === 7 &&
            toCol === 7
        ) {

            rights.whiteKingSide =
                false;

        }


        if (
            toRow === 0 &&
            toCol === 0
        ) {

            rights.blackQueenSide =
                false;

        }


        if (
            toRow === 0 &&
            toCol === 7
        ) {

            rights.blackKingSide =
                false;

        }

    }

}


/* =========================================================
   CENTER TEST
========================================================= */

function aiIsCenterSquare(
    row,
    col
) {

    return AI_CENTER_SQUARES.some(
        square =>

            square[0] === row &&
            square[1] === col
    );

}


/* =========================================================
   BOARD EVALUATION
   ---------------------------------------------------------
   Positive = good for Black
   Negative = good for White
========================================================= */

function aiEvaluateBoard(
    board
) {

    let score = 0;


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
                board[row][col];


            if (!piece) {
                continue;
            }


            const type =
                getPieceType(
                    piece
                );


            const value =
                AI_PIECE_VALUES[
                    type
                ];


            const sign =
                getPieceColor(piece)
                    === "black"
                        ? 1
                        : -1;


            score +=
                value *
                sign;


            /* -------------------------------------------------
               Center control
            ------------------------------------------------- */

            if (
                aiIsCenterSquare(
                    row,
                    col
                )
            ) {

                if (
                    type === "p"
                ) {

                    score +=
                        18 *
                        sign;

                } else if (
                    type === "n" ||
                    type === "b"
                ) {

                    score +=
                        22 *
                        sign;

                } else if (
                    type === "q"
                ) {

                    score +=
                        8 *
                        sign;

                }

            }


            /* -------------------------------------------------
               Pawn advancement
            ------------------------------------------------- */

            if (
                type === "p"
            ) {

                const advancement =

                    getPieceColor(piece)
                        === "black"

                        ? row - 1

                        : 6 - row;


                score +=
                    advancement *
                    2 *
                    sign;

            }

        }

    }


    return score;

}


/* =========================================================
   TERMINAL POSITION SCORE
========================================================= */

function aiTerminalScore(
    board,
    color,
    depth
) {

    const inCheck =
        isInCheck(
            color,
            board
        );


    if (
        !inCheck
    ) {

        return 0;

    }


    /*
       Evaluation is always from Black's perspective.

       White checkmated = Black wins.
       Black checkmated = White wins.
    */

    if (
        color === "white"
    ) {

        return (
            100000 +
            depth
        );

    }


    return (
        -100000 -
        depth
    );

}


/* =========================================================
   MOVE ORDERING
========================================================= */

function aiQuickMoveScore(
    board,
    move,
    profile
) {

    let score = 0;


    const target =
        board[
            move.row
        ][
            move.col
        ];


    /* ---------------------------------------------------------
       Captures
    --------------------------------------------------------- */

    if (
        target
    ) {

        score +=

            AI_PIECE_VALUES[
                getPieceType(target)
            ] *
            profile.captureBias;

    }


    if (
        move.enPassant
    ) {

        score +=
            100 *
            profile.captureBias;

    }


    /* ---------------------------------------------------------
       Castling
    --------------------------------------------------------- */

    if (
        move.castle
    ) {

        score += 35;

    }


    /* ---------------------------------------------------------
       Center
    --------------------------------------------------------- */

    if (
        aiIsCenterSquare(
            move.row,
            move.col
        )
    ) {

        score +=
            30 *
            profile.centerBias;

    }


    /* ---------------------------------------------------------
       Promotion
    --------------------------------------------------------- */

    if (
        move.promotion
    ) {

        score +=
            900;

    }


    return score;

}


/* =========================================================
   ORDER MOVES
========================================================= */

function aiOrderMoves(
    board,
    moves,
    profile
) {

    return moves

        .map(move => ({

            move,

            score:
                aiQuickMoveScore(
                    board,
                    move,
                    profile
                )

        }))

        .sort(
            (a, b) =>
                b.score -
                a.score
        )

        .map(
            item => item.move
        );

}


/* =========================================================
   MINIMAX + ALPHA BETA
========================================================= */

function aiMinimax(
    board,
    color,
    depth,
    alpha,
    beta,
    state,
    profile
) {

    const moves =
        aiGenerateLegalMoves(
            board,
            color,
            state
        );


    /* ---------------------------------------------------------
       Checkmate / stalemate
    --------------------------------------------------------- */

    if (
        moves.length === 0
    ) {

        const terminal =
            aiTerminalScore(
                board,
                color,
                depth
            );


        if (
            terminal !== 0
        ) {

            return terminal;

        }


        return 0;

    }


    /* ---------------------------------------------------------
       Leaf node
    --------------------------------------------------------- */

    if (
        depth === 0
    ) {

        return aiEvaluateBoard(
            board
        );

    }


    const orderedMoves =
        aiOrderMoves(
            board,
            moves,
            profile
        );


    /* =========================================================
       BLACK MAXIMIZES
    ========================================================= */

    if (
        color === "black"
    ) {

        let best =
            -Infinity;


        for (
            const move of orderedMoves
        ) {

            const nextState =
                aiCreateNextState(
                    board,
                    state,
                    move
                );


            const value =
                aiMinimax(
                    nextState.board,
                    "white",
                    depth - 1,
                    alpha,
                    beta,
                    nextState,
                    profile
                );


            best =
                Math.max(
                    best,
                    value
                );


            alpha =
                Math.max(
                    alpha,
                    best
                );


            if (
                beta <= alpha
            ) {

                break;

            }

        }


        return best;

    }


    /* =========================================================
       WHITE MINIMIZES
    ========================================================= */

    let best =
        Infinity;


    for (
        const move of orderedMoves
    ) {

        const nextState =
            aiCreateNextState(
                board,
                state,
                move
            );


        const value =
            aiMinimax(
                nextState.board,
                "black",
                depth - 1,
                alpha,
                beta,
                nextState,
                profile
            );


        best =
            Math.min(
                best,
                value
            );


        beta =
            Math.min(
                beta,
                best
            );


        if (
            beta <= alpha
        ) {

            break;

        }

    }


    return best;

}


/* =========================================================
   CHOOSE AI MOVE
========================================================= */

function chooseAIMove() {

    const profile =
        CHESS_AI_PROFILES[
            selectedOpponent.name
        ] ||
        CHESS_AI_PROFILES.Dora;


    const state = {

        enPassantTarget,

        castlingRights:
            aiCopyCastlingRights(
                castlingRights
            )

    };


    const moves =
        aiGenerateLegalMoves(
            boardState,
            "black",
            state
        );


    if (
        moves.length === 0
    ) {

        return null;

    }


    const orderedMoves =
        aiOrderMoves(
            boardState,
            moves,
            profile
        );


    const scoredMoves = [];


    for (
        const move of orderedMoves
    ) {

        const nextState =
            aiCreateNextState(
                boardState,
                state,
                move
            );


        const score =
            aiMinimax(
                nextState.board,
                "white",
                Math.max(
                    0,
                    profile.depth - 1
                ),
                -Infinity,
                Infinity,
                nextState,
                profile
            );


        scoredMoves.push({

            move,
            score

        });

    }


    scoredMoves.sort(
        (a, b) =>
            b.score -
            a.score
    );


    /*
       Easier opponents occasionally choose from
       their strongest few moves instead of always
       selecting the engine's top move.
    */

    const shouldRandomize =
        Math.random() <
        profile.randomness;


    if (
        shouldRandomize
    ) {

        const choiceCount =
            Math.min(
                profile.topChoices,
                scoredMoves.length
            );


        const index =
            Math.floor(
                Math.random() *
                choiceCount
            );


        return scoredMoves[
            index
        ].move;

    }


    return scoredMoves[0].move;

}


/* =========================================================
   START AI TURN
========================================================= */

function scheduleAIMove() {

    if (
        gameOver ||
        selectedOpponent.mode !== "ai" ||
        currentTurn !== "black"
    ) {

        return;

    }


    const profile =
        CHESS_AI_PROFILES[
            selectedOpponent.name
        ] ||
        CHESS_AI_PROFILES.Dora;


    aiThinking =
        true;


    statusElement.textContent =
        `${selectedOpponent.name} is thinking...`;


    statusElement.classList.add(
        "accent"
    );


    turnMessage.textContent =
        `${selectedOpponent.name}'s turn.`;


    window.setTimeout(
        () => {

            if (
                gameOver ||
                selectedOpponent.mode !== "ai" ||
                currentTurn !== "black"
            ) {

                aiThinking =
                    false;

                return;

            }


            const move =
                chooseAIMove();


            if (!move) {

                aiThinking =
                    false;

                return;

            }


            aiThinking =
                false;


            /*
               true = this move was made by AI.
               That prevents the promotion dialog from appearing.
            */

            makeMove(
                move.fromRow,
                move.fromCol,
                move,
                true
            );

        },
        profile.thinkDelay
    );

}
