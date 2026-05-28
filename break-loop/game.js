// BREAK LOOP v0.5 — game engine

const gridEl = document.getElementById('grid');
const cells = Array.from(document.querySelectorAll('.bl-cell'));
const startBtn = document.getElementById('startBtn');
const modeSelect = document.getElementById('modeSelect');
const modeBanner = document.getElementById('modeBanner');
const timeBarContainer = document.getElementById('timeBarContainer');
const timeBar = document.getElementById('timeBar');
const statusText = document.getElementById('statusText');

// Telemetry elements
const telemetryAccuracy = document.getElementById('telemetryAccuracy');
const telemetryAvgReaction = document.getElementById('telemetryAvgReaction');
const telemetryMistakes = document.getElementById('telemetryMistakes');
const telemetryRounds = document.getElementById('telemetryRounds');
const telemetryCurve = document.getElementById('telemetryCurve');

// Core state
let sequence = [];
let playerInput = [];
let acceptingInput = false;
let round = 0;
let baseLength = 3;
let currentLength = baseLength;
let totalClicks = 0;
let correctClicks = 0;
let mistakes = 0;
let reactionTimes = [];
let lastClickTime = null;
let difficultyHistory = [];
let timePressureMs = 6000; // for timepressure mode
let timeTimer = null;

// Mode handling
let currentMode = 'adaptive';

modeSelect.addEventListener('change', () => {
  currentMode = modeSelect.value;
  showModeBanner();
  resetGameState();
});

startBtn.addEventListener('click', () => {
  resetGameState();
  startRound();
});

cells.forEach((cell) => {
  cell.addEventListener('click', () => {
    if (!acceptingInput) return;
    handleCellClick(parseInt(cell.dataset.index, 10));
  });
});

function resetGameState() {
  sequence = [];
  playerInput = [];
  acceptingInput = false;
  round = 0;
  currentLength = baseLength;
  totalClicks = 0;
  correctClicks = 0;
  mistakes = 0;
  reactionTimes = [];
  difficultyHistory = [];
  clearTimePressure();
  updateTelemetry();
  statusText.textContent = 'Mission reset. Press "Start Mission" to begin.';
}

function startRound() {
  round++;
  playerInput = [];
  acceptingInput = false;
  statusText.textContent = `Round ${round}: Observe the sequence.`;

  // difficulty tracking
  difficultyHistory.push(currentLength);

  // generate sequence
  sequence = generateSequence(currentLength);

  // show sequence with mode-specific behavior
  const withInterference = currentMode === 'interference';
  playSequence(sequence, withInterference).then(() => {
    // reverse mode banner
    if (currentMode === 'reverse' && round % 3 === 0) {
      modeBanner.classList.remove('hidden');
      modeBanner.textContent = 'REVERSE ORDER — Operator inversion required.';
    } else {
      showModeBanner();
    }

    acceptingInput = true;
    playerInput = [];
    lastClickTime = performance.now();
    statusText.textContent = 'Execute the sequence.';

    if (currentMode === 'timepressure') {
      startTimePressure();
    }
  });
}

function generateSequence(length) {
  const seq = [];
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * cells.length);
    seq.push(idx);
  }
  return seq;
}

function playSequence(seq, withInterference = false) {
  return new Promise((resolve) => {
    let i = 0;
    const flashDuration = 450;
    const pauseDuration = 200;

    function flashNext() {
      if (i >= seq.length) {
        setTimeout(() => resolve(), 250);
        return;
      }

      const index = seq[i];
      flashCell(index, flashDuration);

      // interference: random decoy flashes
      if (withInterference && Math.random() < 0.4) {
        const decoyIndex = getRandomDecoyIndex(index);
        setTimeout(() => flashCell(decoyIndex, flashDuration * 0.6, true), 120);
      }

      i++;
      setTimeout(flashNext, flashDuration + pauseDuration);
    }

    flashNext();
  });
}

function flashCell(index, duration, isDecoy = false) {
  const cell = cells[index];
  if (!cell) return;
  cell.classList.add('active');
  if (isDecoy) {
    cell.classList.add('decoy');
  }
  setTimeout(() => {
    cell.classList.remove('active');
    cell.classList.remove('decoy');
  }, duration);
}

function getRandomDecoyIndex(excludeIndex) {
  const available = cells
    .map((_, i) => i)
    .filter((i) => i !== excludeIndex);
  return available[Math.floor(Math.random() * available.length)];
}

