import { Groq } from 'groq-sdk';
import { messageForGroqError } from '../errors';

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1 (-1 = very negative, 0 = neutral, 1 = very positive)
  confidence: number; // 0 to 1
  emotion?: string; // "frustrated", "angry", "satisfied", "confused", etc.
}

export class SentimentAnalyzer {
  private groq: Groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  async analyzeSentiment(userMessage: string): Promise<SentimentResult> {
    try {
      const systemPrompt = `You are a sentiment analysis system for a customer support voicebot.

Analyze the user's message and detect:
1. Overall sentiment (positive, neutral, negative)
2. Sentiment score from -1 to 1 (-1 = very negative, 0 = neutral, 1 = very positive)
3. Confidence in your analysis (0 to 1)
4. Primary emotion (frustrated, angry, satisfied, confused, worried, happy, etc.)

IMPORTANT:
- Understand both Hindi and English (Hinglish)
- Detect frustration indicators: "kyu", "problem", "galat", "nahi ho raha", "bahut baar", etc.
- Detect negative sentiment: complaints, anger, dissatisfaction
- Respond in JSON format

Response format:
{
  "sentiment": "positive|neutral|negative",
  "score": -0.8,
  "confidence": 0.95,
  "emotion": "frustrated"
}`;

      const userPrompt = `Analyze sentiment of this customer message:

"${userMessage}"

Respond with JSON containing sentiment, score, confidence, and emotion.`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from sentiment analyzer');
      }

      const result = JSON.parse(response);
      console.log('[SENTIMENT] Analysis result:', result);

      return {
        sentiment: result.sentiment || 'neutral',
        score: result.score || 0,
        confidence: result.confidence || 0.5,
        emotion: result.emotion || 'neutral',
      };
    } catch (err) {
      const message = messageForGroqError(err);
      console.error('[SENTIMENT] Analysis error:', err);
      
      // Fallback: Return neutral sentiment on error
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0.5,
        emotion: 'unknown',
      };
    }
  }

  /**
   * Quick check if sentiment requires escalation
   */
  requiresEscalation(sentimentResult: SentimentResult): boolean {
    // Escalate if:
    // 1. Negative sentiment with high confidence
    // 2. Very negative score (< -0.5)
    // 3. Frustrated or angry emotion
    
    if (sentimentResult.sentiment === 'negative' && sentimentResult.confidence > 0.7) {
      return true;
    }

    if (sentimentResult.score < -0.5) {
      return true;
    }

    const escalationEmotions = ['frustrated', 'angry', 'very_angry', 'upset', 'annoyed'];
    if (sentimentResult.emotion && escalationEmotions.includes(sentimentResult.emotion.toLowerCase())) {
      return true;
    }

    return false;
  }
}
