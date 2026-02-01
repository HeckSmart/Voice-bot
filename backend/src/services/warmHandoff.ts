import { Intent } from './intentClassifier';
import { SentimentResult } from './sentimentAnalyzer';

export interface ConversationContext {
  driver_id?: string;
  conversation_history: Array<{
    role: 'user' | 'bot';
    message: string;
    timestamp: string;
    intent?: string;
    sentiment?: string;
  }>;
  detected_intents: string[];
  failed_attempts: number;
  sentiment_history: SentimentResult[];
  api_calls_made: Array<{
    intent: string;
    success: boolean;
    timestamp: string;
  }>;
}

export interface HandoffSummary {
  handoff_required: boolean;
  handoff_reason: 'low_confidence' | 'negative_sentiment' | 'user_requested' | 'failed_attempts' | 'complaint';
  driver_details: {
    driver_id?: string;
    phone?: string;
    name?: string;
  };
  conversation_summary: string;
  key_intents: string[];
  sentiment_trend: string; // "declining", "negative", "neutral"
  last_query: string;
  resolution_attempted: string[];
  escalation_priority: 'low' | 'medium' | 'high' | 'urgent';
  agent_context: string; // What the human agent should know
  timestamp: string;
}

export class WarmHandoffManager {
  private conversationContext: ConversationContext;
  private confidenceThreshold: number = 0.5;
  private sentimentThreshold: number = -0.5;
  private maxFailedAttempts: number = 3;

  constructor() {
    this.conversationContext = {
      conversation_history: [],
      detected_intents: [],
      failed_attempts: 0,
      sentiment_history: [],
      api_calls_made: [],
    };
  }

  /**
   * Track user message and bot response
   */
  trackConversation(
    userMessage: string,
    botResponse: string,
    intent?: Intent,
    sentiment?: SentimentResult
  ) {
    const timestamp = new Date().toISOString();

    // Track user message
    this.conversationContext.conversation_history.push({
      role: 'user',
      message: userMessage,
      timestamp,
      intent: intent?.name,
      sentiment: sentiment?.sentiment,
    });

    // Track bot response
    this.conversationContext.conversation_history.push({
      role: 'bot',
      message: botResponse,
      timestamp,
    });

    // Track intent
    if (intent && intent.name !== 'unknown') {
      if (!this.conversationContext.detected_intents.includes(intent.name)) {
        this.conversationContext.detected_intents.push(intent.name);
      }
    }

    // Track sentiment
    if (sentiment) {
      this.conversationContext.sentiment_history.push(sentiment);
    }

    // Keep only last 20 messages to avoid memory issues
    if (this.conversationContext.conversation_history.length > 20) {
      this.conversationContext.conversation_history = 
        this.conversationContext.conversation_history.slice(-20);
    }
  }

  /**
   * Track API call success/failure
   */
  trackAPICall(intent: string, success: boolean) {
    this.conversationContext.api_calls_made.push({
      intent,
      success,
      timestamp: new Date().toISOString(),
    });

    if (!success) {
      this.conversationContext.failed_attempts++;
    }
  }

  /**
   * Check if warm handoff is required
   */
  shouldHandoff(
    currentIntent?: Intent,
    currentSentiment?: SentimentResult
  ): boolean {
    // 1. Check if intent confidence is too low
    if (currentIntent && currentIntent.confidence < this.confidenceThreshold) {
      console.log('[HANDOFF] Low confidence detected:', currentIntent.confidence);
      return true;
    }

    // 2. Check if sentiment is negative
    if (currentSentiment && currentSentiment.score < this.sentimentThreshold) {
      console.log('[HANDOFF] Negative sentiment detected:', currentSentiment.score);
      return true;
    }

    // 3. Check if sentiment is declining over last 3 messages
    if (this.isSentimentDeclining()) {
      console.log('[HANDOFF] Sentiment declining over conversation');
      return true;
    }

    // 4. Check if too many failed attempts
    if (this.conversationContext.failed_attempts >= this.maxFailedAttempts) {
      console.log('[HANDOFF] Too many failed attempts:', this.conversationContext.failed_attempts);
      return true;
    }

    // 5. Check if user is in a frustration loop (same intent multiple times)
    if (this.isInFrustrationLoop()) {
      console.log('[HANDOFF] Frustration loop detected');
      return true;
    }

    return false;
  }

