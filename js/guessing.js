// Get the guessing form from the page.
const guessForm = document.getElementById("guess-form");

// Prevent the form from refreshing the page.
// The actual guessing logic will be added in the next phase.
guessForm.addEventListener("submit", function (event) {
    event.preventDefault();
});