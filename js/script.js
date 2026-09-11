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

    const levelElement = document.getElementById("level");
    const scoreElement = document.getElementById("score");
    const livesElement = document.getElementById("lives");
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
       GAME STATE
       ========================================= */

    let currentLevel = 0;
    let score = 0;
    let lives = 3;
    let answered = false;
    let gameOver = false;


    /* =========================================
       UPDATE LIVES DISPLAY
       ========================================= */

    function updateLives() {

        livesElement.textContent =
            "♥".repeat(lives) + "♡".repeat(3 - lives);
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


        answerInput.value = "";
        feedbackElement.textContent = "";

        submitButton.hidden = false;
        nextLevelButton.hidden = true;

        answerInput.disabled = false;
        submitButton.disabled = false;

        answerInput.focus();
    }


    /* =========================================
       GAME OVER
       ========================================= */

    function endGame() {

        gameOver = true;

        answerInput.disabled = true;
        submitButton.hidden = true;
        nextLevelButton.hidden = true;

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

            feedbackElement.textContent =
                "Perfect! You completed every level.";

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
         * If the current answer was already marked
         * correct, move to the next level.
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

            score += 100;

            scoreElement.textContent = score;


            if (currentLevel === patterns.length - 1) {

                feedbackElement.textContent =
                    "Perfect! You completed every level.";

                submitButton.hidden = true;
                restartButton.hidden = false;

            } else {

                feedbackElement.textContent =
                    "Correct! Press Enter for the next level.";

                submitButton.hidden = true;
                nextLevelButton.hidden = false;
            }

        }


        /* =========================================
           WRONG ANSWER
           ========================================= */

        else {

            lives--;

            updateLives();


            if (lives <= 0) {

                endGame();

            } else {

                feedbackElement.textContent =
                    `Not quite. You lost a life. ${lives} remaining.`;

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

        currentLevel = 0;
        score = 0;
        lives = 3;
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