function handleCellClick(index) {
  const now = performance.now();
  if (lastClickTime) {
    reactionTimes.push(now - lastClickTime);
  }
  lastClickTime = now;

  totalClicks++;
  playerInput.push(index);

  const expectedSequence =
    currentMode === 'reverse' && round % 3 === 0
      ? [...sequence].reverse()
      : sequence;

  const currentStep = playerInput.length - 1;
  const expectedIndex = expectedSequence[currentStep];

  if (index === expectedIndex) {
    correctClicks++;
    flashCell(index, 150);
  } else {
    mistakes++;
    markWrong(index);
  }

  updateTelemetry();

  if (playerInput.length === expectedSequence.length) {
    acceptingInput = false;
    clearTimePressure();
    evaluateRound(expectedSequence);
  }
}

function markWrong(index) {
  const cell = cells[index];
  if (!cell) return;
  cell.classList.add('wrong');
  setTimeout(() => cell.classList.remove('wrong'), 250);
}

function evaluateRound(expectedSequence) {
  const isPerfect =
    playerInput.length === expectedSequence.length &&
    playerInput.every((v, i) => v === expectedSequence[i]);

  if (isPerfect) {
    statusText.textContent = 'Round complete. Operator sequence correct.';
  } else {
    statusText.textContent = 'Round complete. Sequence deviation detected.';
  }

  // adaptive difficulty
  if (currentMode === 'adaptive') {
    if (isPerfect) {
      currentLength = Math.min(currentLength + 1, 10);
    } else if (mistakes >= 2) {
      currentLength = Math.max(currentLength - 1, baseLength);
    }
  }

  // timepressure: slightly reduce time if perfect
  if (currentMode === 'timepressure') {
    if (isPerfect) {
      timePressureMs = Math.max(2500, timePressureMs - 400);
    } else {
      timePressureMs = Math.min(8000, timePressureMs + 400);
    }
  }

  updateTelemetry();

  // small delay then next round
  setTimeout(() => {
    startRound();
  }, 900);
}

function updateTelemetry() {
  const accuracy =
    totalClicks === 0 ? 0 : Math.round((correctClicks / totalClicks) * 100);
  const avgReaction =
    reactionTimes.length === 0
      ? 0
      : Math.round(
          reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        );

  telemetryAccuracy.textContent = `${accuracy}%`;
  telemetryAvgReaction.textContent = `${avgReaction} ms`;
  telemetryMistakes.textContent = mistakes;
  telemetryRounds.textContent = round;
  telemetryCurve.textContent =
    difficultyHistory.length === 0 ? '–' : difficultyHistory.join(' → ');
}

function showModeBanner() {
  modeBanner.classList.remove('hidden');
  switch (currentMode) {
    case 'adaptive':
      modeBanner.textContent =
        'ADAPTIVE DIFFICULTY — Sequence length adjusts to operator performance.';
      break;
    case 'reverse':
      modeBanner.textContent =
        'REVERSE MODE — Every 3rd round requires reverse sequence execution.';
      break;
    case 'interference':
      modeBanner.textContent =
        'INTERFERENCE MODE — Decoy flashes introduce noise. Filter the signal.';
      break;
    case 'timepressure':
      modeBanner.textContent =
        'TIME PRESSURE — Execute the sequence before the timer expires.';
      break;
  }
}

// TIME PRESSURE

function startTimePressure() {
  timeBarContainer.classList.remove('hidden');
  const start = performance.now();
  const duration = timePressureMs;

  clearTimePressure();

  function tick() {
    const now = performance.now();
    const elapsed = now - start;
    const ratio = Math.max(0, 1 - elapsed / duration);
    timeBar.style.width = `${ratio * 100}%`;

    if (!acceptingInput) {
      timeBar.style.width = '100%';
      return;
    }

    if (elapsed >= duration) {
      // time out
      acceptingInput = false;
      mistakes++;
      statusText.textContent = 'Time expired. Mission failed.';
      updateTelemetry();
      setTimeout(() => startRound(), 900);
      return;
    }

    timeTimer = requestAnimationFrame(tick);
  }

  timeTimer = requestAnimationFrame(tick);
}

function clearTimePressure() {
  if (timeTimer) {
    cancelAnimationFrame(timeTimer);
    timeTimer = null;
  }
  timeBarContainer.classList.add('hidden');
  timeBar.style.width = '100%';
}

// init
showModeBanner();
statusText.textContent = 'Press "Start Mission" to begin.';
