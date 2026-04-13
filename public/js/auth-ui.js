// V1.2 — Auth gate UI
function renderAuthGate() {
  const gate = document.getElementById('auth-gate');
  const main = document.getElementById('main-ui');
  const bar = document.getElementById('user-bar');
  if (window.api.isAuthenticated) {
    if (gate) gate.style.display = 'none';
    if (main) main.style.display = 'block';
    if (bar) bar.style.display = 'block';
    const info = document.getElementById('user-info');
    if (info) info.textContent = window.api.currentUser.email + ' (' + window.api.currentUser.role + ')';
    var mgrLink = document.getElementById('manager-link');
    if (mgrLink && (window.api.currentUser.role === 'manager' || window.api.currentUser.role === 'admin')) {
      mgrLink.style.display = 'inline-block';
    }
    return true;
  }
  if (gate) gate.style.display = 'block';
  if (main) main.style.display = 'none';
  if (bar) bar.style.display = 'none';
  return false;
}

async function handleLogin(e) {
  e.preventDefault();
  var err = document.getElementById('login-error');
  err.textContent = '';
  try {
    await window.api.login(
      document.getElementById('login-email').value,
      document.getElementById('login-password').value
    );
    renderAuthGate();
  } catch (ex) { err.textContent = ex.message; }
}

async function handleRegister(e) {
  e.preventDefault();
  var err = document.getElementById('register-error');
  err.textContent = '';
  try {
    await window.api.register(
      document.getElementById('register-email').value,
      document.getElementById('register-password').value,
      document.getElementById('register-role').value
    );
    renderAuthGate();
  } catch (ex) { err.textContent = ex.message; }
}

function handleLogout() { window.api.logout(); renderAuthGate(); }

document.addEventListener('DOMContentLoaded', function() {
  renderAuthGate();
  var lf = document.getElementById('login-form');
  if (lf) lf.addEventListener('submit', handleLogin);
  var rf = document.getElementById('register-form');
  if (rf) rf.addEventListener('submit', handleRegister);
  var lb = document.getElementById('logout-btn');
  if (lb) lb.addEventListener('click', handleLogout);
});
