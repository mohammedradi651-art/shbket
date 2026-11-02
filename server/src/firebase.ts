import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from './config.js';

const serviceAccountPath = resolve(process.cwd(), config.firebase.serviceAccountPath);
let serviceAccount: { project_id?: string; client_email?: string; private_key?: string } | undefined;

try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as typeof serviceAccount;
} catch {
  serviceAccount = undefined;
}

const projectId = serviceAccount?.project_id ?? config.firebase.projectId;
const clientEmail = serviceAccount?.client_email ?? config.firebase.clientEmail;
const privateKey = serviceAccount?.private_key ?? config.firebase.privateKey;

if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase is enabled but server credentials are incomplete.');

const app = getApps()[0] ?? initializeApp({
  credential: cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') })
});

export const firestore = getFirestore(app);
