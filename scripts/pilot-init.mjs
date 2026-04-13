import { bootstrapPilotEnvironment } from '../app/src/bootstrap/pilot-init.ts';

const { db, summary } = bootstrapPilotEnvironment(process.env);

console.log('Pilot environment initialized.');
console.log(JSON.stringify(summary, null, 2));

db.close();
