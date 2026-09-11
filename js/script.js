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


    /* =========================================
       NUMBER PATTERN GAME
       ========================================= */

    const patternElement = document.getElementById("pattern");

    // Do nothing on pages that aren't the game page
    if (!patternElement) {
        return;
    }


    /* =========================================
       ELEMENTS
       ========================================= */

    const levelElement = document.getElementById("level");
    const scoreElement = document.getElementById("score");
    const livesElement = document.getElementById("lives");
    const streakElement = document.getElementById("streak");
    const timerElement = document.getElementById("timer");

    const timerStat = document.querySelector(".timer-stat");

    const answerInput = document.getElementById("answer");
    const submitButton = document.getElementById("submit-answer");
    const feedbackElement = document.getElementById("feedback");

    const nextLevelButton = document.getElementById("next-level");
    const restartButton = document.getElementById("restart-game");


    /* =========================================
       GAME DATA
       ========================================= */

    const patterns = [
        { numbers: [2, 4, 6, 8], answer: 10 },
        { numbers: [5, 10, 15, 20], answer: 25 },
        { numbers: [3, 6, 12, 24], answer: 48 },
        { numbers: [1, 4, 9, 16], answer: 25 },
        { numbers: [2, 6, 12, 20], answer: 30 },
        { numbers: [81, 27, 9, 3], answer: 1 },
        { numbers: [2, 3, 5, 8, 12], answer: 17 },
        { numbers: [1, 2, 4, 7, 11], answer: 16 },
        { numbers: [100, 90, 81, 73], answer: 66 },
        { numbers: [2, 4, 8, 16, 32], answer: 64 }
    ];


    /* =========================================
       GAME SETTINGS
       ========================================= */

    const STARTING_LIVES = 3;
    const STARTING_TIME = 20;


    /* =========================================
       GAME STATE
       ========================================= */

    let currentLevel = 0;
    let score = 0;
    let lives = STARTING_LIVES;
    let streak = 0;

    let timeLeft = STARTING_TIME;
    let timerInterval = null;

    let answered = false;
    let gameOver = false;


    /* =========================================
       UPDATE LIVES
       ========================================= */

    function updateLives() {

        livesElement.textContent =
            "♥".repeat(lives) + "♡".repeat(STARTING_LIVES - lives);
    }


    /* =========================================
       UPDATE STREAK
       ========================================= */

    function updateStreak() {

        streakElement.textContent = `${streak}×`;
    }


    /* =========================================
       CALCULATE SCORE
       ========================================= */

    function calculatePoints() {

        /*
         * Streak 1 = 100
         * Streak 2 = 150
         * Streak 3 = 200
         * Streak 4 = 250
         */

        return 100 + ((streak - 1) * 50);
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

        timerElement.textContent = timeLeft;

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

        timeLeft = STARTING_TIME;

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

            endGame();

        } else {

            feedbackElement.textContent =
                `Time's up! You lost a life. ${lives} remaining.`;

            /*
             * Give the player another attempt
             * at the same level.
             */

            answerInput.value = "";

            startTimer();

            answerInput.focus();
        }
    }


    /* =========================================
       DISPLAY PATTERN
       ========================================= */

    function displayPattern() {

        answered = false;

        const currentPattern = patterns[currentLevel];

        patternElement.innerHTML = "";


        currentPattern.numbers.forEach((number) => {

            const numberElement = document.createElement("span");

            numberElement.textContent = number;

            patternElement.appendChild(numberElement);
        });


        const missingElement = document.createElement("span");

        missingElement.classList.add("missing");
        missingElement.textContent = "?";

        patternElement.appendChild(missingElement);


        levelElement.textContent = currentLevel + 1;
        scoreElement.textContent = score;

        updateLives();
        updateStreak();


        answerInput.value = "";
        feedbackElement.textContent = "";

        submitButton.hidden = false;
        nextLevelButton.hidden = true;

        answerInput.disabled = false;
        submitButton.disabled = false;


        startTimer();

        answerInput.focus();
    }


    /* =========================================
       GAME OVER
       ========================================= */

    function endGame() {

        gameOver = true;

        stopTimer();

        answerInput.disabled = true;
        submitButton.hidden = true;
        nextLevelButton.hidden = true;

        timerStat.classList.remove("warning");

        feedbackElement.textContent =
            `Game Over! Final score: ${score}`;

        restartButton.hidden = false;
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

            stopTimer();

            feedbackElement.textContent =
                `Perfect! Final score: ${score}`;

            submitButton.hidden = true;
            nextLevelButton.hidden = true;
            restartButton.hidden = false;
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
         * Second Enter after a correct answer
         * moves to the next level.
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


        const userAnswer = Number(answerInput.value);
        const correctAnswer = patterns[currentLevel].answer;


        /* =========================================
           CORRECT ANSWER
           ========================================= */

        if (userAnswer === correctAnswer) {

            answered = true;

            stopTimer();

            streak++;

            const points = calculatePoints();

            score += points;

            scoreElement.textContent = score;

            updateStreak();


            if (currentLevel === patterns.length - 1) {

                feedbackElement.textContent =
                    `Perfect! +${points} points. Final score: ${score}`;

                submitButton.hidden = true;
                restartButton.hidden = false;

            } else {

                feedbackElement.textContent =
                    `Correct! +${points} points. Streak: ${streak}×`;

                submitButton.hidden = true;
                nextLevelButton.hidden = false;
            }
        }


        /* =========================================
           WRONG ANSWER
           ========================================= */

        else {

            lives--;

            streak = 0;

            updateLives();
            updateStreak();


            if (lives <= 0) {

                endGame();

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

    nextLevelButton.addEventListener("click", () => {

        goToNextLevel();

    });


    /* =========================================
       RESTART GAME
       ========================================= */

    restartButton.addEventListener("click", () => {

        stopTimer();

        currentLevel = 0;
        score = 0;
        lives = STARTING_LIVES;
        streak = 0;

        timeLeft = STARTING_TIME;

        gameOver = false;
        answered = false;

        restartButton.hidden = true;

        displayPattern();
    });


    /* =========================================
       SUBMIT ANSWER
       ========================================= */

    submitButton.addEventListener("click", checkAnswer);


    /* =========================================
       ENTER KEY
       ========================================= */

    answerInput.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            checkAnswer();
        }
    });


    /* =========================================
       START GAME
       ========================================= */

    displayPattern();

});
