// Get the elements needed for the memory game.
const difficultySelect = document.getElementById("difficulty");
const pairCountSelect = document.getElementById("pair-count");
const startButton = document.getElementById("start-game");
const restartButton = document.getElementById("restart-game");
const setupDescription = document.getElementById("setup-description");
const boardBody = document.getElementById("board-body");
const timeDisplay = document.getElementById("time-left");
const scoreDisplay = document.getElementById("score");
const matchedDisplay = document.getElementById("matched-pairs");
const mistakesDisplay = document.getElementById("mistakes");
const memoryFeedback = document.getElementById("memory-feedback");
const gamePhase = document.getElementById("game-phase");

// Store the memorization time for each difficulty.
const MEMORIZATION_TIMES = {
    easy: 8,
    normal: 5,
    hard: 3
};

// Store the time limit for each number of pairs.
const TIME_LIMITS = {
    8: 120,
    10: 150,
    12: 180
};

// Store the number of columns used for each board size.
const BOARD_COLUMNS = {
    8: 4,
    10: 5,
    12: 6
};

// Store the selected game settings.
let selectedDifficulty = "normal";
let selectedPairs = 8;
let memorizationTime = 5;
let timeLimit = 120;

// Convert seconds into minutes and seconds.
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return String(minutes).padStart(2, "0") + ":" +
           String(remainingSeconds).padStart(2, "0");
}

// Display feedback using the shared feedback styles.
function showMemoryFeedback(message, type = "") {
    memoryFeedback.textContent = message;
    memoryFeedback.className = "feedback";

    if (type !== "") {
        memoryFeedback.classList.add(type);
    }
}

// Read the settings selected by the player.
function readGameSettings() {
    selectedDifficulty = difficultySelect.value;
    selectedPairs = Number(pairCountSelect.value);

    memorizationTime =
        MEMORIZATION_TIMES[selectedDifficulty];

    timeLimit = TIME_LIMITS[selectedPairs];
}

// Update the setup information and game statistics.
function updateSetupDisplay() {
    setupDescription.textContent =
        `Memorization: ${memorizationTime} seconds | ` +
        `Time limit: ${timeLimit} seconds`;

    timeDisplay.textContent = formatTime(timeLimit);
    scoreDisplay.textContent = "0";
    matchedDisplay.textContent = `0/${selectedPairs}`;
    mistakesDisplay.textContent = "0";
}

// Create a preview of the numbered memory cards.
function createBoardPreview() {
    // Remove the previous board before creating another one.
    boardBody.replaceChildren();

    const totalCards = selectedPairs * 2;
    const columns = BOARD_COLUMNS[selectedPairs];

    let currentRow;

    for (let index = 0; index < totalCards; index++) {
        // Start a new table row after filling the current row.
        if (index % columns === 0) {
            currentRow = document.createElement("tr");
            boardBody.appendChild(currentRow);
        }

        const cell = document.createElement("td");
        const card = document.createElement("button");

        card.type = "button";
        card.className = "memory-card";
        card.textContent = index + 1;
        card.dataset.index = index;

        card.setAttribute(
            "aria-label",
            `Card ${index + 1}`
        );

        // Cards cannot be selected until the game starts.
        card.disabled = true;

        cell.appendChild(card);
        currentRow.appendChild(cell);
    }
}

// Refresh the interface when the player changes a setting.
function updateGamePreview() {
    readGameSettings();
    updateSetupDisplay();
    createBoardPreview();

    gamePhase.textContent = "Waiting to start";

    showMemoryFeedback(
        "Choose your settings and click Start Game."
    );

    restartButton.disabled = true;
}

// Listen for changes to the game settings.
difficultySelect.addEventListener(
    "change",
    updateGamePreview
);

pairCountSelect.addEventListener(
    "change",
    updateGamePreview
);

// The actual game logic will be implemented in the next phase.
startButton.addEventListener("click", function () {
    readGameSettings();

    showMemoryFeedback(
        `Game configured with ${selectedPairs} pairs and ` +
        `${memorizationTime} seconds of memorization.`,
        "success"
    );

    gamePhase.textContent = "Ready to start";
});

// Initialize the board when the page loads.
updateGamePreview();