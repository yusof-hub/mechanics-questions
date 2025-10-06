
let questions = [];

fetch('questions.json')
  .then(res => res.json())
  .then(data => {
    questions = data;
    loadQuiz();
  })
  .catch(err => {
    console.error('Failed to load questions.json:', err);
    document.getElementById('quiz').innerHTML = '<p style="color:red">Failed to load questions.json</p>';
  });

function loadQuiz() {
  const quizDiv = document.getElementById('quiz');
  quizDiv.innerHTML = '';
  questions.forEach((q, i) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'question';
    qDiv.dataset.index = i;

    // header: Q number and level if exists
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const h3 = document.createElement('h3');
    h3.style.margin = '0';
    h3.textContent = `Q${i + 1}. ${q.question}`;
    header.appendChild(h3);

    // per-question controls (Check this)
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.alignItems = 'center';

    const checkThisBtn = document.createElement('button');
    checkThisBtn.type = 'button';
    checkThisBtn.className = 'check-this-btn';
    checkThisBtn.textContent = 'Check this';
    checkThisBtn.dataset.index = i;
    checkThisBtn.style.padding = '6px 10px';
    checkThisBtn.style.borderRadius = '6px';
    checkThisBtn.style.border = 'none';
    checkThisBtn.style.background = '#2563eb';
    checkThisBtn.style.color = '#fff';
    checkThisBtn.style.cursor = 'pointer';

    const resultSpan = document.createElement('span');
    resultSpan.className = 'result-span';
    resultSpan.style.marginLeft = '8px';
    resultSpan.style.fontWeight = '700';

    controls.appendChild(checkThisBtn);
    controls.appendChild(resultSpan);
    header.appendChild(controls);

    qDiv.appendChild(header);

    // options / input area
    if (q.type === 'mcq' && Array.isArray(q.options)) {
      const optsDiv = document.createElement('div');
      optsDiv.className = 'options';
      optsDiv.style.marginTop = '8px';
      q.options.forEach((opt, idx) => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.margin = '6px 0';
        label.style.cursor = 'pointer';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `q${i}`;
        radio.value = opt;
        radio.style.marginRight = '8px';

        label.appendChild(radio);
        // keep option text as is (A. ... etc)
        const txt = document.createTextNode(opt);
        label.appendChild(txt);
        optsDiv.appendChild(label);
      });
      qDiv.appendChild(optsDiv);
    } else {
      // text / numeric
      const input = document.createElement('input');
      input.type = 'text';
      input.id = `q${i}`;
      input.placeholder = 'Type your answer here';
      input.style.width = '100%';
      input.style.padding = '8px';
      input.style.marginTop = '8px';
      input.style.borderRadius = '6px';
      input.style.border = '1px solid #ccc';
      qDiv.appendChild(input);
    }

    // explanation area (hidden until checked)
    const explain = document.createElement('div');
    explain.className = 'explain';
    explain.style.display = 'none';
    explain.style.marginTop = '10px';
    explain.style.padding = '8px';
    explain.style.borderRadius = '6px';
    explain.style.background = '#fff';
    explain.style.border = '1px solid #eee';
    explain.style.color = '#333';
    explain.innerHTML = q.explanation ? `<strong>Explanation:</strong> ${q.explanation}` : `<strong>Answer:</strong> ${q.answer ? q.answer.join(', ') : '—'}`;
    qDiv.appendChild(explain);

    quizDiv.appendChild(qDiv);

    // attach per-question event
    checkThisBtn.addEventListener('click', () => {
      const res = gradeQuestion(i, true);
      resultSpan.textContent = res.correct ? ' Correct' : ' Incorrect';
      resultSpan.style.color = res.correct ? '#16a34a' : '#dc2626';
      // show explanation
      explain.style.display = 'block';
    });
  });
}

// Normalize utilities
function normalizeText(s) {
  if (s === null || s === undefined) return '';
  return String(s).trim().toLowerCase();
}

function normalizeNumericString(s) {
  return normalizeText(s).replace(/\s+/g, '').replace(/;/g, ',');
}

function compareNumericAnswer(expectedRaw, givenRaw) {
  if (!givenRaw) return false;
  const exp = normalizeNumericString(expectedRaw);
  const given = normalizeNumericString(givenRaw);

  if (exp.includes(',')) {
    const expParts = exp.split(',').map(x => x.trim()).filter(Boolean).sort();
    const givenParts = given.split(',').map(x => x.trim()).filter(Boolean).sort();
    return JSON.stringify(expParts) === JSON.stringify(givenParts);
  }
  return exp === given;
}

