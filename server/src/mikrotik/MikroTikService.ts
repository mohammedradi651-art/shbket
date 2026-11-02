import net from 'node:net';

export type MikroTikSession = { customerId: string; networkId: string; mikrotikId: string };

export interface MikroTikService {
  authorizeSession(session: MikroTikSession): Promise<{ authorized: boolean; externalSessionId?: string }>;
  disconnectSession(session: MikroTikSession): Promise<void>;
  healthCheck(host: string, port: number): Promise<{ online: boolean; latencyMs: number; error?: string }>;
}

export async function probeMikroTik(host: string, port: number, timeoutMs = 3000): Promise<{ online: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      if (!settled) {
        settled = true;
        const latencyMs = Date.now() - start;
        socket.destroy();
        resolve({ online: true, latencyMs });
      }
    });

    socket.on('timeout', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve({ online: false, latencyMs: timeoutMs, error: 'انتهت مهلة الاتصال بالمايكروتك.' });
      }
    });

    socket.on('error', (err) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve({ online: false, latencyMs: Date.now() - start, error: err.message });
      }
    });

    socket.connect(port, host);
  });
}

export class LiveMikroTikService implements MikroTikService {
  async authorizeSession() { return { authorized: false }; }
  async disconnectSession() { return undefined; }
  async healthCheck(host: string, port: number) {
    return probeMikroTik(host, port);
  }
}

export const mikrotikService = new LiveMikroTikService();

