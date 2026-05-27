// STAR SEQUENCE v0.1 — game engine

const cardGrid = document.getElementById('cardGrid');
const startBtn = document.getElementById('startBtn');
const phaseLabel = document.getElementById('phaseLabel');
const statusText = document.getElementById('statusText');

// telemetry
const telemetryAccuracy = document.getElementById('telemetryAccuracy');
const telemetryHits = document.getElementById('telemetryHits');
const telemetryAvoided = document.getElementById('telemetryAvoided');
const telemetryAnomalyMistakes = document.getElementById('telemetryAnomalyMistakes');
const telemetryMissions = document.getElementById('telemetryMissions');

const CARD_TYPES = [
  { id: 'nebula', label: 'Nebula', class: 'Stable' },
  { id: 'star', label: 'Star', class: 'Stable' },
  { id: 'orbit', label: 'Orbit', class: 'Transitional' },
  { id: 'pulse', label: 'Pulse', class: 'Volatile' },
  { id: 'drift', label: 'Drift', class: 'Transitional' },
  { id: 'flare', label: 'Flare', class: 'Volatile' },
  { id: 'anomaly', label: 'Anomaly', class: 'Anomalous' }
];

const GRID_SIZE = 12;

let cards = [];
let sequence = [];
let currentStep = 0;
let acceptingInput = false;
let missionCount = 0;

// telemetry state
let totalEvents = 0;
let validHits = 0;
let anomaliesAvoided = 0;
let anomalyMistakes = 0;

// mission phases
const PHASES = ['Launch', 'Drift', 'Compression', 'Break', 'Debrief'];
let currentPhaseIndex = 0;

startBtn.addEventListener('click', () => {
  resetMission();
  startMission();
});

function initGrid() {
  cardGrid.innerHTML = '';
  cards = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    const cardEl = document.createElement('div');
    cardEl.className = 'ss-card';
    cardEl.dataset.index = i;

    const labelEl = document.createElement('div');
    labelEl.className = 'ss-card-label';

    const typeEl = document.createElement('div');
    typeEl.className = 'ss-card-type';

    cardEl.appendChild(labelEl);
    cardEl.appendChild(typeEl);

    cardEl.addEventListener('click', () => handleCardClick(i));

    cardGrid.appendChild(cardEl);
    cards.push({ el: cardEl, labelEl, typeEl, type: null });
  }

  assignCardTypes();
}

function assignCardTypes() {
  cards.forEach((card) => {
    const type = CARD_TYPES[Math.floor(Math.random() * CARD_TYPES.length)];
    card.type = type;
    card.labelEl.textContent = type.label;
    card.typeEl.textContent = type.class;
  });
}

function resetMission() {
  sequence = [];
  currentStep = 0;
  acceptingInput = false;
  currentPhaseIndex = 0;
  phaseLabel.textContent = 'Launch';
  statusText.textContent = 'Observe the sequence of events.';
  cards.forEach((c) => {
    c.el.classList.remove('active', 'valid-hit', 'mistake');
  });
}

function startMission() {
  missionCount++;
  updateTelemetry();
  initGrid();

  // build sequence: mix of stable/volatile/transitional + anomalies
  const length = 6;
  sequence = [];
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * cards.length);
    sequence.push(idx);
  }

  playSequence(sequence).then(() => {
    acceptingInput = true;
    currentStep = 0;
    statusText.textContent =
      'Execute: tap only VALID events (Stable, Volatile, Transitional). Avoid Anomalous.';
  });
}

function playSequence(seq) {
  return new Promise((resolve) => {
    let i = 0;
    const flashDuration = 550;
    const pauseDuration = 220;

    function flashNext() {
      if (i >= seq.length) {
        setTimeout(() => resolve(), 300);
        return;
      }

      const index = seq[i];
      const card = cards[index];
      if (!card) {
        i++;
        setTimeout(flashNext, flashDuration + pauseDuration);
        return;
      }

      card.el.classList.add('active');
      setTimeout(() => {
        card.el.classList.remove('active');
      }, flashDuration);

      i++;
      setTimeout(flashNext, flashDuration + pauseDuration);
    }

    flashNext();
  });
}

function handleCardClick(index) {
  if (!acceptingInput) return;

  const card = cards[index];
  if (!card) return;

  const typeClass = card.type.class; // Stable, Volatile, Transitional, Anomalous
  const isAnomaly = typeClass === 'Anomalous';

  totalEvents++;

  if (isAnomaly) {
    // clicking anomaly is a mistake
    anomalyMistakes++;
    markMistake(card.el);
    statusText.textContent = 'Anomaly engaged. Operator deviation logged.';
  } else {
    // valid event
    validHits++;
    markValid(card.el);
    statusText.textContent = 'Valid event acknowledged.';
  }

  // anomaly avoidance: count anomalies that were in sequence but never clicked
  // (handled at mission end)

  currentStep++;

  // phase progression
  if (currentStep === 2) setPhase(1); // Drift
  if (currentStep === 4) setPhase(2); // Compression
  if (currentStep === 5) setPhase(3); // Break

  if (currentStep >= sequence.length) {
    acceptingInput = false;
    setPhase(4); // Debrief
    finalizeMission();
  }

  updateTelemetry();
}

function markValid(el) {
  el.classList.add('valid-hit');
  setTimeout(() => el.classList.remove('valid-hit'), 250);
}

function markMistake(el) {
  el.classList.add('mistake');
  setTimeout(() => el.classList.remove('mistake'), 250);
}

function setPhase(index) {
  currentPhaseIndex = index;
  phaseLabel.textContent = PHASES[index];
}

function finalizeMission() {
  // count anomalies in sequence that were never clicked
  const anomalyIndices = sequence.filter((idx) => cards[idx].type.class === 'Anomalous');
  const clickedAnomalies = Math.min(anomalyMistakes, anomalyIndices.length);
  const avoided = anomalyIndices.length - clickedAnomalies;
  anomaliesAvoided += avoided;

  statusText.textContent = 'Mission complete. Debrief telemetry updated.';
  updateTelemetry();

  // small delay then allow new mission
  setTimeout(() => {
    statusText.textContent = 'Press "Start Mission" to launch a new mission.';
  }, 1200);
}

function updateTelemetry() {
  const totalRelevant = validHits + anomalyMistakes;
  const accuracy =
    totalRelevant === 0 ? 0 : Math.round((validHits / totalRelevant) * 100);

  telemetryAccuracy.textContent = `${accuracy}%`;
  telemetryHits.textContent = validHits;
  telemetryAvoided.textContent = anomaliesAvoided;
  telemetryAnomalyMistakes.textContent = anomalyMistakes;
  telemetryMissions.textContent = missionCount;
}

// init
phaseLabel.textContent = 'Idle';
statusText.textContent = 'Press "Start Mission" to begin.';
initGrid();
updateTelemetry();
