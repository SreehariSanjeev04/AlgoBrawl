class Node {
    constructor(id, rating, socketId) {
        this.id = id;
        this.rating = rating;
        this.socketId = socketId;
        this.next = null;
        this.prev = null;
    }
}

class Queue {
    constructor() {
        this.front = null;
        this.rear = null;
    }

    enqueue(userId, rating, socketId) {
        const newNode = new Node(userId, rating, socketId);
        if (!this.front) {
            this.front = newNode;
            this.rear = newNode;
        } else {
            this.rear.next = newNode;
            newNode.prev = this.rear;
            this.rear = newNode;
        }
        return newNode;
    }

    dequeue() {
        if (!this.front) return null;
        const dequeuedNode = this.front;
        this.front = this.front.next;
        if (this.front) {
            this.front.prev = null;
        } else {
            this.rear = null;
        }
        return dequeuedNode;
    }

    remove(node) {
        if (!node) return;

        if (node.prev) node.prev.next = node.next;
        else this.front = node.next;

        if (node.next) node.next.prev = node.prev;
        else this.rear = node.prev;
    }

    size() {
        let count = 0;
        let current = this.front;
        while (current) {
            count++;
            current = current.next;
        }
        return count;
    }
}
export default Queue;