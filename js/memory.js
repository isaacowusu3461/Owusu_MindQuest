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

// Store the available picture assets.
const IMAGE_ASSETS = [
    { name: "Apple", src: "assets/images/apple.svg" },
    { name: "Banana", src: "assets/images/banana.svg" },
    { name: "Orange", src: "assets/images/orange.svg" },
    { name: "Grapes", src: "assets/images/grapes.svg" },
    { name: "Strawberry", src: "assets/images/strawberry.svg" },
    { name: "Watermelon", src: "assets/images/watermelon.svg" },
    { name: "Pear", src: "assets/images/pear.svg" },
    { name: "Cherries", src: "assets/images/cherries.svg" },
    { name: "Lemon", src: "assets/images/lemon.svg" },
    { name: "Pineapple", src: "assets/images/pineapple.svg" },
    { name: "Kiwi", src: "assets/images/kiwi.svg" },
    { name: "Peach", src: "assets/images/peach.svg" }
];

// Store the selected game settings.
let selectedDifficulty = "normal";
let selectedPairs = 8;
let memorizationTime = 5;
let timeLimit = 120;

// Store the current state of the game.
let cards = [];
let firstCard = null;
let secondCard = null;
let matchedPairs = 0;
let mistakes = 0;
let score = 0;
let boardLocked = false;
let currentPhase = "idle";

// Keep track of timers so they can be cancelled on restart.
let memorizationTimer = null;
let mismatchTimer = null;

const MISMATCH_DELAY = 900;

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

    updateGameStats();
}

// Update the statistics after each match attempt.
function updateGameStats() {
    scoreDisplay.textContent = score;
    matchedDisplay.textContent =
        `${matchedPairs}/${selectedPairs}`;

    mistakesDisplay.textContent = mistakes;
}

// Cancel timers from the previous game.
function clearGameTimers() {
    if (memorizationTimer !== null) {
        clearInterval(memorizationTimer);
        memorizationTimer = null;
    }

    if (mismatchTimer !== null) {
        clearTimeout(mismatchTimer);
        mismatchTimer = null;
    }
}

// Reset the variables used during a game.
function resetGameState() {
    clearGameTimers();

    cards = [];
    firstCard = null;
    secondCard = null;
    matchedPairs = 0;
    mistakes = 0;
    score = 0;
    boardLocked = false;
    currentPhase = "idle";

    timeDisplay.classList.remove("overtime");
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
    resetGameState();
    readGameSettings();
    updateSetupDisplay();
    createBoardPreview();

    gamePhase.textContent = "Waiting to start";

    showMemoryFeedback(
        "Choose your settings and click Start Game."
    );

    restartButton.disabled = true;
    startButton.disabled = false;
}

