document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       THEME TOGGLE
       ========================================= */

    const themeToggle = document.querySelector(".theme-toggle");

    if (themeToggle) {

        themeToggle.addEventListener("click", () => {

            document.body.classList.toggle("light-mode");

        });

    }
        // =========================
    // GAME PLAYER
    // =========================

    const gamePlayerElement = document.getElementById("game-player");

    if (gamePlayerElement) {
        const currentPlayer = localStorage.getItem("gamehubPlayer");

        if (currentPlayer) {
            gamePlayerElement.textContent = currentPlayer;
        } else {
            gamePlayerElement.textContent = "Guest";
        }
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

    const savedPlayer = localStorage.getItem("gamehubPlayer");

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
        if (event.key === "Escape" && playerModal && !playerModal.hidden) {
            closePlayerModal();
        }
    });


    /* =========================================
       NUMBER PATTERN GAME
       ========================================= */

    const patternElement =
        document.getElementById("pattern");


    // Stop here on pages that are not the game page

    if (!patternElement) {
        return;
    }


    /* =========================================
       ELEMENTS
       ========================================= */

    const levelElement =
        document.getElementById("level");

    const scoreElement =
        document.getElementById("score");

    const livesElement =
        document.getElementById("lives");

    const streakElement =
        document.getElementById("streak");

    const timerElement =
        document.getElementById("timer");

    const timerStat =
        document.querySelector(".timer-stat");

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


    /* =========================================
       GAME DATA
       ========================================= */

    /*
     * Difficulty increases through:
     *
     * Level 1-2  → simple arithmetic
     * Level 3-4  → multiplication / squares
     * Level 5-6  → changing differences
     * Level 7-8  → alternating patterns
     * Level 9-10 → advanced sequences
     */

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


    /* =========================================
       GAME SETTINGS
       ========================================= */

    const STARTING_LIVES = 3;

    const MAX_STREAK_MULTIPLIER = 5;


    /* =========================================
       GAME STATE
       ========================================= */

    let currentLevel = 0;

    let score = 0;

    let lives = STARTING_LIVES;

    let streak = 0;

    let bestStreak = 0;

    let timeLeft = 20;

    let timerInterval = null;

    let answered = false;

    let gameOver = false;


    /* =========================================
       UPDATE LIVES
       ========================================= */

    function updateLives() {

        livesElement.textContent =
            "♥".repeat(lives) +
            "♡".repeat(STARTING_LIVES - lives);

    }


    /* =========================================
       UPDATE STREAK
       ========================================= */

    function updateStreak() {

        streakElement.textContent =
            `${streak}×`;

    }


    /* =========================================
       GET MULTIPLIER
       ========================================= */

    function getMultiplier() {

        if (streak <= 0) {
            return 1;
        }

        return Math.min(
            1 + ((streak - 1) * 0.5),
            MAX_STREAK_MULTIPLIER
        );

    }


    /* =========================================
       CALCULATE POINTS
       ========================================= */

    function calculatePoints() {

        const multiplier =
            getMultiplier();

        return Math.round(
            100 * multiplier
        );

    }


    /* =========================================
       STOP TIMER
       ========================================= */

    function stopTimer() {

        if (timerInterval !== null) {

            clearInterval(timerInterval);

            timerInterval = null;

        }

    }


    /* =========================================
       UPDATE TIMER DISPLAY
       ========================================= */

    function updateTimerDisplay() {

        timerElement.textContent =
            timeLeft;


        if (timeLeft <= 5) {

            timerStat.classList.add("warning");

        } else {

            timerStat.classList.remove("warning");

        }

    }


    /* =========================================
       START TIMER
       ========================================= */

    function startTimer() {

        stopTimer();


        const currentPattern =
            patterns[currentLevel];


        timeLeft =
            currentPattern.time;


        updateTimerDisplay();


        timerInterval =
            setInterval(() => {

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


    /* =========================================
       HANDLE TIME OUT
       ========================================= */

    function handleTimeOut() {

        if (gameOver || answered) {
            return;
        }


        lives--;

        streak = 0;


        updateLives();

        updateStreak();


        if (lives <= 0) {

            endGame("Time ran out.");

            return;

        }


        feedbackElement.textContent =
            `Time's up! You lost a life. ${lives} remaining. Streak reset.`;


        /*
         * The player gets another attempt
         * at the same level.
         */

        answerInput.value = "";

        startTimer();

        answerInput.focus();

    }


    /* =========================================
       DISPLAY PATTERN
       ========================================= */

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


        missingElement.textContent =
            "?";


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


    /* =========================================
       END GAME
       ========================================= */

    function endGame(reason) {

        gameOver = true;


        stopTimer();


        answerInput.disabled = true;

        submitButton.hidden = true;

        nextLevelButton.hidden = true;


        timerStat.classList.remove(
            "warning"
        );


        /*
         * currentLevel is zero-based,
         * so add one for the level reached.
         */

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


        activeGame.hidden = true;

        finalScreen.hidden = false;

    }


    /* =========================================
       COMPLETE GAME
       ========================================= */

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


        activeGame.hidden = true;

        finalScreen.hidden = false;

    }


    /* =========================================
       MOVE TO NEXT LEVEL
       ========================================= */

    function goToNextLevel() {

        if (gameOver) {
            return;
        }


        if (currentLevel < patterns.length - 1) {

            currentLevel++;

            displayPattern();

        } else {

            completeGame();

        }

    }


    /* =========================================
       CHECK ANSWER
       ========================================= */

    function checkAnswer() {

        if (gameOver) {
            return;
        }


        /*
         * First Enter checks the answer.
         *
         * Second Enter after a correct
         * answer advances the level.
         */

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


        /* =========================================
           CORRECT
           ========================================= */

        if (userAnswer === correctAnswer) {

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

        }


        /* =========================================
           WRONG
           ========================================= */

        else {

            lives--;

            streak = 0;


            updateLives();

            updateStreak();


            if (lives <= 0) {

                endGame(
                    `Game Over! You ran out of lives.`
                );

            } else {

                feedbackElement.textContent =
                    `Not quite. You lost a life. ${lives} remaining. Streak reset.`;

                answerInput.select();

            }

        }

    }


    /* =========================================
       NEXT LEVEL BUTTON
       ========================================= */

    nextLevelButton.addEventListener(
        "click",
        () => {

            goToNextLevel();

        }
    );


    /* =========================================
       SUBMIT BUTTON
       ========================================= */

    submitButton.addEventListener(
        "click",
        checkAnswer
    );


    /* =========================================
       ENTER KEY
       ========================================= */

    answerInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                checkAnswer();

            }

        }
    );


    /* =========================================
       PLAY AGAIN
       ========================================= */

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


    /* =========================================
       START GAME
       ========================================= */

    displayPattern();
    

});
