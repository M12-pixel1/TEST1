# DEPLOY ATASKAITA — Augimo Programa V1
**Data:** 2026-04-13
**Vykdytojas:** Cowork (Claude Code)
**Runbook:** RH-DEPLOY-2026-AUGIMO-002

## Padaryta

- [x] Repo paimtas: lokaliai is 1test-main.zip
- [x] DB sprendimas: atskira DB augimo_programa — motyvacija: pilot:reset:safe rodo eksperimentini etapa
- [x] **Antimaterijos branduolys V1** — visi 6 blokai:
  - Block 1: SignalCollector (signal_events lentele, CRUD)
  - Block 2: PatternDetector (7 detektoriai kaip metodai)
  - Block 3: SignalScorer (anti_signals_v2 lentele, persist/resolve)
  - Block 4: Interpreter (signalai -> zmogaus kalba, lietuviu k.)
  - Block 5: Corrector (CORRECTION_MAP, 7 koreguojantys veiksmai)
  - Block 6: VisibilityGate (PUBLIC/SEMI_PUBLIC/INTERNAL filtravimas)
  - Orchestrator: AntiEngine (jungia visus 6 blokus i viena pipeline)
- [x] 7 signalai implementuoti: confidence_gap, repeat_error, friction_point, false_progress, script_dependency, drop_risk, system_fault
- [x] Schema: signal_events + anti_signals_v2 lenteles (migracija 003)
- [x] bcrypt auth (hashSync/compareSync, SALT_ROUNDS=12)
- [x] ESLint + @typescript-eslint/plugin — 0 errors
- [x] Test coverage skriptas: npm run test:coverage
- [x] Python/Node atskirti: analytics-python/ + app/ (Node)
- [x] Node.js 24 LTS target (--experimental-strip-types paalintas)
- [x] TypeScript ES2024 target + erasableSyntaxOnly
- [x] PostgreSQL migracijos paruostos: deploy/003_anti_matter_core_pg.sql
- [x] Unit testai: 7 detektoriams + interpreter + corrector + visibility
- [x] Integracijos testai: pilnas AntiEngine pipeline su :memory: DB

## BLOKUOTA — Laukia Tomo veiksmo

- [ ] **SSH prieiga i serveri** (134.209.252.209) — nera SSH raktu siame kompiuteryje
- [ ] DNS A irasas: academy.rupestelis.com -> 134.209.252.209
- [ ] PostgreSQL DB setup serveryje (Faze 8)
- [ ] Systemd + Caddy konfiguracija (Faze 9)
- [ ] Pirmas testas su realiu vartotoju

## Kai SSH bus — likusios fazes

Faze 8: PostgreSQL
```bash
sudo -u postgres psql << EOF
CREATE USER augimo_user WITH PASSWORD '$(openssl rand -hex 16)';
CREATE DATABASE augimo_programa OWNER augimo_user;
EOF
psql -U augimo_user -d augimo_programa -f deploy/003_anti_matter_core_pg.sql
```

Faze 9: Systemd + Caddy (paruosti sablonai deploy/ kataloge)

## Anti Engine pradinis statusas

- 0 signalu aptikta (programa dar neturi vartotoju)
- 7 detektoriai aktyvus ir testuoti
- Pattern detection vyks po pirmo realaus task_result
- Visibility filtravimas veikia: user mato 2 signalus, manager 5, product team visus 7

## Failai sukurti/pakeisti

**Nauji failai (14):**
- app/src/anti/types.ts
- app/src/anti/signal-collector.ts
- app/src/anti/pattern-detector.ts
- app/src/anti/signal-scorer.ts
- app/src/anti/interpreter.ts
- app/src/anti/corrector.ts
- app/src/anti/visibility.ts
- app/src/anti/anti-engine.ts
- app/src/db/migrations/003_anti_matter_core.sql
- app/tests/anti-engine.unit.test.ts
- app/tests/integration/anti-engine.integration.test.ts
- deploy/003_anti_matter_core_pg.sql
- scripts/rehash-passwords.mjs
- DEPLOY_DECISIONS.md

**Pakeisti failai (9):**
- package.json (versija 0.2.0, engines, eslint, bcrypt, scripts)
- tsconfig.json (ES2024, erasableSyntaxOnly)
- eslint.config.js (typescript-eslint)
- app/src/index.ts (anti module exports)
- app/src/domain/auth.ts (bcrypt)
- app/src/db/v1-db.ts (migracija 003)
- app/src/ui/browser-diagnostic-screen.ts (ESLint fix)
- .devcontainer/devcontainer.json (Python 3.13, Node 24, paths)
- README.md (nauja struktura, anti-matter docs)

**Perkelti failai:**
- main.py, dashboard.py, graph.py, tools.py -> analytics-python/

## Sekantys zingsniai

1. Tomas sugeneruoti SSH rakta arba duoti slaptazodi (134.209.252.209)
2. Deploy fazes 8-9
3. DNS A irasas
4. Pirmas testas su Tomu kaip vartotoju
5. Patikrinti, kad anti engine reaguoja i pradinius signalus
