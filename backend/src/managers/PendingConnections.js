/**
 * @typedef PendingConnection
 * @property {NodeJS.Timeout|null} timeout - The timeout for the pending connections 
 */

class PendingConnections {
    constructor() {
        /**
         * @type {Map<number, PendingConnection>}
         */
        this.pendingConnections = new Map();
    }
    /**
     * 
     * @param {number} userId 
     * @returns {boolean}
     */
    contains(userId) {
        return this.pendingConnections.has(userId);
    }
    /**
     * 
     * @param {number} userId 
     * @returns {PendingConnection|null}
     */
    get(userId) {
        return this.pendingConnections.get(userId);
    }

    /**
     * 
     * @param {number} userId 
     * @param {PendingConnection} pendingConnection 
     */
    set(userId, pendingConnection) {
        this.pendingConnections.set(userId, pendingConnection);
    }

    /**
     * 
     * @param {number} userId 
     */
    remove(userId) {
        this.pendingConnections.delete(userId);
    }
    /**
     * @returns {void}
     * @param {number} userId 
     */ 
    stopTimeout(userId) {
        const pendingConnection = this.pendingConnections.get(userId);
        if (pendingConnection && pendingConnection.timeout) {
            clearTimeout(pendingConnection.timeout);
            pendingConnection.timeout = null;
            this.pendingConnections.set(userId, pendingConnection);
        }
    }
}

export default new PendingConnections();