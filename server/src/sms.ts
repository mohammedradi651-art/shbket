import { config } from './config.js';

export async function sendSms(phone: string, message: string) {
  if (!config.sms.apiKey) throw new Error('SMS_API_KEY is not configured.');
  const response = await fetch(config.sms.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': config.sms.apiKey },
    body: JSON.stringify({ phone, message })
  });
  if (!response.ok) throw new Error(`SMS provider rejected the request (${response.status}).`);
}
