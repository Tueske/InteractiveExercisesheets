/* ============================================
   VA 2014 Mathematik – Shared Exam Logic
   ============================================ */

const ExamState = {

  load() {
    const raw = localStorage.getItem('va2014_state');
    if (raw) {
      try { return JSON.parse(raw); }
      catch(e) { return this.fresh(); }
    }
    return this.fresh();
  },

  fresh() {
    return {
      studentName:  '',
      studentClass: '',
      scores:    {},   // { "1a": { earned: 2, max: 2, attempts: 0 } }
      answers:   {},   // { "1a": ">" }
      completed: {}    // { "task1": true }
    };
  },

  save(state) {
    localStorage.setItem('va2014_state', JSON.stringify(state));
  },

  totalEarned(state) {
    return Object.values(state.scores)
      .reduce((sum, s) => sum + (s.earned || 0), 0);
  },

  totalMax(state) {
    return Object.values(state.scores)
      .reduce((sum, s) => sum + (s.max || 0), 0);
  }
};

/* ── Answer Checking Helpers ── */

function numericCheck(userAnswer, correct, tolerance = 0.05) {
  const cleaned = String(userAnswer)
    .replace(',', '.')
    .replace(/[^0-9.\-]/g, '');
  const userNum = parseFloat(cleaned);
  if (isNaN(userNum)) return false;
  return Math.abs(userNum - correct) <= tolerance;
}

function stringCheck(userAnswer, correctList) {
  if (!userAnswer.trim()) return false;
  const clean = str =>
    str.trim().toLowerCase()
      .replace(/ä/g,'ae').replace(/ö/g,'oe')
      .replace(/ü/g,'ue').replace(/ß/g,'ss');
  const u = clean(userAnswer);
  return correctList.some(c => {
    const cc = clean(c);
    return u === cc || u.includes(cc) || cc.includes(u);
  });
}

function fractionCheck(userAnswer, numerator, denominator) {
  const cleaned = userAnswer.replace(/\s/g, '');
  const fracMatch = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const n = parseInt(fracMatch[1]);
    const d = parseInt(fracMatch[2]);
    return (n * denominator) === (d * numerator);
  }
  const decimal = parseFloat(cleaned.replace(',', '.'));
  if (!isNaN(decimal)) {
    return Math.abs(decimal - numerator / denominator) < 0.01;
  }
  return false;
}

/* ── UI Helpers ── */

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
      ${hintText
        ? `<div class="hint-text">💡 Hinweis: ${hintText}</div>`
        : ''}`;
  }
}

/*
  NEW BEHAVIOUR:
  ─────────────
  - Inputs are NEVER disabled after submission.
  - Visual correct/incorrect classes are cleared and re-applied
    on every new submission.
  - Points are recorded only on the FIRST attempt.
  - The submit button always stays enabled.
  - After a CORRECT first attempt, inputs get a subtle
    "already-correct" style but remain editable.
*/

function applyInputStyle(subId, isCorrect) {
  document.querySelectorAll(`[data-sub="${subId}"]`).forEach(el => {
    el.classList.remove('correct', 'incorrect');
    el.classList.add(isCorrect ? 'correct' : 'incorrect');
  });
}

function clearInputStyle(subId) {
  document.querySelectorAll(`[data-sub="${subId}"]`).forEach(el => {
    el.classList.remove('correct', 'incorrect');
  });
}

/* ── Points recording ── */

function recordScore(subId, maxPoints, isCorrect, state) {
  if (!state.scores[subId]) {
    state.scores[subId] = { earned: 0, max: maxPoints, attempts: 0 };
  }
  const entry = state.scores[subId];

  // Award points ONLY on first attempt
  if (entry.attempts === 0 && isCorrect) {
    entry.earned = maxPoints;
  }
  entry.attempts += 1;

  return state;
}

/* ── Score display ── */

function updateScoreDisplay() {
  const state  = ExamState.load();
  const earned = ExamState.totalEarned(state);
  document.querySelectorAll('.score-display').forEach(d => {
    d.textContent = `Punkte: ${earned} / 51`;
  });
}

/* ── Navigation ── */

function navigateTo(url) {
  window.location.href = url;
}

function markTaskCompleted(taskId) {
  const state = ExamState.load();
  state.completed[taskId] = true;
  ExamState.save(state);
}

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

document.addEventListener('DOMContentLoaded', () => {
  updateScoreDisplay();
  if (document.querySelector('.task-grid')) {
    updateTaskCards();
  }
});