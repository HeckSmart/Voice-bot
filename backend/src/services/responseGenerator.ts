import { Groq } from 'groq-sdk';
import { messageForGroqError } from '../errors';
import { IntentResponse } from './intentHandler';

export class ResponseGenerator {
  private groq: Groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  /**
   * Convert structured API response data into natural Hinglish text
   */
  async generateNaturalResponse(
    userQuery: string,
    intentName: string,
    intentResponse: IntentResponse
  ): Promise<string> {
    try {
      if (!intentResponse.success) {
        return this.generateErrorResponse(intentResponse.error);
      }

      const systemPrompt = `You are a helpful voice assistant that converts structured data into natural, conversational Hinglish responses.

IMPORTANT RULES:
- Always respond in Hinglish (mix of Hindi and English words)
- Keep responses VERY SHORT: 1-2 sentences maximum
- Make it sound natural when spoken aloud
- Be friendly and conversational
- Use the provided data to give accurate information
- If data is empty or null, politely say information is not available

Examples:
- Data: {temperature: 25, city: "Delhi"} → "Delhi mein abhi 25 degrees hai"
- Data: {balance: 5000} → "Aapke account mein 5000 rupees hain"
- Data: {status: "delivered"} → "Aapka order deliver ho gaya hai"`;

      const userPrompt = `User asked: "${userQuery}"
Intent: ${intentName}
Data received: ${JSON.stringify(intentResponse.data, null, 2)}

Convert this data into a natural Hinglish spoken response (1-2 sentences max):`;

      console.log('Generating natural response for intent:', intentName);

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 150,
      });

      const response =
        completion.choices[0]?.message?.content ||
        'Sorry, samajh nahi aaya. Phir se bolo?';

      console.log('Generated natural response:', response);
      return response;
    } catch (err) {
      const message = messageForGroqError(err);
      console.error('Response generation error:', err);
      throw new Error(message);
    }
  }

  private generateErrorResponse(error?: string): string {
    const errorResponses = [
      'Sorry, abhi yeh information nahi mil rahi hai',
      'Thoda issue hai, phir se try karo',
      'Mujhe yeh nahi pata, kuch aur poocho',
    ];

    // Return a random error response
    return errorResponses[Math.floor(Math.random() * errorResponses.length)];
  }
}
