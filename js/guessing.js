// Get the elements needed for the guessing game.
const guessForm = document.getElementById("guess-form");
const guessInput = document.getElementById("guess-input");
const feedback = document.getElementById("feedback");
const guessesLeftDisplay = document.getElementById("guesses-left");
const winsDisplay = document.getElementById("wins");
const roundsDisplay = document.getElementById("rounds");
const guessHistory = document.getElementById("guess-history");
const emptyHistory = document.getElementById("empty-history");
const restartButton = document.getElementById("restart-button");
const guessButton = guessForm.querySelector("button[type='submit']");

// Store the current state of the game.
const MIN_NUMBER = 1;
const MAX_NUMBER = 100;
const MAX_GUESSES = 10;
const RESTART_DELAY = 3000;

let secretNumber;
let guessesLeft = MAX_GUESSES;
let wins = 0;
let rounds = 0;
let gameActive = false;
let restartTimer = null;

// Generate a random whole number between 1 and 100.
function generateSecretNumber() {
    return Math.floor(
        Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)
    ) + MIN_NUMBER;
}

// Update the statistics shown on the page.
function updateStats() {
    guessesLeftDisplay.textContent = guessesLeft;
    winsDisplay.textContent = wins;
    roundsDisplay.textContent = rounds;
}

// Display feedback with the appropriate CSS class.
function showFeedback(message, type = "") {
    feedback.textContent = message;
    feedback.className = "feedback";

    if (type !== "") {
        feedback.classList.add(type);
    }
}

// Add each valid guess to the history.
function addGuessToHistory(guess, result) {
    const historyItem = document.createElement("li");

    historyItem.textContent = `${guess} — ${result}`;

    guessHistory.appendChild(historyItem);
    emptyHistory.hidden = true;
}

// Enable or disable the guessing controls.
function setGuessControls(enabled) {
    guessInput.disabled = !enabled;
    guessButton.disabled = !enabled;
}

// Start a new round without resetting the total wins and rounds.
function startNewGame() {
    // Cancel any pending restart to avoid starting two games.
    if (restartTimer !== null) {
        clearTimeout(restartTimer);
        restartTimer = null;
    }

    secretNumber = generateSecretNumber();
    guessesLeft = MAX_GUESSES;
    gameActive = true;

    // Clear the previous round's input and history.
    guessInput.value = "";
    guessInput.removeAttribute("aria-invalid");
    guessHistory.replaceChildren();
    emptyHistory.hidden = false;

    setGuessControls(true);
    updateStats();

    showFeedback("Take a guess to begin.");
}

// End the current round and automatically start another one.
function endGame(won) {
    gameActive = false;
    rounds++;

    if (won) {
        wins++;

        showFeedback(
            `Correct! The secret number was ${secretNumber}. ` +
            "A new round will begin in 3 seconds.",
            "success"
        );
    } else {
        showFeedback(
            `Game over! The secret number was ${secretNumber}. ` +
            "A new round will begin in 3 seconds.",
            "error"
        );
    }

    updateStats();

    // Prevent extra guesses while waiting for the next round.
    setGuessControls(false);

    restartTimer = setTimeout(function () {
        startNewGame();
        guessInput.focus();
    }, RESTART_DELAY);
}

// Check whether the player's input is a valid guess.
function validateGuess() {
    const rawInput = guessInput.value.trim();

    // Some browsers report invalid numeric input separately.
    if (guessInput.validity.badInput) {
        return {
            valid: false,
            message: "Please enter a valid whole number."
        };
    }

    // Check for empty input before converting it to a number.
    if (rawInput === "") {
        return {
            valid: false,
            message: "Please enter a number before guessing."
        };
    }

    const guess = Number(rawInput);

    // Decimal values are not allowed in this game.
    if (!Number.isInteger(guess)) {
        return {
            valid: false,
            message: "Please enter a whole number."
        };
    }

    // The guess must be within the allowed range.
    if (guess < MIN_NUMBER || guess > MAX_NUMBER) {
        return {
            valid: false,
            message: "Your guess must be between 1 and 100."
        };
    }

    return {
        valid: true,
        value: guess
    };
}

// Process the player's guess when the form is submitted.
function handleGuess(event) {
    // Prevent the form from refreshing the page.
    event.preventDefault();

    if (!gameActive) {
        return;
    }

    const validation = validateGuess();

    // Invalid guesses should not reduce the remaining guesses.
    if (!validation.valid) {
        guessInput.setAttribute("aria-invalid", "true");
        showFeedback(validation.message, "error");
        guessInput.focus();
        return;
    }

    guessInput.removeAttribute("aria-invalid");

    const guess = validation.value;

    // Every valid guess counts, including repeated guesses.
    guessesLeft--;

    // Check for a correct guess before checking the guess limit.
    // This allows the player to win on their final attempt.
    if (guess === secretNumber) {
        addGuessToHistory(guess, "Correct");
        endGame(true);
        return;
    }

    // Give the player feedback based on the submitted number.
    if (guess < secretNumber) {
        addGuessToHistory(guess, "Too low");

        showFeedback(
            `${guess} is too low. Try a higher number.`,
            "warning"
        );
    } else {
        addGuessToHistory(guess, "Too high");

        showFeedback(
            `${guess} is too high. Try a lower number.`,
            "warning"
        );
    }

    updateStats();

    // End the round if the player has no guesses remaining.
    if (guessesLeft === 0) {
        endGame(false);
        return;
    }

    // Clear the input so the player can enter another guess.
    guessInput.value = "";
    guessInput.focus();
}

// Listen for form submissions.
guessForm.addEventListener("submit", handleGuess);

// Allow the player to manually start a new round.
restartButton.addEventListener("click", function () {
    startNewGame();

    showFeedback(
        "A new game has started. Enter your first guess."
    );

    guessInput.focus();
});

// Remove the invalid input state when the player edits the field.
guessInput.addEventListener("input", function () {
    guessInput.removeAttribute("aria-invalid");
});

// Initialize the game when the page loads.
startNewGame();