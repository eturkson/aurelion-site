// ===============================
// AURELION Break Loop v0.2
// Reflex Grid Engine
// ===============================

const grid = document.getElementById("grid");
const startButton = document.getElementById("startButton");

let sequence = [];
let userSequence = [];
let round = 1;
let isPlaying = false;

// -------------------------------
// Create 3x3 Grid
// -------------------------------
function createGrid() {
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.dataset.index = i;

        // User click handler
        cell.addEventListener("click", () => {
            if (!isPlaying) return;

            const index = parseInt(cell.dataset.index);
            userSequence.push(index);

            flashCell(index, "active-green");

            validateUserInput();
        });

        grid.appendChild(cell);
    }
}

// -------------------------------
// Flash Cell
// -------------------------------
function flashCell(index, color) {
    const cell = grid.children[index];
    cell.classList.add(color);
    setTimeout(() => cell.classList.remove(color), 350);
}

// -------------------------------
// Generate Sequence (scales by round)
// -------------------------------
function generateSequence() {
    const length = 3 + (round - 1); // 3 → 4 → 5
    sequence = [];

    for (let i = 0; i < length; i++) {
        sequence.push(Math.floor(Math.random() * 9));
    }
}

// -------------------------------
// Reset Game State
// -------------------------------
function resetGame() {
    sequence = [];
    userSequence = [];
    round = 1;
    isPlaying = false;
}

// -------------------------------
// Play Sequence
// -------------------------------
async function playSequence() {
    isPlaying = false;

    for (let i = 0; i < sequence.length; i++) {
        flashCell(sequence[i], "active-green");
        await new Promise(r => setTimeout(r, 700));
    }

    userSequence = [];
    isPlaying = true;
}

// -------------------------------
// Validate User Input
// -------------------------------
function validateUserInput() {
    const index = userSequence.length - 1;

    // Wrong input
    if (userSequence[index] !== sequence[index]) {
        flashCell(userSequence[index], "active-red");
        isPlaying = false;
        setTimeout(() => {
            alert("TERMINATED — incorrect sequence. Restart cycle.");
            resetGame();
        }, 300);
        return;
    }

    // Completed round
    if (userSequence.length === sequence.length) {
        isPlaying = false;

        if (round === 3) {
            // Completed all rounds
            setTimeout(() => {
                alert("CYCLE COMPLETE — Operator reset achieved.");
                resetGame();
            }, 300);
        } else {
            // Advance to next round
            round++;
            setTimeout(startRound, 600);
        }
    }
}

// -------------------------------
// Start a Round
// -------------------------------
async function startRound() {
    generateSequence();
    await playSequence();
}

// -------------------------------
// Start Button
// -------------------------------
startButton.addEventListener("click", () => {
    resetGame();
    startRound();
});

// Initialize Grid
createGrid();
