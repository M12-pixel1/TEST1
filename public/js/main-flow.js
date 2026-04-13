// V1.2 — Main learner flow
var DIAG_QUESTIONS = [
  { id:'diag-1', question:'Kaip tu vertini savo dabartin\u012f lyg\u012f \u0161ioje srityje?', type:'self_rate',
    options:[0.2,0.4,0.6,0.8,1.0], labels:['Prad\u0117dantysis','Ma\u017eai patirties','Vidutinis','Patyr\u0119s','Ekspertas'] },
  { id:'diag-2', question:'Koks yra 2 + 2?', type:'knowledge_check', correct:'4' },
  { id:'diag-3', question:'\u012evardink tris spalvas (atskirk kableliu).', type:'open' }
];

var diagIdx = 0, diagAnswers = [];

async function startDiagnostic() {
  diagIdx = 0; diagAnswers = [];
  try { await window.api.recordSignalEvent('session_start', { flow:'diagnostic' }); } catch(e) {}
  showDiagQ();
}

function showDiagQ() {
  var c = document.getElementById('diagnostic-area');
  if (diagIdx >= DIAG_QUESTIONS.length) {
    c.innerHTML = '<p><strong>Diagnostika baigta.</strong> Spausk "Rodyti sekant\u012f \u017eingsn\u012f".</p>';
    return;
  }
  var q = DIAG_QUESTIONS[diagIdx];
  var h = '<p><strong>Klausimas ' + (diagIdx+1) + '/' + DIAG_QUESTIONS.length + ':</strong> ' + q.question + '</p>';
  if (q.type === 'self_rate') {
    h += '<div>';
    for (var i = 0; i < q.options.length; i++)
      h += '<button class="btn-option" onclick="submitDiag(' + q.options[i] + ',\'self_rate\')">' + q.labels[i] + '</button> ';
    h += '</div>';
  } else {
    h += '<input id="diag-input" type="text" placeholder="Tavo atsakymas"><button class="btn-primary" onclick="submitDiag(document.getElementById(\'diag-input\').value,\'' + q.type + '\')">Pateikti</button>';
  }
  c.innerHTML = h;
}

async function submitDiag(answer, type) {
  var q = DIAG_QUESTIONS[diagIdx], score = 0;
  if (type === 'self_rate') {
    score = parseFloat(answer);
    await window.api.recordSignalEvent('self_rate', { rating: score, questionId: q.id });
  } else if (type === 'knowledge_check') {
    score = String(answer).trim() === q.correct ? 1.0 : 0.0;
    await window.api.recordTaskResult(q.id, score, score < 1 ? 'wrong_answer' : null);
  } else {
    score = String(answer).split(/[,\s]+/).filter(Boolean).length >= 3 ? 0.8 : 0.3;
    await window.api.recordTaskResult(q.id, score, score < 0.5 ? 'incomplete' : null);
  }
  diagAnswers.push({ id: q.id, answer: answer, score: score });
  diagIdx++;
  showDiagQ();
}

async function showNextStep() {
  var c = document.getElementById('next-step-area');
  c.innerHTML = '<p>Analizuojama...</p>';
  try {
    await window.api.triggerAnalyze();
    var data = await window.api.getMySignals();
    if (!data.signals || data.signals.length === 0) {
      c.innerHTML = '<p>Viskas atrodo gerai! Pereik prie praktin\u0117s u\u017eduoties.</p>';
    } else {
      var h = '<p><strong>Sistema pasteb\u0117jo:</strong></p><ul>';
      for (var i = 0; i < data.signals.length; i++) h += '<li>' + sigMsg(data.signals[i]) + '</li>';
      h += '</ul><p>Pereik prie praktin\u0117s u\u017eduoties.</p>';
      c.innerHTML = h;
    }
  } catch(e) { c.innerHTML = '<p style="color:red">Klaida: ' + e.message + '</p>'; }
}

