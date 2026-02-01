import fetch from 'node-fetch';
import { messageForGroqError } from '../errors';
import { logApiCall } from '../utils/apiLogger';

export interface Intent {
  name: string;
  confidence: number;
  entities: Record<string, any>;
}

export interface IntentDefinition {
  name: string;
  description: string;
  examples: string[];
  entitySchema?: Record<string, string>; // entity name -> type
}

const DEFAULT_PREDICT_API_URL = 'https://species-strength-twist-debug.trycloudflare.com/predict';
const DEFAULT_INSTRUCTION = 'Extract intent and driver_id';

export class IntentClassifier {
  private predictApiUrl: string;
  private instruction: string;
  private intents: IntentDefinition[];

  constructor(predictApiUrl: string, intents: IntentDefinition[]) {
    this.predictApiUrl = predictApiUrl || DEFAULT_PREDICT_API_URL;
    this.instruction = DEFAULT_INSTRUCTION;
    this.intents = intents;
  }

  async classifyIntent(userQuery: string): Promise<Intent> {
    try {
      console.log('Classifying intent for query:', userQuery);

      const requestBody = { instruction: this.instruction, input: userQuery };
      const res = await fetch(this.predictApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = (await res.json()) as { response?: string };
      logApiCall('Predict (intent)', 'POST', this.predictApiUrl, res.status, data, requestBody);

      if (!res.ok) {
        throw new Error(`Predict API error: ${res.status} ${res.statusText}`);
      }
      const responseStr = data.response;
      if (responseStr == null || responseStr === '') {
        throw new Error('No response from intent classifier');
      }

      const result = JSON.parse(responseStr) as {
        intent?: string;
        confidence?: number;
        driver_id?: string;
        entities?: Record<string, any>;
      };

      const entities: Record<string, any> = { ...(result.entities || {}) };
      if (result.driver_id != null) {
        entities.driver_id = result.driver_id;
      }

      const intent: Intent = {
        name: result.intent || 'unknown',
        confidence: typeof result.confidence === 'number' ? result.confidence : 1,
        entities,
      };

      console.log('Intent classification result:', intent);
      return intent;
    } catch (err) {
      const message = err instanceof Error ? err.message : messageForGroqError(err);
      console.error('Intent classification error:', err);
      throw new Error(message);
    }
  }

  updateIntents(intents: IntentDefinition[]) {
    this.intents = intents;
  }
}
