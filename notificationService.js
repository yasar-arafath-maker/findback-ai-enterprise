/**
 * FindBack AI — Event-Driven Architecture & Notification Layer
 * Pillar 2: Real-time WebSocket / Pub-Sub Notification Service
 * 
 * Features:
 * - Event Dispatcher for MATCH_FOUND, CLAIM_APPROVED, HANDOVER_COMPLETED
 * - Topic-based subscriber registration
 * - Live unread counter updates & dashboard event pushing
 */

class NotificationService {
  constructor() {
    this.subscribers = new Map(); // topic -> Set of callbacks
    this.eventBuffer = [];
  }

  /**
   * Subscribe to real-time events for a user or global topic.
   * @param {string} topic - User ID or topic name (e.g. 'user:user-A', 'admin:events')
   * @param {Function} callback - Function called when an event is published
   * @returns {Function} Unsubscribe function
   */
  subscribe(topic, callback) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(callback);

    return () => {
      const subs = this.subscribers.get(topic);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) this.subscribers.delete(topic);
      }
    };
  }

  /**
   * Publishes a real-time event to all topic subscribers.
   * @param {string} topic 
   * @param {object} event - Event payload { type, payload, timestamp }
   */
  publish(topic, event) {
    const enrichedEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      topic,
      ...event
    };

    this.eventBuffer.push(enrichedEvent);
    if (this.eventBuffer.length > 100) this.eventBuffer.shift();

    const subs = this.subscribers.get(topic);
    if (subs) {
      subs.forEach(callback => {
        try {
          callback(enrichedEvent);
        } catch (err) {
          console.error(`[NotificationService] Callback error on topic ${topic}:`, err);
        }
      });
    }

    return enrichedEvent;
  }

  /**
   * Helper: Dispatch High-Confidence AI Match notification
   */
  notifyMatchFound(recipientId, matchData) {
    return this.publish(`user:${recipientId}`, {
      type: 'MATCH_FOUND',
      title: 'High Confidence Match Found!',
      message: `AI found a ${matchData.score}% match for your reported item: ${matchData.title}`,
      data: matchData
    });
  }

  /**
   * Helper: Dispatch Claim Approval notification
   */
  notifyClaimApproved(recipientId, claimData) {
    return this.publish(`user:${recipientId}`, {
      type: 'CLAIM_APPROVED',
      title: 'Claim Approved by Admin',
      message: `Your claim for ${claimData.title} has been approved. Verification Code generated.`,
      data: claimData
    });
  }

  /**
   * Helper: Dispatch Handover Completed notification
   */
  notifyHandoverCompleted(recipientId, handoverData) {
    return this.publish(`user:${recipientId}`, {
      type: 'HANDOVER_COMPLETED',
      title: 'Item Handover Successful!',
      message: `Verification code matched. Item recovery process complete.`,
      data: handoverData
    });
  }
}

export const notificationService = globalThis.__FINDBACK_NOTIFY_SVC__ || new NotificationService();
if (!globalThis.__FINDBACK_NOTIFY_SVC__) {
  globalThis.__FINDBACK_NOTIFY_SVC__ = notificationService;
}

export default notificationService;
