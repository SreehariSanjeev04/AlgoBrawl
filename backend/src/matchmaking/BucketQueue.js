import Queue from "./Queue.js";

class BucketQueue {
  constructor(start, end) {
    this.start = start;
    this.end = end;
    this.buckets = new Array(end - start + 1).fill().map(() => new Queue());
    this.nodeMap = new Map();
    this.currentBucket = start;
    this.currentSize = 0;
  }

  enqueue(rating, userId, socketId) {
    const modUserId = String(userId);
    if (this.nodeMap.has(modUserId)) return;
    const bucketIndex = rating - this.start;
    const node = this.buckets[bucketIndex].enqueue(userId, rating, socketId);
    this.nodeMap.set(modUserId, node);
    this.currentSize++;
  }

  size() {
    return this.currentSize;
  }

  tryMatch() {
    if (this.currentSize < 2) return null;
    const entries = Array.from(this.nodeMap.values());
    entries.sort((a, b) => a.rating - b.rating);
    for (let i = 0; i < entries.length - 1; i++) {
      const limit = entries[i].rating + 200;
      for (let j = i + 1; j < entries.length && entries[j].rating <= limit; j++) {
        const p1 = entries[i];
        const p2 = entries[j];
        this.nodeMap.delete(String(p1.id));
        this.nodeMap.delete(String(p2.id));
        this.currentSize -= 2;
        return { p1, p2 };
      }
    }
    return null;
  }

  remove(userId) {
    const modUserId = String(userId);
    if (!this.nodeMap.has(modUserId)) return false;
    const node = this.nodeMap.get(modUserId);
    const bucketIndex = node.rating - this.start;
    this.buckets[bucketIndex].remove(node);
    this.nodeMap.delete(modUserId);
    this.currentSize--;
    return true;
  }

  hasAtleastTwoPlayers() {
    return this.nodeMap.size >= 2;
  }
}

export default BucketQueue;
