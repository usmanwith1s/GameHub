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

    // Stop here on pages that aren't the game page
    if (!patternElement) {
        return;
    }

    const levelElement = document.getElementById("level");
    const scoreElement = document.getElementById("score");
    const answerInput = document.getElementById("answer");
    const submitButton = document.getElementById("submit-answer");
    const feedbackElement = document.getElementById("feedback");
    const nextLevelButton = document.getElementById("next-level");
    const restartButton = document.getElementById("restart-game");


    /* =========================================
       GAME DATA
       ========================================= */

    const patterns = [
        {
            numbers: [2, 4, 6, 8],
            answer: 10
        },
        {
            numbers: [5, 10, 15, 20],
            answer: 25
        },
        {
            numbers: [3, 6, 12, 24],
            answer: 48
        },
        {
            numbers: [1, 4, 9, 16],
            answer: 25
        },
        {
            numbers: [2, 6, 12, 20],
            answer: 30
        },
        {
            numbers: [81, 27, 9, 3],
            answer: 1
        },
        {
            numbers: [2, 3, 5, 8, 12],
            answer: 17
        },
        {
            numbers: [1, 2, 4, 7, 11],
            answer: 16
        },
        {
            numbers: [100, 90, 81, 73],
            answer: 66
        },
        {
            numbers: [2, 4, 8, 16, 32],
            answer: 64
        }
    ];


    /* =========================================
       GAME STATE
       ========================================= */

    let currentLevel = 0;
    let score = 0;

    // Prevent the same level from being scored twice
    let answered = false;


    /* =========================================
       DISPLAY PATTERN
       ========================================= */

    function displayPattern() {

        // Unlock the new level
        answered = false;

        const currentPattern = patterns[currentLevel];

        patternElement.innerHTML = "";


        // Display existing numbers
        currentPattern.numbers.forEach((number) => {

            const numberElement = document.createElement("span");

            numberElement.textContent = number;

            patternElement.appendChild(numberElement);

        });


        // Display missing number
        const missingElement = document.createElement("span");

        missingElement.classList.add("missing");
        missingElement.textContent = "?";

        patternElement.appendChild(missingElement);


        // Update game information
        levelElement.textContent = currentLevel + 1;
        scoreElement.textContent = score;


        // Reset answer area
        answerInput.value = "";
        feedbackElement.textContent = "";

        submitButton.hidden = false;
        nextLevelButton.hidden = true;


        // Focus the input
        answerInput.focus();
    }


    /* =========================================
       CHECK ANSWER
       ========================================= */

    function checkAnswer() {

        // Prevent duplicate scoring
        if (answered) {
            return;
        }


        // Make sure the player entered something
        if (answerInput.value === "") {

            feedbackElement.textContent =
                "Enter an answer first.";

            return;
        }


        const userAnswer = Number(answerInput.value);
        const correctAnswer = patterns[currentLevel].answer;


        /* =====================================
           CORRECT ANSWER
           ===================================== */

        if (userAnswer === correctAnswer) {

            // Lock this level immediately
            answered = true;

            // Add score once
            score += 100;

            scoreElement.textContent = score;

            feedbackElement.textContent =
                "Correct! Nice work.";

            // Prevent another submission
            submitButton.hidden = true;


            // More levels available
            if (currentLevel < patterns.length - 1) {

                nextLevelButton.hidden = false;

            }

            // Final level completed
            else {

                feedbackElement.textContent =
                    "Perfect! You completed every level.";

                restartButton.hidden = false;
            }

        }


        /* =====================================
           WRONG ANSWER
           ===================================== */

        else {

            feedbackElement.textContent =
                "Not quite. Try again.";

            answerInput.select();
        }
    }


    /* =========================================
       NEXT LEVEL
       ========================================= */

    nextLevelButton.addEventListener("click", () => {

        currentLevel++;

        displayPattern();

    });


    /* =========================================
       RESTART GAME
       ========================================= */

    restartButton.addEventListener("click", () => {

        currentLevel = 0;
        score = 0;

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

            checkAnswer();

        }

    });


    /* =========================================
       START GAME
       ========================================= */

    displayPattern();

});
