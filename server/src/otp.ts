import bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'node:crypto';
import { config } from './config.js';
import { sendSms } from './sms.js';

export type OwnerOtpPayload = { name: string; phone: string; networkName: string; region: string };
type Challenge = OwnerOtpPayload & { id: string; purpose: 'register' | 'login'; codeHash: string; expiresAt: string; attempts: number; consumed: boolean; lastSentAt: number };
const memoryChallenges = new Map<string, Challenge>();
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

async function database() {
  if (!config.useFirebase) return undefined;
  const { firestore } = await import('./firebase.js');
  return firestore;
}

export async function createChallenge(payload: OwnerOtpPayload, purpose: Challenge['purpose']) {
  let db = await database().catch(() => undefined);
  let existingDocument: any = undefined;
  if (db) {
    try {
      const snap = await db.collection('otpChallenges').where('phone', '==', payload.phone).limit(10).get();
      existingDocument = snap.docs.find((document: any) => {
        const data = document.data() as Challenge;
        return data.purpose === purpose && !data.consumed;
      });
    } catch {
      db = undefined;
    }
  }

  const existingMemory = [...memoryChallenges.values()].find((item) => item.phone === payload.phone && item.purpose === purpose && !item.consumed);
  if (existingDocument || existingMemory) {
    const existingData = existingDocument ? (existingDocument.data() as Challenge) : existingMemory!;
    if (Date.now() - existingData.lastSentAt < RESEND_COOLDOWN_MS) throw new Error('OTP_RESEND_TOO_SOON');
  }

  const id = randomUUID();
  const code = String(randomInt(1000, 10000));
  const challenge: Challenge = { ...payload, id, purpose, codeHash: await bcrypt.hash(code, 10), expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(), attempts: 0, consumed: false, lastSentAt: Date.now() };
  await sendSms(payload.phone, `رمز التحقق الخاص بك هو ${code}. صالح لمدة 5 دقائق.`);
  if (db) {
    try {
      await db.collection('otpChallenges').doc(id).set(challenge);
    } catch {
      memoryChallenges.set(id, challenge);
    }
  } else {
    memoryChallenges.set(id, challenge);
  }
  return { challengeId: id, expiresInSeconds: OTP_TTL_MS / 1000 };
}

export async function verifyChallenge(challengeId: string, code: string) {
  let db = await database().catch(() => undefined);
  let reference: any = undefined;
  let snapshot: any = undefined;
  if (db) {
    try {
      reference = db.collection('otpChallenges').doc(challengeId);
      snapshot = await reference.get();
    } catch {
      db = undefined;
      reference = undefined;
      snapshot = undefined;
    }
  }

  const challenge = snapshot?.exists ? (snapshot.data() as Challenge) : memoryChallenges.get(challengeId);
  if (!challenge || challenge.consumed) throw new Error('OTP_INVALID');
  if (new Date(challenge.expiresAt).getTime() < Date.now()) throw new Error('OTP_EXPIRED');
  if (challenge.attempts >= MAX_ATTEMPTS) throw new Error('OTP_LOCKED');
  const valid = await bcrypt.compare(code, challenge.codeHash);
  if (!valid) {
    const attempts = challenge.attempts + 1;
    if (reference) await reference.update({ attempts }).catch(() => undefined);
    memoryChallenges.set(challengeId, { ...challenge, attempts });
    throw new Error('OTP_INVALID');
  }
  if (reference) await reference.update({ consumed: true, consumedAt: new Date().toISOString() }).catch(() => undefined);
  memoryChallenges.set(challengeId, { ...challenge, consumed: true });
  return challenge;
}