// Shuffle an array using the Fisher-Yates algorithm.
function shuffleArray(array) {
    const shuffled = [...array];

    for (let index = shuffled.length - 1;
         index > 0;
         index--) {

        const randomIndex = Math.floor(
            Math.random() * (index + 1)
        );

        [shuffled[index], shuffled[randomIndex]] =
            [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
}

// Select the pictures and create two copies of each one.
function createCardDeck() {
    const selectedImages = shuffleArray(
        IMAGE_ASSETS
    ).slice(0, selectedPairs);

    const pairedImages = [
        ...selectedImages,
        ...selectedImages
    ];

    // Each card has its own position and matching state.
    cards = shuffleArray(pairedImages).map(
        function (image, index) {
            return {
                id: index,
                name: image.name,
                src: image.src,
                flipped: false,
                matched: false,
                element: null
            };
        }
    );
}

// Create the actual game board using the shuffled deck.
function renderGameBoard() {
    boardBody.replaceChildren();

    const columns = BOARD_COLUMNS[selectedPairs];

    let currentRow;

    cards.forEach(function (card, index) {
        if (index % columns === 0) {
            currentRow = document.createElement("tr");
            boardBody.appendChild(currentRow);
        }

        const cell = document.createElement("td");
        const button = document.createElement("button");

        button.type = "button";
        button.className = "memory-card";
        button.dataset.index = index;

        card.element = button;

        button.addEventListener("click", function () {
            handleCardClick(card);
        });

        cell.appendChild(button);
        currentRow.appendChild(cell);

        updateCardDisplay(card);
    });
}

// Update a card based on whether it is hidden or revealed.
function updateCardDisplay(card) {
    const button = card.element;

    if (!button) {
        return;
    }

    button.replaceChildren();
    button.className = "memory-card";

    if (card.flipped || card.matched) {
        const image = document.createElement("img");

        image.src = card.src;
        image.alt = card.name;
        image.draggable = false;

        button.appendChild(image);
        button.classList.add("flipped");

        button.setAttribute(
            "aria-label",
            `Card ${card.id + 1}: ${card.name}`
        );
    } else {
        // Hidden cards only show their position number.
        button.textContent = card.id + 1;

        button.setAttribute(
            "aria-label",
            `Card ${card.id + 1}, hidden`
        );
    }

    if (card.matched) {
        button.classList.add("matched");

        button.setAttribute(
            "aria-label",
            `Card ${card.id + 1}: ${card.name}, matched`
        );
    }

    button.disabled =
        currentPhase !== "playing" || card.matched;
}

// Refresh every card on the board.
function updateAllCards() {
    cards.forEach(function (card) {
        updateCardDisplay(card);
    });
}

// Reveal a single card.
function revealCard(card) {
    card.flipped = true;
    updateCardDisplay(card);
}

// Hide a single card unless it has already been matched.
function hideCard(card) {
    if (card.matched) {
        return;
    }

    card.flipped = false;
    updateCardDisplay(card);
}

// Prevent settings from changing during an active game.
function setSetupControls(enabled) {
    difficultySelect.disabled = !enabled;
    pairCountSelect.disabled = !enabled;
    startButton.disabled = !enabled;
}

// Begin the memorization period.
function startMemorization() {
    currentPhase = "memorizing";
    boardLocked = true;

    let secondsLeft = memorizationTime;

    // Reveal every picture during memorization.
    cards.forEach(function (card) {
        revealCard(card);
    });

    gamePhase.textContent =
        `Memorizing — ${secondsLeft} seconds remaining`;

    showMemoryFeedback(
        "Memorize the location of each picture!",
        "warning"
    );

    // Use a deadline so delayed browser callbacks do not
    // unnecessarily extend the memorization period.
    const deadline =
        performance.now() + memorizationTime * 1000;

    memorizationTimer = setInterval(function () {
        secondsLeft = Math.max(
            0,
            Math.ceil((deadline - performance.now()) / 1000)
        );

        gamePhase.textContent =
            `Memorizing — ${secondsLeft} seconds remaining`;

        if (secondsLeft === 0) {
            clearInterval(memorizationTimer);
            memorizationTimer = null;

            beginPlaying();
        }
    }, 100);
}

// Hide the pictures and allow the player to select cards.
function beginPlaying() {
    currentPhase = "playing";
    boardLocked = false;

    cards.forEach(function (card) {
        hideCard(card);
    });

    gamePhase.textContent = "Game in progress";

    showMemoryFeedback(
        "Select two cards to find a matching pair."
    );
}

// Start a new memory game.
function startGame() {
    resetGameState();
    readGameSettings();
    updateSetupDisplay();

    setSetupControls(false);
    restartButton.disabled = false;

    createCardDeck();
    renderGameBoard();
    startMemorization();
}

// Process a card selected by the player.
function handleCardClick(card) {
    // Ignore clicks when the game is not ready.
    if (currentPhase !== "playing" || boardLocked) {
        return;
    }

    // Prevent matched cards or the same card from being selected.
    if (card.matched || card.flipped) {
        return;
    }

    revealCard(card);

    if (firstCard === null) {
        firstCard = card;

        showMemoryFeedback(
            "Select another card to find a match."
        );

        return;
    }

    secondCard = card;

    // Compare the two selected pictures.
    checkForMatch();
}

// Check whether the selected cards contain the same picture.
function checkForMatch() {
    if (firstCard.name === secondCard.name) {
        handleSuccessfulMatch();
    } else {
        handleIncorrectMatch();
    }
}

// Keep matching cards revealed for the rest of the game.
function handleSuccessfulMatch() {
    firstCard.matched = true;
    secondCard.matched = true;

    updateCardDisplay(firstCard);
    updateCardDisplay(secondCard);

    matchedPairs++;

    showMemoryFeedback(
        `Match found! You matched ${firstCard.name}.`,
        "success"
    );

    firstCard = null;
    secondCard = null;

    updateGameStats();

    // Finish the game when every pair has been matched.
    if (matchedPairs === selectedPairs) {
        finishGame();
    }
}

// Briefly reveal incorrect cards before hiding them again.
function handleIncorrectMatch() {
    mistakes++;
    boardLocked = true;

    firstCard.element.classList.add("mismatch");
    secondCard.element.classList.add("mismatch");

    showMemoryFeedback(
        "Those pictures do not match. Try again!",
        "error"
    );

    updateGameStats();

    // Prevent a third card from being selected during the delay.
    mismatchTimer = setTimeout(function () {
        hideCard(firstCard);
        hideCard(secondCard);

        firstCard = null;
        secondCard = null;

        boardLocked = false;
        mismatchTimer = null;

        showMemoryFeedback(
            "Select two cards to find another match."
        );
    }, MISMATCH_DELAY);
}

// Finish the game after all pairs have been matched.
function finishGame() {
    clearGameTimers();

    currentPhase = "finished";
    boardLocked = true;

    updateAllCards();
    updateGameStats();

    setSetupControls(true);

    gamePhase.textContent = "Game completed";

    showMemoryFeedback(
        `Congratulations! You matched all ${selectedPairs} pairs ` +
        `with ${mistakes} incorrect attempts.`,
        "success"
    );
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

// Start a new game using the selected settings.
startButton.addEventListener("click", startGame);

// Restart the game with a newly shuffled board.
restartButton.addEventListener("click", function () {
    startGame();
});

// Initialize the board when the page loads.
updateGamePreview();