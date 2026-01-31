import { Groq } from 'groq-sdk';

export class GroqLLM {
  private groq: Groq;
  private conversationHistory: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [];

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  async generateResponse(
    transcript: string,
    language?: string
  ): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({ role: 'user', content: transcript });

    // Respond in Hinglish (Hindi + English mix) for natural Indian voice assistant
    const hasDevanagari = /[\u0900-\u097F]/.test(transcript);

    console.log(
      'LLM Language code:',
      language,
      'Transcript:',
      transcript.substring(0, 50)
    );

    // Single Hinglish prompt: mix of Hindi and English, short for voice
    const systemPrompt =
      'You are a friendly AI voice assistant. Always respond in Hinglish (mix of Hindi and English words, e.g. "Haan bilkul, main aapki madad karti hoon" or "Achha, yeh kaam ho sakta hai"). Keep every response VERY short: 1-2 sentences only, so it sounds natural when spoken aloud. Be conversational and helpful.';

    console.log('Using system prompt for language:', language);

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...this.conversationHistory.slice(-6), // Keep last 6 messages for context
    ];

    const completion = await this.groq.chat.completions.create({
      messages: messages as any,
      model: 'llama-3.3-70b-versatile',
      max_tokens: 150,
      temperature: 0.8,
    });

    const response =
      completion.choices[0]?.message?.content ||
      'Sorry, samajh nahi aaya. Phir se bolo?';

    // Add assistant response to history
    this.conversationHistory.push({ role: 'assistant', content: response });

    return response;
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}
