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
    const bucketIndex = rating - this.start;
    const node = this.buckets[bucketIndex].enqueue(userId, rating, socketId);
    this.nodeMap.set(userId, node);
    this.currentSize++;
  }
  
  size() {
    return this.currentSize;
  }

  dequeueNextPlayer() {
    let checked = 0;
    while (checked <= this.end - this.start) {
      const bucketIndex = this.currentBucket - this.start;
      const node = this.buckets[bucketIndex].dequeue();
      this.currentBucket =
        this.currentBucket < this.end ? this.currentBucket + 1 : this.start;

      if (node) {
        this.nodeMap.delete(node.id);
        this.currentSize--;
        return node;
      }
      checked++;
    }
    return null;
  }

  remove(userId) {
    if (!this.nodeMap.has(userId)) return;
    const node = this.nodeMap.get(userId);
    const bucketIndex = node.rating - this.start;
    this.buckets[bucketIndex].remove(node);
    this.nodeMap.delete(userId);
    this.currentSize--;
  }

  findOpponentNode(rating) {
    for (let i = 0; i <= 100; i++) {
      const lower =
        rating - i >= this.start
          ? this.buckets[rating - i - this.start].front
          : null;
      if (lower) {
        const node = this.buckets[rating - i - this.start].dequeue();
        this.nodeMap.delete(node.id);
        this.currentSize--;
        return node;
      }

      const higher =
        rating + i <= this.end
          ? this.buckets[rating + i - this.start].front
          : null;
      if (higher) {
        const node = this.buckets[rating + i - this.start].dequeue();
        this.nodeMap.delete(node.id);
        return node;
      }
    }
    return null;
  }
  hasAtleastTwoPlayers() {
    return this.nodeMap.size >= 2;
  }
}
export default BucketQueue;