function sigMsg(s) {
  var m = {
    confidence_gap: 'Tavo sav\u0119s vertinimas ir rezultatai \u0161iek tiek skiriasi \u2014 bandysime kalibruoti.',
    repeat_error: 'Ta pati klaida kartojasi \u2014 skirsime jai ypatinga d\u0117mes\u012f.',
    friction_point: 'Matome, kad vienoje vietoje sustoji \u2014 suma\u017einsime \u017eingsn\u012f.',
    false_progress: 'Daug veiklos, bet kokyb\u0117 svyruoja \u2014 sul\u0117tinsim.',
    script_dependency: 'Labai remiesi \u0161ablonais \u2014 pabandysim situacijas be j\u0173.',
    drop_risk: 'Tempas l\u0117t\u0117ja \u2014 padarom trump\u0105 \u017eingsn\u012f, kad sugr\u012f\u017etum.'
  };
  return m[s.signalType] || ('Signalas: ' + s.signalType);
}

var practiceTaskId = null;

function startPractice() {
  practiceTaskId = 'practice-' + Date.now();
  document.getElementById('practice-area').innerHTML =
    '<p><strong>Praktin\u0117 u\u017eduotis:</strong> Apra\u0161yk savais \u017eod\u017eiais, ka i\u0161mokai.</p>' +
    '<textarea id="practice-input" rows="4" cols="50" placeholder="Tavo atsakymas..."></textarea><br>' +
    '<button class="btn-primary" onclick="submitPractice()">Pateikti praktika</button>';
}

async function submitPractice() {
  var a = document.getElementById('practice-input').value;
  var score = a.length > 50 ? 0.7 : 0.3;
  try {
    await window.api.recordTaskResult(practiceTaskId, score, score < 0.5 ? 'too_short' : null, { answer_length: a.length });
    document.getElementById('practice-area').innerHTML += '<p style="color:green">Pateikta! Spausk "Rodyti progreso irodym\u0105".</p>';
  } catch(e) { alert('Klaida: ' + e.message); }
}

async function showProgressProof() {
  var c = document.getElementById('progress-area');
  c.innerHTML = '<p>Kraunama...</p>';
  try {
    await window.api.triggerAnalyze();
    var data = await window.api.getMySignals();
    var h = '<h3>Tavo progresas</h3><p><strong>Diagnostikos atsakymai:</strong> ' + diagAnswers.length + '</p>' +
            '<p><strong>Aptikti signalai:</strong> ' + data.signals.length + '</p>';
    if (data.signals.length > 0) {
      h += '<h4>Aktyv\u016bs signalai:</h4><ul>';
      for (var i = 0; i < data.signals.length; i++) {
        var s = data.signals[i];
        var col = s.severity === 'critical' ? 'red' : s.severity === 'warning' ? 'orange' : 'gray';
        h += '<li><strong style="color:' + col + '">' + s.signalType + '</strong> (stiprumas: ' +
             (s.strength * 100).toFixed(0) + '%, rimtumas: ' + s.severity + ')<br><em>' +
             sigMsg(s) + '</em><br><small>Rekomenduojama: ' + s.recommendedAction + '</small></li>';
      }
      h += '</ul>';
    } else {
      h += '<p>Signal\u0173 kol kas n\u0117ra. Prat\u0119sk mokym\u0105si.</p>';
    }
    c.innerHTML = h;
  } catch(e) { c.innerHTML = '<p style="color:red">Klaida: ' + e.message + '</p>'; }
}

document.addEventListener('DOMContentLoaded', function() {
  var b1 = document.getElementById('start-diagnostic-btn'); if (b1) b1.addEventListener('click', startDiagnostic);
  var b2 = document.getElementById('show-next-step-btn'); if (b2) b2.addEventListener('click', showNextStep);
  var b3 = document.getElementById('start-practice-btn'); if (b3) b3.addEventListener('click', startPractice);
  var b4 = document.getElementById('show-progress-btn'); if (b4) b4.addEventListener('click', showProgressProof);
});

window.submitDiag = submitDiag;
window.submitPractice = submitPractice;
