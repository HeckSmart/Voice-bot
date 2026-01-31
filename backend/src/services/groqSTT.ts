import { Groq, toFile } from 'groq-sdk';
import { messageForGroqError } from '../errors';

export class GroqSTT {
  private groq: Groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  async transcribe(audioBuffer: Buffer, language?: string): Promise<string> {
    try {
      const audioFile = await toFile(audioBuffer, 'audio.webm', {
        type: 'audio/webm',
      });

      const options: any = {
        file: audioFile,
        model: 'whisper-large-v3',
        response_format: 'json',
        temperature: 0,
      };

      if (language) {
        options.language = language;
        if (language === 'hi') {
          options.prompt = 'यह एक हिंदी बातचीत है। कृपया शुद्ध हिंदी में लिखें।';
        }
      }

      const transcription = await this.groq.audio.transcriptions.create(options);
      return transcription.text;
    } catch (err) {
      const message = messageForGroqError(err);
      console.error('Groq STT error:', err);
      throw new Error(message);
    }
  }
}
