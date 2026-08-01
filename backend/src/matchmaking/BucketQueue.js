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
    const clamped = Math.max(this.start, Math.min(this.end, Math.round(rating)));
    const bucketIndex = clamped - this.start;
    const node = this.buckets[bucketIndex].enqueue(userId, clamped, socketId);
    this.nodeMap.set(modUserId, node);
    this.currentSize++;
  }

  size() {
    return this.currentSize;
  }

  tryMatch() {
    if (this.currentSize < 2) return null;
    const maxGap = 200;
    for (let i = 0; i < this.buckets.length; i++) {
      const queue = this.buckets[i];
      if (!queue.front) continue;
      if (queue.front.next) {
        return this.takePair(queue, queue);
      }
      for (let j = i + 1; j <= i + maxGap && j < this.buckets.length; j++) {
        if (this.buckets[j].front) {
          return this.takePair(queue, this.buckets[j]);
        }
      }
    }
    return null;
  }

  takePair(queueA, queueB) {
    const p1 = queueA.dequeue();
    const p2 = queueB.dequeue();
    this.nodeMap.delete(String(p1.id));
    this.nodeMap.delete(String(p2.id));
    this.currentSize -= 2;
    return { p1, p2 };
  }

  remove(userId) {
    const modUserId = String(userId);
    if (!this.nodeMap.has(modUserId)) return false;
    const node = this.nodeMap.get(modUserId);
    const bucketIndex = node.rating - this.start;
    if (bucketIndex >= 0 && bucketIndex < this.buckets.length) {
      this.buckets[bucketIndex].remove(node);
    }
    this.nodeMap.delete(modUserId);
    this.currentSize--;
    return true;
  }

  hasAtLeastTwoPlayers() {
    return this.nodeMap.size >= 2;
  }
}

export default BucketQueue;
