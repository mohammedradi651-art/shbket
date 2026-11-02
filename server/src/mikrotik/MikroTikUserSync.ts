import net from 'node:net';
import crypto from 'node:crypto';

function encodeWord(word: string): Buffer {
  const buf = Buffer.from(word, 'utf8');
  let lenBuf: Buffer;
  if (buf.length < 0x80) lenBuf = Buffer.from([buf.length]);
  else if (buf.length < 0x4000) lenBuf = Buffer.from([(buf.length >> 8) | 0x80, buf.length & 0xff]);
  else lenBuf = Buffer.from([(buf.length >> 16) | 0xc0, (buf.length >> 8) & 0xff, buf.length & 0xff]);
  return Buffer.concat([lenBuf, buf]);
}

export type UserSyncItem = {
  name: string;
  password?: string;
  limitBytesTotal?: number;
  limitUptime?: string;
  comment?: string;
};

export async function addHotspotUsersToMikroTik(
  host: string,
  port: number,
  user: string,
  pass: string,
  users: UserSyncItem[]
): Promise<{ success: boolean; added: number; error?: string }> {
  return new Promise((resolve) => {
    let socket: net.Socket;
    let timer: NodeJS.Timeout;

    const cleanup = () => {
      clearTimeout(timer);
      if (socket) socket.destroy();
    };

    timer = setTimeout(() => {
      cleanup();
      resolve({ success: false, added: 0, error: 'Connection timeout' });
    }, 6000);

    try {
      socket = net.createConnection({ host, port }, async () => {
        try {
          const query = (words: string[]): Promise<Record<string, string>[]> => {
            return new Promise((resQ) => {
              let sentence = Buffer.concat(words.map(encodeWord));
              sentence = Buffer.concat([sentence, Buffer.from([0])]);
              const results: Record<string, string>[] = [];
              let currentItem: Record<string, string> = {};
              let buffer = Buffer.alloc(0);

              const onData = (chunk: Buffer) => {
                buffer = Buffer.concat([buffer, chunk]);
                while (buffer.length > 0) {
                  let len = 0;
                  let offset = 0;
                  const first = buffer[0];
                  if ((first & 0x80) === 0x00) {
                    len = first;
                    offset = 1;
                  } else if ((first & 0xc0) === 0x80) {
                    if (buffer.length < 2) return;
                    len = ((first & 0x3f) << 8) | buffer[1];
                    offset = 2;
                  } else if ((first & 0xe0) === 0xc0) {
                    if (buffer.length < 3) return;
                    len = ((first & 0x1f) << 16) | (buffer[1] << 8) | buffer[2];
                    offset = 3;
                  }
                  if (buffer.length < offset + len) return;
                  const wordBuf = buffer.subarray(offset, offset + len);
                  buffer = buffer.subarray(offset + len);
                  const word = wordBuf.toString('utf8');

                  if (word === '!re') {
                    if (Object.keys(currentItem).length > 0) results.push(currentItem);
                    currentItem = {};
                  } else if (word === '!trap') {
                    if (Object.keys(currentItem).length > 0) results.push(currentItem);
                    currentItem = { '!trap': 'true' };
                  } else if (word === '!done') {
                    if (Object.keys(currentItem).length > 0) results.push(currentItem);
                    socket.off('data', onData);
                    return resQ(results);
                  } else if (word.startsWith('=')) {
                    const eqIdx = word.indexOf('=', 1);
                    if (eqIdx !== -1) {
                      currentItem[word.slice(1, eqIdx)] = word.slice(eqIdx + 1);
                    }
                  }
                }
              };

              socket.on('data', onData);
              socket.write(sentence);
            });
          };

          let res = await query(['/login', `=name=${user}`, `=password=${pass}`]);
          const challenge = res.find((r) => r.ret);
          if (challenge && challenge.ret) {
            const chalBuf = Buffer.from(challenge.ret, 'hex');
            const md5 = crypto.createHash('md5');
            md5.update(Buffer.concat([Buffer.from([0]), Buffer.from(pass, 'utf8'), chalBuf]));
            const responseHex = '00' + md5.digest('hex');
            res = await query(['/login', `=name=${user}`, `=response=${responseHex}`]);
          }

          if (res.some((r) => r['!trap'])) {
            cleanup();
            return resolve({ success: false, added: 0, error: 'Login rejected by MikroTik' });
          }

          let added = 0;
          for (const u of users) {
            const cmd = ['/ip/hotspot/user/add', `=name=${u.name}`, `=password=${u.password || ''}`];
            if (u.limitBytesTotal) cmd.push(`=limit-bytes-total=${u.limitBytesTotal}`);
            if (u.limitUptime) cmd.push(`=limit-uptime=${u.limitUptime}`);
            if (u.comment) cmd.push(`=comment=${u.comment}`);
            await query(cmd);
            added++;
          }

          cleanup();
          resolve({ success: true, added });
        } catch (err: any) {
          cleanup();
          resolve({ success: false, added: 0, error: err?.message || 'Query error' });
        }
      });

      socket.on('error', (err) => {
        cleanup();
        resolve({ success: false, added: 0, error: err.message });
      });
    } catch (err: any) {
      cleanup();
      resolve({ success: false, added: 0, error: err?.message || 'Socket error' });
    }
  });
}
