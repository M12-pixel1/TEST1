# V1 Pilot Readiness Runbook

## Purpose

This runbook prepares a local/staging V1 demo environment with predictable seed data for:
- one organization
- one manager user
- two learner users
- completed diagnostic baseline data
- generated growth paths
- seeded practice tasks and attempts
- manager dashboard visibility

## Demo identities

- Organization: `demo-org-1` (`Northwind Industrial Pilot`)
- Manager: `demo-manager-1` (`Marta Stone`, Sales Manager)
- Learners:
  - `demo-learner-1` (`Liam Brooks`, Account Executive)
  - `demo-learner-2` (`Nora Kim`, Account Executive)

## Configure DB path

Set `V1_DB_PATH` if you want a custom location:

```bash
export V1_DB_PATH=./tmp/pilot-v1.sqlite
```

Default path (when unset):

- `app/data/v1.sqlite`

Recommended demo env values:

```bash
export V1_DB_PATH=./tmp/pilot-v1.sqlite
export PILOT_ORGANIZATION_ID=demo-org-1
export PILOT_ACTIVE_USER_ID=demo-learner-1
```

## Initialize fresh pilot data

```bash
pnpm pilot:init
```

This will:
1. create/open DB,
2. run migrations,
3. seed pilot/demo data,
4. print a JSON summary.

## Reset and reseed

```bash
pnpm pilot:reset
```

This is a hard reset:
- it removes existing DB file (if not `:memory:`),
- then runs full bootstrap again.

Safety options:

```bash
PILOT_RESET_CONFIRM=YES node scripts/pilot-reset.mjs
node scripts/pilot-reset.mjs --force
```

### Safer reset variant (recommended before customer demos)

```bash
pnpm pilot:reset:safe -- --confirm=RESET_DEMO_DB
```

This variant refuses to run unless explicit confirmation token is provided.

## Customer demo talk track (step-by-step)

1. **Learner entry**
   - Operator sets `PILOT_ACTIVE_USER_ID=demo-learner-1`.
   - **Expected result:** learner context is active for the walkthrough.
   - **Point out:** “We are now in a real learner persona, not a generic test user.”

2. **Diagnostic**
   - Run the diagnostic to completion.
   - **Expected result:** completion message appears.
   - **Point out:** “This baseline is the starting point for coaching and progress.”

3. **Snapshot**
   - Show skill snapshot right after completion.
   - **Expected result:** top strength, top focus area, next action text are visible.
   - **Point out:** “We immediately turn answers into a readable coaching snapshot.”

4. **Next step**
   - Click “Show next step”.
   - **Expected result:** today action + week plan + month focus are displayed.
   - **Point out:** “This converts the diagnostic into an actionable plan.”

5. **Practice**
   - Click “Start practice”, submit one response.
   - **Expected result:** assigned task prompt is shown and attempt is accepted.
   - **Point out:** “Practice is tied to the focus area, not random content.”

6. **Feedback**
   - Review generated strengths/gaps/next action.
   - **Expected result:** feedback text includes all 3 sections.
   - **Point out:** “Feedback is concrete and immediately reusable in the next attempt.”

7. **Progress proof**
   - Open progress proof section.
   - **Expected result:** baseline reference + attempts count + latest feedback summary.
   - **Point out:** “You can see where learner started and what evidence of movement exists.”

8. **Manager dashboard**
   - Switch to manager identity (`demo-manager-1`) for manager read path.
   - **Expected result:** dashboard loads for manager; learner identity is blocked.
   - **Point out:** “Manager views are role-protected for pilot safety.”

## Role-safe access checks

- Manager dashboard is allowed for manager/admin role in the organization.
- Learner role is blocked from manager dashboard access.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
```
