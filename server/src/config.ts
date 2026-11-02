import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  useFirebase: process.env.USE_FIREBASE === 'true',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  sessionSecret: process.env.SESSION_SECRET ?? 'local-development-only-change-me',
  sms: {
    url: process.env.SMS_API_URL ?? 'https://star-sms.vercel.app/api/messages',
    apiKey: process.env.SMS_API_KEY || 'STAR-OTP-770326828',
    senderName: process.env.SMS_SENDER_NAME ?? 'وصل نت'
  },
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? 'server/firebase-service-account.json',
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  }
};
