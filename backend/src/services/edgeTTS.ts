import { UniversalEdgeTTS } from 'edge-tts-universal';

export class EdgeTTS {
  async generateSpeech(
    text: string,
    voice: string = 'en-IN-NeerjaNeural'
  ): Promise<Buffer> {
    try {
      console.log('EdgeTTS generating speech with voice:', voice);
      // Use Microsoft Edge TTS - no API key required
      const tts = new UniversalEdgeTTS(text, voice);
      const result = await tts.synthesize();

      // Convert the audio result to Buffer
      const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
      console.log('Generated audio buffer size:', audioBuffer.length, 'bytes');
      return audioBuffer;
    } catch (error) {
      console.error('Edge TTS error:', error);
      // Return empty buffer as fallback
      return Buffer.alloc(0);
    }
  }
}
