class AVLNode {
    constructor(data, id) {
        this.id = id;
        this.data = data;
        this.height = 1;
        this.left = null;
        this.right = null;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
    }
    height(node) {
        return node ? node.height : 0;
    }

    getBalance(node) {
        return node ? this.height(node.left) - this.height(node.right) : 0;
    }

    rotateRight(y) {
        let x = y.left;
        let T2 = x.right;

        x.right = y;
        y.left = T2;
        y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
        x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
        return x;
    }
    rotateLeft(x) {
        let y = x.right;
        let T2 = y.left;
        
        y.left = x;
        x.right = T2;
        
        x.height = Math.max(this.height(x.left), this.height(x.right)) + 1;
        y.height = Math.max(this.height(y.left), this.height(y.right)) + 1;
        return y;
    }

    insertNode(node, value, id) {
        if(!node) return new AVLNode(value, id);

        if(value < node.data) {
            node.left = this.insertNode(node.left, value, id);
        } else if(value > node.data) {
            node.right = this.insertNode(node.right, value, id);
        } else {
            return node; // doubt
        }

        node.height = 1 + Math.max(this.height(node.left), this.height(node.right));

        const balance = this.getBalance(node);

        if(balance > 1 && value < node.left.data) {
            return this.rotateRight(node);
        } else if(balance < -1 && value > node.right.data) {
            return this.rotateLeft(node);
        } else if(balance > 1 && value > node.left.data) {
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        } else if(balance < -1 && value < node.right.data) {
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }

        return node;
    }
    insert(value, id) {
        this.root = this.insertNode(this.root, value, id);
    }

    findMin(node) {
        while(node && node.left) {
            node = node.left;
        }
        return node;
    }

    removeNode(node, value, id) {
        if(!node) return;

        if(value < node.data) {
            node.left = this.removeNode(node.left, value, id);
        } else if(value > node.data) {
            node.right = this.removeNode(node.right, value, id);
        } else {
            // found the node
            if(!node.left && !node.right) {
                return null;
            } else if(!node.left) {
                return node.right;
            } else if(!node.right) {
                return node.left;
            } else {
                let minRight = this.findMin(node.right);
                node.data = minRight.data;
                node.id = minRight.id;
                node.right = this.removeNode(node.right, minRight.data, minRight.id);
            }
        }
    }
    
    findInRange(node, min, max, result = []) {
        if(!node) return;
        
        if(node.data >= min && node.data <= max) {
            result.push(node.data);
        }

        if(node.data > min) {
            this.findInRange(node.left, min, max, result);
        } 

        if(node.data >= min && node.data <= max) {
            result.push(node.data);
        }

        if(node.data < max) {
            this.findInRange(node.right, min, max, result);
        }
        
        return result;
    }
}