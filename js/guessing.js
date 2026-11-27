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
const clockDisplay = document.getElementById("clock");
const soundToggle = document.getElementById("sound-toggle");

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

// Store the sound settings and audio context.
let soundEnabled = true;
let audioContext = null;

// Load the player's saved sound preference.
function loadSoundPreference() {
    try {
        const savedPreference = localStorage.getItem(
            "mindquest_sound"
        );

        if (savedPreference !== null) {
            soundEnabled = savedPreference === "true";
        }
    } catch (error) {
        console.warn("Could not load sound preference.", error);
    }

    updateSoundButton();
}

// Save the sound preference for future visits.
function saveSoundPreference() {
    try {
        localStorage.setItem(
            "mindquest_sound",
            String(soundEnabled)
        );
    } catch (error) {
        console.warn("Could not save sound preference.", error);
    }
}

// Update the sound button based on the current setting.
function updateSoundButton() {
    soundToggle.textContent = soundEnabled
        ? "Sound: On"
        : "Sound: Off";

    soundToggle.setAttribute(
        "aria-pressed",
        String(soundEnabled)
    );
}

// Display the current local time.
function updateClock() {
    const now = new Date();

    clockDisplay.textContent = now.toLocaleTimeString(
        "en-US",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }
    );
}

// Create the audio context only after a user interaction.
// Some browsers block audio that starts automatically.
async function initializeAudio() {
    try {
        if (!audioContext) {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) {
                return false;
            }

            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        return audioContext.state === "running";
    } catch (error) {
        console.warn("Audio is unavailable.", error);
        return false;
    }
}

// Generate a short tone without using an external audio file.
function playTone(frequency, duration, delay = 0, type = "sine") {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const startTime = audioContext.currentTime + delay;
    const endTime = startTime + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(
        frequency,
        startTime
    );

    // Keep the sound at a comfortable volume.
    gainNode.gain.setValueAtTime(0.12, startTime);

    // Fade out the sound to avoid an abrupt ending.
    gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        endTime
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(endTime);

    // Disconnect the audio nodes after the tone finishes.
    oscillator.onended = function () {
        oscillator.disconnect();
        gainNode.disconnect();
    };
}

// Play different sounds depending on the player's action.
async function playSound(type) {
    if (!soundEnabled) {
        return;
    }

    const audioReady = await initializeAudio();

    if (!audioReady || !soundEnabled) {
        return;
    }

    switch (type) {
        case "correct":
            // Play an ascending sound when the player wins.
            playTone(523, 0.15, 0);
            playTone(659, 0.15, 0.15);
            playTone(784, 0.25, 0.30);
            break;

        case "incorrect":
            // A short tone for an incorrect guess.
            playTone(330, 0.15);
            break;

        case "invalid":
            // Two short tones for invalid input.
            playTone(220, 0.10, 0);
            playTone(220, 0.10, 0.15);
            break;

        case "loss":
            // Play a descending sound when the round is lost.
            playTone(392, 0.18, 0);
            playTone(294, 0.18, 0.18);
            playTone(196, 0.30, 0.36);
            break;

        case "restart":
            playTone(440, 0.12);
            playTone(587, 0.15, 0.12);
            break;

        case "toggle":
            playTone(660, 0.12);
            break;
    }
}

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

        playSound("correct");
    } else {
        showFeedback(
            `Game over! The secret number was ${secretNumber}. ` +
            "A new round will begin in 3 seconds.",
            "error"
        );

        playSound("loss");
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

        playSound("invalid");

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

    playSound("incorrect");

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

    playSound("restart");

    guessInput.focus();
});

// Remove the invalid input state when the player edits the field.
guessInput.addEventListener("input", function () {
    guessInput.removeAttribute("aria-invalid");
});

// Allow the player to enable or disable sound effects.
soundToggle.addEventListener("click", function () {
    soundEnabled = !soundEnabled;

    updateSoundButton();
    saveSoundPreference();

    if (soundEnabled) {
        playSound("toggle");
    }
});

// Load the saved sound setting when the page opens.
loadSoundPreference();

// Display the clock immediately and update it every second.
updateClock();
setInterval(updateClock, 1000);

// Initialize the game when the page loads.
startNewGame();