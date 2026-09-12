
document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // THEME
    // =========================

    const themeToggle = document.querySelector(".theme-toggle");

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("light-mode");
        });
    }


    // =========================
    // PLAYER SYSTEM
    // =========================

    const playerButton = document.getElementById("player-btn");
    const playerNameElement = document.getElementById("player-name");

    const playerModal = document.getElementById("player-modal");
    const playerModalClose = document.getElementById("player-modal-close");
    const playerModalBackdrop = document.getElementById("player-modal-backdrop");

    const playerForm = document.getElementById("player-form");
    const playerInput = document.getElementById("player-input");
    const playerError = document.getElementById("player-error");

    let savedPlayer = localStorage.getItem("gamehubPlayer");

    if (savedPlayer && playerNameElement) {
        playerNameElement.textContent = savedPlayer;
    }


    function openPlayerModal() {

        if (!playerModal) return;

        playerModal.hidden = false;
        playerError.textContent = "";

        if (savedPlayer) {
            playerInput.value = savedPlayer;
        }

        setTimeout(() => {
            playerInput.focus();
        }, 50);
    }


    function closePlayerModal() {

        if (!playerModal) return;

        playerModal.hidden = true;
        playerError.textContent = "";
    }


    function savePlayer(username) {

        localStorage.setItem("gamehubPlayer", username);

        savedPlayer = username;

        if (playerNameElement) {
            playerNameElement.textContent = username;
        }
    }


    if (playerButton) {
        playerButton.addEventListener("click", openPlayerModal);
    }


    if (playerModalClose) {
        playerModalClose.addEventListener("click", closePlayerModal);
    }


    if (playerModalBackdrop) {
        playerModalBackdrop.addEventListener("click", closePlayerModal);
    }


    if (playerForm) {

        playerForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const username = playerInput.value.trim();

            if (username.length < 3) {

                playerError.textContent =
                    "Username must be at least 3 characters.";

                return;
            }


            if (username.length > 20) {

                playerError.textContent =
                    "Username must be 20 characters or fewer.";

                return;
            }


            if (!/^[a-zA-Z0-9_]+$/.test(username)) {

                playerError.textContent =
                    "Use only letters, numbers, and underscores.";

                return;
            }


            savePlayer(username);
            closePlayerModal();
        });
    }


    document.addEventListener("keydown", (event) => {

        if (
            event.key === "Escape" &&
            playerModal &&
            !playerModal.hidden
        ) {
            closePlayerModal();
        }
    });


    // =========================
    // GAMEHUB SCORE SYSTEM
    // =========================

    window.GameHub = window.GameHub || {};


    GameHub.saveScore = function (scoreData) {

        const currentPlayer =
            localStorage.getItem("gamehubPlayer") || "Guest";


        const scoreRecord = {

            player: currentPlayer,

            game: scoreData.game || "Unknown Game",

            score: Number(scoreData.score) || 0,

            level: Number(scoreData.level) || 1,

            bestStreak: Number(scoreData.bestStreak) || 0,

            lives: Number(scoreData.lives) || 0,

            completed: Boolean(scoreData.completed),

            date: new Date().toISOString()
        };


        const existingScores =
            JSON.parse(
                localStorage.getItem("gamehubScores") || "[]"
            );


        existingScores.push(scoreRecord);


        localStorage.setItem(
            "gamehubScores",
            JSON.stringify(existingScores)
        );


        console.log("GameHub score saved:", scoreRecord);


        return scoreRecord;
    };

    // =========================
    // LEADERBOARD
    // =========================

    const leaderboardList =
        document.getElementById("leaderboard-list");

    const leaderboardGame =
        document.getElementById("leaderboard-game");


    function getScores() {

        try {

            const scores =
                JSON.parse(
                    localStorage.getItem("gamehubScores") || "[]"
                );

            if (!Array.isArray(scores)) {
                return [];
            }

            return scores.filter((record) =>
                record &&
                typeof record.player === "string" &&
                typeof record.game === "string" &&
                Number.isFinite(Number(record.score))
            );

        } catch (error) {

            console.error(
                "Could not read GameHub scores:",
                error
            );

            return [];
        }
    }


    function renderLeaderboard() {

        if (!leaderboardList) {
            return;
        }


        const selectedGame =
            leaderboardGame
                ? leaderboardGame.value
                : "all";


        let scores = getScores();


        if (selectedGame !== "all") {

            scores = scores.filter(
                (record) =>
                    record.game === selectedGame
            );
        }


        scores.sort((a, b) => {

            const scoreDifference =
                Number(b.score) - Number(a.score);

            if (scoreDifference !== 0) {
                return scoreDifference;
            }

            return new Date(a.date) -
                new Date(b.date);
        });


        leaderboardList.innerHTML = "";


        if (scores.length === 0) {

            const emptyState =
                document.createElement("div");

            emptyState.className =
                "leaderboard-empty";

            emptyState.innerHTML = `
                <strong>No scores yet.</strong>
                Be the first player on the board.
            `;

            leaderboardList.appendChild(
                emptyState
            );

            return;
        }


        const currentPlayer =
            localStorage.getItem("gamehubPlayer");


        scores.forEach((record, index) => {

            const rank =
                index + 1;


            const row =
                document.createElement("div");

            row.className =
                "leaderboard-row";


            if (rank === 1) {
                row.classList.add("rank-one");
            }

            if (rank === 2) {
                row.classList.add("rank-two");
            }

            if (rank === 3) {
                row.classList.add("rank-three");
            }


            const rankElement =
                document.createElement("div");

            rankElement.className =
                "leaderboard-rank";


            if (rank === 1) {
                rankElement.textContent = "🥇";
            } else if (rank === 2) {
                rankElement.textContent = "🥈";
            } else if (rank === 3) {
                rankElement.textContent = "🥉";
            } else {
                rankElement.textContent =
                    String(rank).padStart(2, "0");
            }


            const playerElement =
                document.createElement("div");

            playerElement.className =
                "leaderboard-player";


            const playerName =
                document.createElement("span");

            playerName.className =
                "leaderboard-player-name";

            playerName.textContent =
                record.player;


            if (
                currentPlayer &&
                record.player === currentPlayer
            ) {

                const youBadge =
                    document.createElement("span");

                youBadge.className =
                    "leaderboard-you";

                youBadge.textContent =
                    "YOU";

                playerElement.appendChild(
                    playerName
                );

                playerElement.appendChild(
                    youBadge
                );

            } else {

                playerElement.appendChild(
                    playerName
                );
            }


            const gameElement =
                document.createElement("div");

            gameElement.className =
                "leaderboard-game-name";

            gameElement.textContent =
                record.game;


            const scoreElement =
                document.createElement("div");

            scoreElement.className =
                "leaderboard-score";

            scoreElement.textContent =
                Number(record.score).toLocaleString();


            row.appendChild(rankElement);

            row.appendChild(playerElement);

            row.appendChild(gameElement);

            row.appendChild(scoreElement);


            leaderboardList.appendChild(row);
        });
    }


    if (leaderboardGame) {

        leaderboardGame.addEventListener(
            "change",
            renderLeaderboard
        );
    }


    renderLeaderboard();
    // =========================
    // NUMBER PATTERN GAME
    // =========================

    const patternElement = document.getElementById("pattern");

    if (!patternElement) return;


    const levelElement = document.getElementById("level");
    const scoreElement = document.getElementById("score");
    const livesElement = document.getElementById("lives");
    const streakElement = document.getElementById("streak");
    const timerElement = document.getElementById("timer");
    const timerStat = document.querySelector(".timer-stat");

    const gamePlayerElement =
        document.getElementById("game-player");

    const answerInput =
        document.getElementById("answer");

    const submitButton =
        document.getElementById("submit-answer");

    const feedbackElement =
        document.getElementById("feedback");

    const nextLevelButton =
        document.getElementById("next-level");

    const activeGame =
        document.getElementById("active-game");

    const finalScreen =
        document.getElementById("final-screen");

    const finalMessage =
        document.getElementById("final-message");

    const finalScoreElement =
        document.getElementById("final-score");

    const finalLevelElement =
        document.getElementById("final-level");

    const finalStreakElement =
        document.getElementById("final-streak");

    const finalLivesElement =
        document.getElementById("final-lives");

    const playAgainButton =
        document.getElementById("play-again");


    // =========================
    // CURRENT PLAYER
    // =========================

    if (gamePlayerElement) {

        const currentPlayer =
            localStorage.getItem("gamehubPlayer");

        gamePlayerElement.textContent =
            currentPlayer || "Guest";
    }


    // =========================
    // PATTERNS
    // =========================

    const patterns = [

        {
            numbers: [2, 4, 6, 8],
            answer: 10,
            time: 20
        },

        {
            numbers: [5, 10, 15, 20],
            answer: 25,
            time: 20
        },

        {
            numbers: [3, 6, 12, 24],
            answer: 48,
            time: 18
        },

        {
            numbers: [1, 4, 9, 16],
            answer: 25,
            time: 18
        },

        {
            numbers: [2, 6, 12, 20],
            answer: 30,
            time: 16
        },

        {
            numbers: [2, 5, 10, 17, 26],
            answer: 37,
            time: 16
        },

        {
            numbers: [3, 6, 12, 24, 48],
            answer: 96,
            time: 14
        },

        {
            numbers: [2, 5, 4, 7, 6, 9],
            answer: 8,
            time: 14
        },

        {
            numbers: [1, 3, 6, 10, 15, 21],
            answer: 28,
            time: 12
        },

        {
            numbers: [2, 5, 11, 23, 47],
            answer: 95,
            time: 12
        }
    ];


    const STARTING_LIVES = 3;

    const MAX_STREAK_MULTIPLIER = 5;


    // =========================
    // GAME STATE
    // =========================

    let currentLevel = 0;

    let score = 0;

    let lives = STARTING_LIVES;

    let streak = 0;

    let bestStreak = 0;

    let timeLeft = 20;

    let timerInterval = null;

    let answered = false;

    let gameOver = false;


    // =========================
    // LIVES
    // =========================

    function updateLives() {

        livesElement.textContent =
            "♥".repeat(lives) +
            "♡".repeat(
                STARTING_LIVES - lives
            );
    }


    // =========================
    // STREAK
    // =========================

    function updateStreak() {

        streakElement.textContent =
            `${streak}×`;
    }


    function getMultiplier() {

        if (streak <= 0) {
            return 1;
        }

        return Math.min(
            1 + ((streak - 1) * 0.5),
            MAX_STREAK_MULTIPLIER
        );
    }


    function calculatePoints() {

        return Math.round(
            100 * getMultiplier()
        );
    }


    // =========================
    // TIMER
    // =========================

    function stopTimer() {

        if (timerInterval !== null) {

            clearInterval(timerInterval);

            timerInterval = null;
        }
    }


    function updateTimerDisplay() {

        timerElement.textContent =
            timeLeft;

        if (timeLeft <= 5) {

            timerStat.classList.add(
                "warning"
            );

        } else {

            timerStat.classList.remove(
                "warning"
            );
        }
    }


    function startTimer() {

        stopTimer();

        const currentPattern =
            patterns[currentLevel];

        timeLeft =
            currentPattern.time;

        updateTimerDisplay();


        timerInterval = setInterval(() => {

            if (gameOver || answered) {

                stopTimer();

                return;
            }


            timeLeft--;

            updateTimerDisplay();


            if (timeLeft <= 0) {

                stopTimer();

                handleTimeOut();
            }

        }, 1000);
    }


    // =========================
    // TIMEOUT
    // =========================

    function handleTimeOut() {

        if (gameOver || answered) {
            return;
        }


        lives--;

        streak = 0;

        updateLives();

        updateStreak();


        if (lives <= 0) {

            endGame(
                "Time ran out."
            );

            return;
        }


        feedbackElement.textContent =
            `Time's up! You lost a life. ${lives} remaining. Streak reset.`;


        answerInput.value = "";

        startTimer();

        answerInput.focus();
    }


    // =========================
    // DISPLAY PATTERN
    // =========================

    function displayPattern() {

        answered = false;

        const currentPattern =
            patterns[currentLevel];


        patternElement.innerHTML = "";


        currentPattern.numbers.forEach(
            (number) => {

                const numberElement =
                    document.createElement("span");

                numberElement.textContent =
                    number;

                patternElement.appendChild(
                    numberElement
                );
            }
        );


        const missingElement =
            document.createElement("span");

        missingElement.classList.add(
            "missing"
        );

        missingElement.textContent = "?";

        patternElement.appendChild(
            missingElement
        );


        levelElement.textContent =
            currentLevel + 1;

        scoreElement.textContent =
            score;


        updateLives();

        updateStreak();


        answerInput.value = "";

        feedbackElement.textContent = "";


        submitButton.hidden = false;

        submitButton.disabled = false;


        nextLevelButton.hidden = true;


        answerInput.disabled = false;


        startTimer();

        answerInput.focus();
    }


    // =========================
    // SAVE FINAL SCORE
    // =========================

    function saveFinalScore(completed) {

        GameHub.saveScore({

            game: "Number Pattern",

            score: score,

            level: Math.min(
                currentLevel + 1,
                patterns.length
            ),

            bestStreak: bestStreak,

            lives: lives,

            completed: completed
        });
    }


    // =========================
    // GAME OVER
    // =========================

    function endGame(reason) {

        gameOver = true;

        stopTimer();


        answerInput.disabled = true;

        submitButton.hidden = true;

        nextLevelButton.hidden = true;


        timerStat.classList.remove(
            "warning"
        );


        const levelReached =
            Math.min(
                currentLevel + 1,
                patterns.length
            );


        finalScoreElement.textContent =
            score;

        finalLevelElement.textContent =
            levelReached;

        finalStreakElement.textContent =
            `${bestStreak}×`;

        finalLivesElement.textContent =
            lives;

        finalMessage.textContent =
            reason;


        saveFinalScore(false);


        activeGame.hidden = true;

        finalScreen.hidden = false;
    }


    // =========================
    // COMPLETE GAME
    // =========================

    function completeGame() {

        gameOver = true;

        stopTimer();


        timerStat.classList.remove(
            "warning"
        );


        finalScoreElement.textContent =
            score;

        finalLevelElement.textContent =
            patterns.length;

        finalStreakElement.textContent =
            `${bestStreak}×`;

        finalLivesElement.textContent =
            lives;


        finalMessage.textContent =
            "Incredible run! You completed every pattern.";


        saveFinalScore(true);


        activeGame.hidden = true;

        finalScreen.hidden = false;
    }


    // =========================
    // NEXT LEVEL
    // =========================

    function goToNextLevel() {

        if (gameOver) {
            return;
        }


        if (
            currentLevel <
            patterns.length - 1
        ) {

            currentLevel++;

            displayPattern();

        } else {

            completeGame();
        }
    }


    // =========================
    // CHECK ANSWER
    // =========================

    function checkAnswer() {

        if (gameOver) {
            return;
        }


        if (answered) {

            goToNextLevel();

            return;
        }


        if (answerInput.value === "") {

            feedbackElement.textContent =
                "Enter an answer first.";

            return;
        }


        const userAnswer =
            Number(answerInput.value);

        const correctAnswer =
            patterns[currentLevel].answer;


        // =========================
        // CORRECT
        // =========================

        if (
            userAnswer === correctAnswer
        ) {

            answered = true;

            stopTimer();

            streak++;


            if (streak > bestStreak) {

                bestStreak = streak;
            }


            const points =
                calculatePoints();


            score += points;


            scoreElement.textContent =
                score;


            updateStreak();


            const multiplier =
                getMultiplier();


            if (
                currentLevel ===
                patterns.length - 1
            ) {

                feedbackElement.textContent =
                    `Perfect! +${points} points. ${multiplier}× multiplier.`;

                submitButton.hidden = true;

                nextLevelButton.hidden = true;


                completeGame();

            } else {

                feedbackElement.textContent =
                    `Correct! +${points} points. ${multiplier}× multiplier.`;

                submitButton.hidden = true;

                nextLevelButton.hidden = false;
            }


        // =========================
        // WRONG
        // =========================

        } else {

            lives--;

            streak = 0;


            updateLives();

            updateStreak();


            if (lives <= 0) {

                endGame(
                    "Game Over! You ran out of lives."
                );

            } else {

                feedbackElement.textContent =
                    `Not quite. You lost a life. ${lives} remaining. Streak reset.`;

                answerInput.select();
            }
        }
    }


    // =========================
    // EVENT LISTENERS
    // =========================

    nextLevelButton.addEventListener(
        "click",
        () => {
            goToNextLevel();
        }
    );


    submitButton.addEventListener(
        "click",
        checkAnswer
    );


    answerInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                checkAnswer();
            }
        }
    );


    // =========================
    // PLAY AGAIN
    // =========================

    playAgainButton.addEventListener(
        "click",
        () => {

            stopTimer();


            currentLevel = 0;

            score = 0;

            lives = STARTING_LIVES;

            streak = 0;

            bestStreak = 0;

            timeLeft =
                patterns[0].time;

            answered = false;

            gameOver = false;


            activeGame.hidden = false;

            finalScreen.hidden = true;


            displayPattern();
        }
    );


    // =========================
    // START GAME
    // =========================

    displayPattern();

});