// grade a single question by index
// showUI -> whether to update UI classes (correct/wrong)
function gradeQuestion(index, showUI = true) {
  const q = questions[index];
  const wrapper = document.querySelector(`.question[data-index="${index}"]`);
  if (!q || !wrapper) return { correct: false };

  let ok = false;
  if (q.type === 'mcq') {
    const sel = wrapper.querySelector('input[type=radio]:checked');
    const val = sel ? sel.value : null;
    if (!val) ok = false;
    else {
      // answers can be letters e.g. ["B"] or full option text ["B. text"] or text
      const expected = (q.answer || []).map(a => normalizeText(a));
      // Compare by letter if options start with "A." or "(a)"
      const firstOpt = q.options && q.options[0] ? String(q.options[0]) : '';
      const usesLetter = firstOpt.trim().match(/^[A-D]\.?/i) !== null || firstOpt.trim().match(/^\(a\)/i) !== null;
      if (usesLetter) {
        // find selected option letter
        // try to detect if val starts with "A" etc
        let selLetter = null;
        const m = val.trim().match(/^([A-Da-d])\b/);
        if (m) selLetter = m[1].toUpperCase();
        else {
          // fallback: find index of option among options array
          const idx = q.options.findIndex(o => normalizeText(o) === normalizeText(val));
          selLetter = idx >= 0 ? String.fromCharCode(65 + idx) : null;
        }
        // expected may be ["B"] or ["B. text"]; compare letters
        if (selLetter) {
          ok = expected.some(e => e === selLetter.toLowerCase() || e === selLetter || e.startsWith(selLetter.toLowerCase()));
        } else {
          // fallback to matching full option text
          ok = expected.some(e => normalizeText(val) === e || normalizeText(val).includes(e));
        }
      } else {
        // options not labeled by letter: compare full text
        ok = expected.some(e => normalizeText(val) === e || normalizeText(val).includes(e));
      }
    }
  } else {
    const input = wrapper.querySelector('input[type=text]');
    const val = input ? input.value : '';
    const expected = (q.answer || []).join(',');
    ok = compareNumericAnswer(expected, val);
  }

  // update UI classes for this question only
  if (showUI) {
    // remove classes
    wrapper.classList.remove('correct');
    wrapper.classList.remove('wrong');
    if (ok) wrapper.classList.add('correct');
    else wrapper.classList.add('wrong');
  }

  return { correct: ok };
}

// Grade all (existing global button)
document.getElementById('checkBtn').addEventListener('click', () => {
  // remove old result spans text
  document.querySelectorAll('.result-span').forEach(s => s.textContent = '');
  let correct = 0;
  questions.forEach((q, i) => {
    const res = gradeQuestion(i, true);
    const wrapper = document.querySelector(`.question[data-index="${i}"]`);
    const span = wrapper.querySelector('.result-span');
    if (res.correct) {
      span.textContent = ' Correct';
      span.style.color = '#16a34a';
      correct++;
    } else {
      span.textContent = ' Incorrect';
      span.style.color = '#dc2626';
    }
    // show explanation for each
    const explain = wrapper.querySelector('.explain');
    if (explain) explain.style.display = 'block';
  });
  const scoreBox = document.getElementById('result');
  if (scoreBox) scoreBox.innerText = `✅ You scored ${correct} / ${questions.length}`;
});

// Reset button behavior
document.getElementById('resetBtn').addEventListener('click', () => {
  // clear inputs and radio buttons
  document.querySelectorAll('input[type=text]').forEach(i => i.value = '');
  document.querySelectorAll('input[type=radio]').forEach(r => r.checked = false);
  // hide explanations and remove classes
  document.querySelectorAll('.explain').forEach(e => e.style.display = 'none');
  document.querySelectorAll('.question').forEach(q => {
    q.classList.remove('correct');
    q.classList.remove('wrong');
    const span = q.querySelector('.result-span');
    if (span) span.textContent = '';
  });
  const scoreBox = document.getElementById('result');
  if (scoreBox) scoreBox.innerText = '';
});

// export CSV (same as before)
document.getElementById('exportBtn').addEventListener('click', () => {
  const data = [['id','question','user_answer','correct']];
  questions.forEach((q, i) => {
    const wrapper = document.querySelector(`.question[data-index="${i}"]`);
    let user = '';
    if (q.type === 'mcq') {
      const sel = wrapper.querySelector('input[type=radio]:checked');
      user = sel ? sel.value : '';
    } else {
      const input = wrapper.querySelector('input[type=text]');
      user = input ? input.value : '';
    }
    const graded = gradeQuestion(i, false);
    data.push([i+1, q.question.replace(/,/g,';'), user.replace(/,/g,';'), graded.correct ? 'true' : 'false']);
  });
  const csv = data.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quiz_results.csv';
  a.click();
  URL.revokeObjectURL(url);
});
