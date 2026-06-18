interface LockEntry {
  promise: Promise<void>;
  resolve: () => void;
}

class MutexLock {
  private locks: Map<string, LockEntry[]> = new Map();

  async acquire(key: string): Promise<() => void> {
    const queue = this.locks.get(key) || [];
    
    let resolveFn: () => void = () => {};
    const promise = new Promise<void>((resolve) => {
      resolveFn = resolve;
    });

    queue.push({ promise, resolve: resolveFn });
    this.locks.set(key, queue);

    if (queue.length === 1) {
      return () => this.release(key);
    }

    const prevIndex = queue.length - 2;
    await queue[prevIndex].promise;
    
    return () => this.release(key);
  }

  private release(key: string): void {
    const queue = this.locks.get(key);
    if (!queue || queue.length === 0) return;

    queue.shift();
    
    if (queue.length === 0) {
      this.locks.delete(key);
    } else {
      queue[0].resolve();
    }
  }

  isLocked(key: string): boolean {
    const queue = this.locks.get(key);
    return !!queue && queue.length > 0;
  }
}

export const teamLocks = new MutexLock();
export const wallLocks = new MutexLock();
export const equipmentLocks = new MutexLock();
