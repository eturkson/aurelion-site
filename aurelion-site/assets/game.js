const grid = document.getElementById("grid");
const startButton = document.getElementById("startButton");

let sequence = [];
let round = 1;

function createGrid() {
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        grid.appendChild(cell);
    }
}

function flashCell(index, color) {
    const cell = grid.children[index];
    cell.classList.add(color);
    setTimeout(() => cell.classList.remove(color), 500);
}

function generateSequence() {
    sequence = [];
    for (let i = 0; i < 3; i++) {
        sequence.push(Math.floor(Math.random() * 9));
    }
}

async function playSequence() {
    for (let i = 0; i < sequence.length; i++) {
        flashCell(sequence[i], "active-green");
        await new Promise(r => setTimeout(r, 700));
    }
}

startButton.addEventListener("click", async () => {
    round = 1;
    generateSequence();
    await playSequence();
});
 
createGrid();
