// Augimo Programa V1.2 - API Client
const API_BASE = window.location.origin;
const TOKEN_KEY = 'augimo_jwt';
const USER_KEY = 'augimo_user';

class ApiClient {
  constructor() {
    this.token = sessionStorage.getItem(TOKEN_KEY);
    this.user = JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
  }

  get isAuthenticated() { return !!this.token; }
  get currentUser() { return this.user; }

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    if (res.status === 401) { this.logout(); throw new Error('Sesija pasibaige — prisijunk is naujo'); }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Klaida' }));
      throw new Error(err.error || 'HTTP ' + res.status);
    }
    return res.json();
  }

  async register(email, password, role) {
    const r = await this.request('POST', '/api/auth/register', { email, password, role: role || 'learner' });
    this._save(r); return r;
  }
  async login(email, password) {
    const r = await this.request('POST', '/api/auth/login', { email, password });
    this._save(r); return r;
  }
  logout() {
    this.token = null; this.user = null;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
  _save({ token, user }) {
    this.token = token; this.user = user;
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  recordTaskResult(taskId, score, errorType, metadata) {
    return this.request('POST', '/api/tasks/result', { taskId, score, errorType, metadata });
  }
  recordSignalEvent(eventType, rawData) {
    return this.request('POST', '/api/anti/record-event', { eventType, rawData });
  }
  triggerAnalyze() { return this.request('POST', '/api/anti/analyze', {}); }
  getMySignals() { return this.request('GET', '/api/anti/my-signals'); }
  getTeamSignals() { return this.request('GET', '/api/anti/team-signals'); }
  getSystemFaults() { return this.request('GET', '/api/admin/system-faults'); }
}

window.api = new ApiClient();
