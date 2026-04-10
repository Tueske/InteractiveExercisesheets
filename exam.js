/* ============================================
   VA 2014 Mathematik – Shared Exam Logic
   ============================================ */

const ExamState = {

  // Load full state from localStorage
  load() {
    const raw = localStorage.getItem('va2014_state');
    if (raw) {
      try { return JSON.parse(raw); }
      catch(e) { return this.fresh(); }
    }
    return this.fresh();
  },

  // Fresh empty state
  fresh() {
    return {
      studentName: '',
      studentClass: '',
      scores: {},      // { "1a": { earned: 2, max: 2, attempts: 0 } }
      answers: {},     // { "1a": ">" }
      completed: {}    // { "task1": true }
    };
  },

  // Save state
  save(state) {
    localStorage.setItem('va2014_state', JSON.stringify(state));
  },

  // Get total earned points
  totalEarned(state) {
    return Object.values(state.scores)
      .reduce((sum, s) => sum + (s.earned || 0), 0);
  },

  // Get total max points for answered questions
  totalMax(state) {
    return Object.values(state.scores)
      .reduce((sum, s) => sum + (s.max || 0), 0);
  }
};

/* --- Answer Checking Helpers --- */

// Check if numeric answer is within tolerance
function numericCheck(userAnswer, correct, tolerance = 0.05) {
  const userNum = parseFloat(
    userAnswer.replace(',', '.').replace(/[^0-9.\-]/g, '')
  );
  if (isNaN(userNum)) return false;
  return Math.abs(userNum - correct) <= tolerance;
}

// Check string answer (case-insensitive, trimmed)
function stringCheck(userAnswer, correctList) {
  const cleaned = userAnswer.trim().toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe')
    .replace(/ü/g,'ue').replace(/ß/g,'ss');
  return correctList.some(c => {
    const cc = c.toLowerCase()
      .replace(/ä/g,'ae').replace(/ö/g,'oe')
      .replace(/ü/g,'ue').replace(/ß/g,'ss');
    return cleaned === cc || cleaned.includes(cc) || cc.includes(cleaned);
  });
}

// Check fraction answer like "1/2"
function fractionCheck(userAnswer, numerator, denominator) {
  const cleaned = userAnswer.replace(/\s/g,'');
  // Accept various formats: 1/2, ½, 0.5 for 1/2
  const fracMatch = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const n = parseInt(fracMatch[1]);
    const d = parseInt(fracMatch[2]);
    // Check if equivalent fraction
    return (n * denominator) === (d * numerator);
  }
  // Accept decimal
  const decimal = parseFloat(cleaned.replace(',','.'));
  if (!isNaN(decimal)) {
    return Math.abs(decimal - numerator/denominator) < 0.01;
  }
  return false;
}

/* --- UI Helpers --- */

function showFeedback(subId, isCorrect, hintText = '') {
  const box = document.getElementById(`feedback-${subId}`);
  if (!box) return;

  box.className = `feedback-box show ${isCorrect ? 'correct' : 'incorrect'}`;

  if (isCorrect) {
    box.innerHTML = `<span class="feedback-icon">✅</span>
      <strong>Richtig!</strong>`;
  } else {
    box.innerHTML = `<span class="feedback-icon">❌</span>
      <strong>Leider falsch.</strong>
      ${hintText ? `<div class="hint-text">💡 Hinweis: ${hintText}</div>` : ''}`;
  }
}

function lockInput(subId) {
  // Lock all inputs for this sub-exercise
  const inputs = document.querySelectorAll(`[data-sub="${subId}"]`);
  inputs.forEach(el => {
    el.classList.add('locked');
    el.disabled = true;
  });
  const btn = document.getElementById(`btn-${subId}`);
  if (btn) btn.disabled = true;
}

function markInput(subId, isCorrect) {
  const inputs = document.querySelectorAll(`[data-sub="${subId}"]`);
  inputs.forEach(el => {
    el.classList.add(isCorrect ? 'correct' : 'incorrect');
  });
}

function updateScoreDisplay() {
  const state = ExamState.load();
  const earned = ExamState.totalEarned(state);
  const displays = document.querySelectorAll('.score-display');
  displays.forEach(d => {
    d.textContent = `Punkte: ${earned} / 51`;
  });
}

/* --- Points recording --- */

function recordScore(subId, maxPoints, isCorrect, state) {
  if (!state.scores[subId]) {
    state.scores[subId] = { earned: 0, max: maxPoints, attempts: 0 };
  }
  const entry = state.scores[subId];
  entry.attempts += 1;

  // Only award points on FIRST attempt
  if (entry.attempts === 1 && isCorrect) {
    entry.earned = maxPoints;
  }
  return state;
}

/* --- Navigation --- */

function navigateTo(url) {
  window.location.href = url;
}

// Mark task as visited/completed
function markTaskCompleted(taskId) {
  const state = ExamState.load();
  state.completed[taskId] = true;
  ExamState.save(state);
}

// Update task cards on index with completion status
function updateTaskCards() {
  const state = ExamState.load();
  for (let i = 1; i <= 7; i++) {
    const card = document.querySelector(`a[href="aufgabe${i}.html"]`);
    if (card && state.completed[`task${i}`]) {
      card.classList.add('completed');
      const numEl = card.querySelector('.task-number');
      if (numEl) numEl.textContent = '✓';
    }
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  updateScoreDisplay();
  if (document.querySelector('.task-grid')) {
    updateTaskCards();
  }
});