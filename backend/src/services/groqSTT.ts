import { Groq, toFile } from 'groq-sdk';

export class GroqSTT {
  private groq: Groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  async transcribe(audioBuffer: Buffer, language?: string): Promise<string> {
    // Use SDK's toFile so Node gets formdata-node File (browser File is not in Node)
    const audioFile = await toFile(audioBuffer, 'audio.webm', {
      type: 'audio/webm',
    });

    const options: any = {
      file: audioFile,
      model: 'whisper-large-v3',
      response_format: 'json',
      temperature: 0, // More deterministic transcription
    };

    // English and Hindi only - language hint and prompt for better accuracy
    if (language) {
      options.language = language;
      if (language === 'hi') {
        options.prompt = 'यह एक हिंदी बातचीत है। कृपया शुद्ध हिंदी में लिखें।';
      }
    }

    const transcription = await this.groq.audio.transcriptions.create(options);

    return transcription.text;
  }
}
