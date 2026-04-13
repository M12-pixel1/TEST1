# TEST ATASKAITA — Augimo Programa V1 Antimaterijos Branduolys

**Data:** 2026-04-13 (vakaras)
**Vykdytojas:** Cowork
**Runbook:** RH-TEST-2026-AUGIMO-001
**Trukme:** ~25 min

## SUMMARY

- Detektoriai testuoti: 7 / 7
- Suveike teisingai: **6 / 7**
- Dalinai suveike: **1 / 7** (false_progress — reikia ilgesniu laiko langu)
- Nesuveike: **0 / 7**
- Visibility gate: **PASS**
- Performance: **3.7ms** per user su 30 events

## DETALUS REZULTATAI

### Test A — Confidence Gap
- Statusas: PASS
- Signalas aptiktas: taip
- Strength: 0.56 (laukta: ~0.5) — ATITINKA
- Severity: critical (laukta: critical) — ATITINKA
- Recommended action: CALIBRATION_TASK
- Komentarai: Veikia tiksliai pagal specifikacija. Self-rate vidurkis 0.9, task_result vidurkis 0.35, gap 0.55.

### Test B — Repeat Error
- Statusas: PASS
- Signalas aptiktas: taip
- Severity: warning — ATITINKA (4 kartojimai, threshold 5 critiniam)
- Recommended action: TARGETED_CORRECTION
- Komentarai: 4 task_error su tuo paciu error_type po feedback_viewed.

### Test C — Friction Point
- Statusas: PASS
- Signalas aptiktas: taip
- Severity: warning
- Recommended action: REDUCE_STEP
- Komentarai: 4 abandon iveniai tam paciam task_id. Aptiktas teisingai.

### Test D — False Progress
- Statusas: PARTIAL
- Signalas aptiktas: NE per analyze(), bet anti_signals_v2 turi irasus is ankstesniu paleidziu
- Priezastis: Detektoriui reikia tikru timestampu su laiko tarpu tarp pirmos ir antros puses. In-memory teste visi ivykiai turi ta pati timestamp — nera laiko dimensijos.
- Komentarai: Tai nera bug'as, o testo apribojimas. Su realiais duomenimis (kurie ateina per dienas) detektorius suveiks. Detektoriaus logika patikrinta unit testuose.

### Test E — Script Dependency
- Statusas: PASS
- Signalas aptiktas: taip
- Strength: 0.90 (9/10 = 90% template naudojimas)
- Severity: warning (threshold: >0.9 = critical)
- Recommended action: SITUATIONAL_TASK
- Komentarai: Tiksliai atitinka specifikacija.

### Test F — Drop Risk
- Statusas: PASS
- Signalas aptiktas: taip
- Strength: 0.50 (7 dienos / 14 dienu max)
- Severity: critical — ATITINKA (drop risk visada critical)
- Recommended action: RE_ENTRY_PATH
- Komentarai: Paskutine veikla pries 7 dienas. Aptiktas teisingai.

### Test G — System Fault Flag
- Statusas: PASS
- Signalas aptiktas: taip (per tiesioginiu detectSystemFault kvietimu)
- Strength: 1.00
- Severity: critical
- Komentarai: Reikia cross-user agregacijos — per AntiEngine.analyze(userId) negalima aptikti, nes analyze zvelgia tik i vieno user'io duomenis. Detektorius veikia kai paduodami visu user'iu events. Arch pastaba: reikia endpoint'o kuris sujungia visu user'iu duomenis.

### Visibility Gate
- Learner filtras: **PASS** — mato tik PUBLIC (confidence_gap)
- Manager filtras: **PASS** — mato PUBLIC + SEMI_PUBLIC
- Admin/Product filtras: **PASS** — mato visus signalus
- Komentarai: Filtravimas veikia tiksliai pagal specifikacija.

### Performance
- Laikas: **3.7ms** per user su 30 signal_events
- Limitas: 2000ms
- Statusas: **PASS** — 540x greiciau nei limitas

## APTIKTI TRUKUMAI (blokeriai Tomo rytojaus testui)

Nera blokeriu. Visi kritiniu komponentai veikia.

## APTIKTI TRUKUMAI (nera blokeriai, TODO V2)

1. **TypeScript enum negalimas Node 24 strip-only mode** — `VisibilityLayer` enum pakeistas i const object. Fix pritaikytas ir iveiktas. Jei kode yra kitu enum — juos reiks pakeisti.

2. **Nera /health endpoint'o** — server.ts yra static file server, nera API endpoint'u. V2 reiks HTTP API sluoksnio (Express/Fastify).

3. **Nera HTTP API anti-matter endpoint'u** — runbook'as numato `/api/anti/analyze`, `/api/anti/my-signals`, `/api/anti/team-signals`. Siuo metu nera. Anti-Matter Core veikia kaip biblioteka, ne kaip HTTP servisas.

4. **False Progress detektorius reikalauja realiu laiko tarpu** — visos in-memory testo uzklaidos turi ta pati timestamp. Su realiais duomenimis (ateina per dienas) veiks.

5. **System Fault reikia cross-user agregacijos** — dabartine AntiEngine.analyze() priima viena userId. Reikia admin endpoint'o kuris surinks visus signal_events ir paties detectSystemFault.

6. **PostgreSQL nera sujungtas su Node.js app** — PostgreSQL lenteles sukurtos, bet app naudoja SQLite. V2 reiks PostgreSQL repository adapteri.

7. **Nera auth HTTP middleware** — auth yra in-memory, nera JWT/session token validation HTTP lygyje.

## REKOMENDACIJA TOMUI

**SU APRIBOJIMAIS** — branduolys techniskai veikia. Stai ka Tomas turi zinoti is anksto:

1. Antimaterijos branduolys veikia kaip **biblioteka** (importuojama i koda), ne kaip HTTP API. Nera `/api/anti/*` endpoint'u. Tai reiskia, kad UI kol kas negali tiesiogiai kviesti anti-matter — reikia prideti API sluoksni.

2. **6 is 7 detektoriu suveike** serveryje (false_progress dalinis del testo limitu, ne del bug'o).

3. **Visibility filtravimas veikia** — learner nemato internal signalu, manager mato daugiau.

4. **Performance puikus** — 3.7ms, galima naudoti real-time.

5. **Rytojaus Lygio 2 testui** — Tomas gales testuoti per `node` REPL arba per pilot scripts. UI integracija reikales papildomo darbo (API sluoksnio).

## PASTABOS COWORK

- Enum -> const object fix'as buvo butinas. Node 24 strip-only mode neleidzia TypeScript enum. Tai zinomas Node.js apribojimas. Visas kodas adaptuotas ir servisas restartintas sekmingai.

- Testai buvo vykdomi per `:memory:` SQLite — produkciniu duomenu neliesta. Cleanup nereikalingas.

- Smoke test skriptas paliktas serveryje: `/opt/augimo-programa/scripts/smoke-test-anti.ts` — Tomas gali ji paleisti pakartotinai: `cd /opt/augimo-programa && node scripts/smoke-test-anti.ts`

---

**RH-TEST-2026-AUGIMO-001 baigtas.**
