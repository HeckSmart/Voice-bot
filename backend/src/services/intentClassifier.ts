import { Groq } from 'groq-sdk';
import { messageForGroqError } from '../errors';

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

export class IntentClassifier {
  private groq: Groq;
  private intents: IntentDefinition[];

  constructor(apiKey: string, intents: IntentDefinition[]) {
    this.groq = new Groq({ apiKey });
    this.intents = intents;
  }

  async classifyIntent(userQuery: string): Promise<Intent> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(userQuery);

      console.log('Classifying intent for query:', userQuery);

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1, // Low temperature for consistent classification
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from intent classifier');
      }

      const result = JSON.parse(response);
      console.log('Intent classification result:', result);

      return {
        name: result.intent || 'unknown',
        confidence: result.confidence || 0,
        entities: result.entities || {},
      };
    } catch (err) {
      const message = messageForGroqError(err);
      console.error('Intent classification error:', err);
      throw new Error(message);
    }
  }

  private buildSystemPrompt(): string {
    const intentDescriptions = this.intents
      .map((intent) => {
        let description = `- **${intent.name}**: ${intent.description}\n`;
        description += `  Examples: ${intent.examples.join(', ')}\n`;
        if (intent.entitySchema) {
          description += `  Entities: ${JSON.stringify(intent.entitySchema)}\n`;
        }
        return description;
      })
      .join('\n');

    return `You are an intent classification system for a Battery Smart voice assistant that works in Hinglish (mix of Hindi and English).

Your task is to classify user queries into one of the following intents:

${intentDescriptions}

IMPORTANT:
- Understand both Hindi and English words in the query
- Extract relevant entities based on the intent's entity schema
- For driver_id entity: Look for patterns like "D0015", "0015", "D 0015", "driver ID 0015", "mera ID D0015 hai"
- Driver IDs can be spoken as just numbers (0015) or with D prefix (D0015)
- If user provides driver ID in query, extract it and include in entities
- If no intent matches confidently, use "unknown" with low confidence
- Always respond in valid JSON format

Response format:
{
  "intent": "intent_name",
  "confidence": 0.95,
  "entities": {
    "driver_id": "0015"
  }
}

Example extractions:
- "mera swap count batao, mera ID D0015 hai" → extract driver_id: "D0015"
- "0015 ka subscription check karo" → extract driver_id: "0015"
- "D zero zero one five" → extract driver_id: "D0015"`;
  }

  private buildUserPrompt(userQuery: string): string {
    return `Classify the following user query and extract entities:

User Query: "${userQuery}"

Respond with JSON containing: intent, confidence (0-1), and entities.`;
  }

  updateIntents(intents: IntentDefinition[]) {
    this.intents = intents;
  }
}
