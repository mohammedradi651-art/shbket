import { config } from '../config.js';

let inMemoryQueue: string[] = [];

/**
 * Queue a RouterOS command to be executed by MikroTik router upon next poll.
 */
export async function queueMikroTikSyncCommand(command: string): Promise<void> {
  if (config.useFirebase) {
    try {
      const { firestore } = await import('../firebase.js');
      await firestore.collection('mikrotik_sync_queue').add({
        command,
        createdAt: Date.now()
      });
      return;
    } catch (err) {
      console.warn('Firestore sync queue failed, falling back to memory queue:', err);
    }
  }
  inMemoryQueue.push(command);
}

/**
 * Retrieve all pending RouterOS commands and clear them from the queue.
 */
export async function popMikroTikSyncCommands(): Promise<string[]> {
  if (config.useFirebase) {
    try {
      const { firestore } = await import('../firebase.js');
      const snapshot = await firestore
        .collection('mikrotik_sync_queue')
        .orderBy('createdAt', 'asc')
        .limit(100)
        .get();

      if (!snapshot.empty) {
        const commands = snapshot.docs.map((doc) => doc.data().command as string);
        const batch = firestore.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        return commands;
      }
      return [];
    } catch (err) {
      console.warn('Firestore pop sync queue failed, falling back to memory queue:', err);
    }
  }

  const commands = [...inMemoryQueue];
  inMemoryQueue = [];
  return commands;
}