  /**
   * Generate warm handoff summary for human agent
   */
  generateHandoffSummary(
    handoffReason: HandoffSummary['handoff_reason'],
    driverDetails?: { driver_id?: string; phone?: string; name?: string }
  ): HandoffSummary {
    const lastUserMessage = this.conversationContext.conversation_history
      .filter(h => h.role === 'user')
      .slice(-1)[0]?.message || 'N/A';

    const conversationSummary = this.generateConversationSummary();
    const sentimentTrend = this.analyzeSentimentTrend();
    const priority = this.calculateEscalationPriority(handoffReason, sentimentTrend);

    const summary: HandoffSummary = {
      handoff_required: true,
      handoff_reason: handoffReason,
      driver_details: driverDetails || {},
      conversation_summary: conversationSummary,
      key_intents: this.conversationContext.detected_intents,
      sentiment_trend: sentimentTrend,
      last_query: lastUserMessage,
      resolution_attempted: this.getResolutionAttempts(),
      escalation_priority: priority,
      agent_context: this.generateAgentContext(handoffReason),
      timestamp: new Date().toISOString(),
    };

    console.log('[HANDOFF] Summary generated:', summary);
    return summary;
  }

  /**
   * Reset conversation context (for new call)
   */
  reset() {
    this.conversationContext = {
      conversation_history: [],
      detected_intents: [],
      failed_attempts: 0,
      sentiment_history: [],
      api_calls_made: [],
    };
    console.log('[HANDOFF] Conversation context reset');
  }

  /**
   * Set driver ID for tracking
   */
  setDriverId(driverId: string) {
    this.conversationContext.driver_id = driverId;
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private isSentimentDeclining(): boolean {
    const recentSentiments = this.conversationContext.sentiment_history.slice(-3);
    if (recentSentiments.length < 3) return false;

    // Check if sentiment scores are declining
    for (let i = 0; i < recentSentiments.length - 1; i++) {
      if (recentSentiments[i].score < recentSentiments[i + 1].score) {
        return false; // Not consistently declining
      }
    }

    return true;
  }

  private isInFrustrationLoop(): boolean {
    const recentIntents = this.conversationContext.conversation_history
      .filter(h => h.role === 'user' && h.intent)
      .slice(-4)
      .map(h => h.intent);

    if (recentIntents.length < 3) return false;

    // Check if same intent repeated 3+ times
    const intentCounts: Record<string, number> = {};
    recentIntents.forEach(intent => {
      if (intent) {
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      }
    });

    return Object.values(intentCounts).some(count => count >= 3);
  }

  private generateConversationSummary(): string {
    const messages = this.conversationContext.conversation_history
      .filter(h => h.role === 'user')
      .map(h => h.message)
      .join(' | ');

    return messages.length > 300 ? messages.substring(0, 300) + '...' : messages;
  }

  private analyzeSentimentTrend(): string {
    const recentSentiments = this.conversationContext.sentiment_history.slice(-3);
    
    if (recentSentiments.length === 0) return 'neutral';

    const avgScore = recentSentiments.reduce((sum, s) => sum + s.score, 0) / recentSentiments.length;

    if (this.isSentimentDeclining()) return 'declining';
    if (avgScore < -0.3) return 'negative';
    if (avgScore > 0.3) return 'positive';
    return 'neutral';
  }

  private calculateEscalationPriority(
    reason: HandoffSummary['handoff_reason'],
    sentimentTrend: string
  ): 'low' | 'medium' | 'high' | 'urgent' {
    // Urgent: Complaint + negative sentiment
    if (reason === 'complaint' && sentimentTrend === 'negative') {
      return 'urgent';
    }

    // High: Complaint or very negative sentiment
    if (reason === 'complaint' || sentimentTrend === 'declining') {
      return 'high';
    }

    // Medium: Multiple failed attempts or negative sentiment
    if (reason === 'failed_attempts' || sentimentTrend === 'negative') {
      return 'medium';
    }

    // Low: User requested or low confidence
    return 'low';
  }

  private getResolutionAttempts(): string[] {
    return this.conversationContext.api_calls_made.map(
      call => `${call.intent} (${call.success ? 'success' : 'failed'})`
    );
  }

  private generateAgentContext(reason: HandoffSummary['handoff_reason']): string {
    const contexts: Record<string, string> = {
      low_confidence: 'Bot could not understand user query clearly. May need clarification.',
      negative_sentiment: 'User is frustrated or unhappy. Handle with empathy.',
      user_requested: 'User explicitly asked to speak with human agent.',
      failed_attempts: 'Multiple attempts to resolve issue failed. User may be frustrated.',
      complaint: 'User has logged a complaint. Requires immediate attention.',
    };

    const baseContext = contexts[reason] || 'User transferred to agent.';
    const intents = this.conversationContext.detected_intents.join(', ') || 'None';

    return `${baseContext} Topics discussed: ${intents}.`;
  }

  /**
   * Get conversation history for display
   */
  getConversationHistory() {
    return this.conversationContext.conversation_history;
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    return {
      total_messages: this.conversationContext.conversation_history.length,
      detected_intents: this.conversationContext.detected_intents.length,
      failed_attempts: this.conversationContext.failed_attempts,
      avg_sentiment: this.conversationContext.sentiment_history.length > 0
        ? this.conversationContext.sentiment_history.reduce((sum, s) => sum + s.score, 0) / 
          this.conversationContext.sentiment_history.length
        : 0,
    };
  }
}
