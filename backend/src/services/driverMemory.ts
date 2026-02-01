/**
 * Driver Memory Service
 * Stores driver information in conversation memory
 */

interface DriverSession {
  driverId?: string;
  lastQuery?: string;
  conversationStarted?: Date;
  queriesAsked?: number;
}

class DriverMemory {
  private sessions: Map<string, DriverSession> = new Map();
  
  /**
   * Normalize driver ID - add "D" prefix if missing
   */
  normalizeDriverId(driverId: string): string {
    const cleaned = driverId.trim().toUpperCase();
    
    // If it starts with D, return as is
    if (cleaned.startsWith('D')) {
      return cleaned;
    }
    
    // If it's just numbers, add D prefix
    if (/^\d+$/.test(cleaned)) {
      return `D${cleaned}`;
    }
    
    // Return as is if format is unclear
    return cleaned;
  }
  
  /**
   * Set driver ID for a session
   */
  setDriverId(sessionId: string, driverId: string) {
    const normalized = this.normalizeDriverId(driverId);
    const session = this.sessions.get(sessionId) || {};
    
    session.driverId = normalized;
    session.conversationStarted = session.conversationStarted || new Date();
    
    this.sessions.set(sessionId, session);
    console.log(`[MEMORY] Driver ID set: ${normalized} for session ${sessionId}`);
    
    return normalized;
  }
  
  /**
   * Get driver ID from session
   */
  getDriverId(sessionId: string): string | undefined {
    const session = this.sessions.get(sessionId);
    return session?.driverId;
  }
  
  /**
   * Check if driver ID exists in session
   */
  hasDriverId(sessionId: string): boolean {
    return !!this.getDriverId(sessionId);
  }
  
  /**
   * Update last query
   */
  updateLastQuery(sessionId: string, query: string) {
    const session = this.sessions.get(sessionId) || {};
    session.lastQuery = query;
    session.queriesAsked = (session.queriesAsked || 0) + 1;
    this.sessions.set(sessionId, session);
  }
  
  /**
   * Get session info
   */
  getSession(sessionId: string): DriverSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Clear session
   */
  clearSession(sessionId: string) {
    this.sessions.delete(sessionId);
    console.log(`[MEMORY] Session cleared: ${sessionId}`);
  }
  
  /**
   * Clear all sessions
   */
  clearAll() {
    this.sessions.clear();
    console.log('[MEMORY] All sessions cleared');
  }
}

export const driverMemory = new DriverMemory();
