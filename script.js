let questions = [];

fetch('questions.json')
  .then(res => res.json())
  .then(data => {
    questions = data;
    loadQuiz();
  });

function loadQuiz() {
  const quizDiv = document.getElementById('quiz');
  quizDiv.innerHTML = '';
  questions.forEach((q, i) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'question';
    qDiv.innerHTML = `<h3>Q${i + 1}. ${q.question}</h3>`;

    if (q.type === 'mcq') {
      const opts = q.options.map(opt => `
        <label><input type="radio" name="q${i}" value="${opt}"> ${opt}</label>
      `).join('');
      qDiv.innerHTML += `<div class="options">${opts}</div>`;
    } else {
      qDiv.innerHTML += `<input type="text" id="q${i}" placeholder="Type your answer here">`;
    }
    quizDiv.appendChild(qDiv);
  });
}

document.getElementById('checkBtn').onclick = () => {
  let score = 0;
  questions.forEach((q, i) => {
    const qDiv = document.getElementsByClassName('question')[i];
    let userAnswer = '';

    if (q.type === 'mcq') {
      const selected = document.querySelector(`input[name="q${i}"]:checked`);
      userAnswer = selected ? selected.value.trim().toLowerCase() : '';
    } else {
      userAnswer = document.getElementById(`q${i}`).value.trim().toLowerCase();
    }

    const correctAnswers = q.answer.map(a => a.toLowerCase());
    const isCorrect = correctAnswers.some(ans => userAnswer.includes(ans));

    if (isCorrect) {
      qDiv.classList.add('correct');
      qDiv.classList.remove('wrong');
      score++;
    } else {
      qDiv.classList.add('wrong');
      qDiv.classList.remove('correct');
    }
  });
  document.getElementById('result').innerText = `✅ You scored ${score} / ${questions.length}`;
};

document.getElementById('resetBtn').onclick = () => {
  loadQuiz();
  document.getElementById('result').innerText = '';
};

document.getElementById('exportBtn').onclick = () => {
  let csv = 'Question,Your Answer,Correct\n';
  questions.forEach((q, i) => {
    const input = document.querySelector(`#q${i}`) || document.querySelector(`input[name="q${i}"]:checked`);
    const answer = input ? (input.value || input.innerText) : '';
    csv += `"${q.question}","${answer}","${q.answer.join(' / ')}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'quiz_results.csv';
  a.click();
};
