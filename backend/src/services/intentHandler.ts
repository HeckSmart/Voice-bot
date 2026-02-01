import { Intent } from './intentClassifier';

export interface IntentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export type IntentAPIHandler = (
  entities: Record<string, any>
) => Promise<IntentResponse>;

export class IntentHandler {
  private handlers: Map<string, IntentAPIHandler>;

  constructor() {
    this.handlers = new Map();
  }

  /**
   * Register a handler for a specific intent
   */
  registerHandler(intentName: string, handler: IntentAPIHandler) {
    this.handlers.set(intentName, handler);
    console.log(`Registered handler for intent: ${intentName}`);
  }

  /**
   * Execute the appropriate handler for an intent
   */
  async handleIntent(intent: Intent): Promise<IntentResponse> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 HANDLING INTENT: ${intent.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`   Confidence: ${intent.confidence}`);
    console.log(`   Entities:`, JSON.stringify(intent.entities, null, 2));

    // Check confidence threshold
    if (intent.confidence < 0.5) {
      console.log('❌ Intent confidence too low, treating as unknown');
      return {
        success: false,
        error: 'Could not understand the query with sufficient confidence',
      };
    }

    const handler = this.handlers.get(intent.name);

    if (!handler) {
      console.log(`❌ No handler registered for intent: ${intent.name}`);
      console.log(`   Available handlers:`, Array.from(this.handlers.keys()));
      return {
        success: false,
        error: `No handler available for intent: ${intent.name}`,
      };
    }

    console.log(`✅ Handler found, executing...`);
    try {
      const response = await handler(intent.entities);
      console.log(`📦 Handler response:`, JSON.stringify(response, null, 2));
      console.log(`${'='.repeat(60)}\n`);
      return response;
    } catch (error) {
      console.error(`❌ Error handling intent ${intent.name}:`, error);
      console.log(`${'='.repeat(60)}\n`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if a handler exists for an intent
   */
  hasHandler(intentName: string): boolean {
    return this.handlers.has(intentName);
  }

  /**
   * Get all registered intent names
   */
  getRegisteredIntents(): string[] {
    return Array.from(this.handlers.keys());
  }
}
