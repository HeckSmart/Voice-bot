/**
 * ElevenLabs TTS - uses API key from ELEVENLABS_API_KEY.
 * Model eleven_multilingual_v2 supports English and Hindi.
 * Uses Node https module (fetch not available in older Node).
 */

import https from 'https';

const ELEVENLABS_HOST = 'api.elevenlabs.io';
const DEFAULT_MODEL = 'eleven_multilingual_v2';

// Map Edge TTS voice names (from frontend) to ElevenLabs voice IDs (English + Hindi capable)
const VOICE_MAP: Record<string, string> = {
  'en-IN-NeerjaNeural': 'EXAVITQu4vr4xnSDxMaL', // Sarah - English + Hindi
  'en-IN-PrabhatNeural': 'JBFqnCBsd6RMkjVDRZzb', // George - English + Hindi
  'en-US-AriaNeural': 'EXAVITQu4vr4xnSDxMaL',
  'en-US-GuyNeural': 'cjVigY5qzO86Huf0OWal', // Eric
  'hi-IN-SwaraNeural': 'EXAVITQu4vr4xnSDxMaL',
  'hi-IN-MadhurNeural': 'JBFqnCBsd6RMkjVDRZzb',
};

export class ElevenLabsTTS {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getVoiceId(voice: string): string {
    return VOICE_MAP[voice] || VOICE_MAP['en-IN-NeerjaNeural'];
  }

  async generateSpeech(
    text: string,
    voice: string = 'en-IN-NeerjaNeural'
  ): Promise<Buffer> {
    const voiceId = this.getVoiceId(voice);
    console.log('ElevenLabs TTS generating speech, voice_id:', voiceId);

    return new Promise((resolve) => {
      const body = JSON.stringify({
        text,
        model_id: DEFAULT_MODEL,
      });

      const req = https.request(
        {
          hostname: ELEVENLABS_HOST,
          path: `/v1/text-to-speech/${voiceId}`,
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              console.log('ElevenLabs audio size:', buffer.length, 'bytes');
              resolve(buffer);
            } else {
              console.error(
                'ElevenLabs API',
                res.statusCode,
                buffer.toString('utf8')
              );
              resolve(Buffer.alloc(0));
            }
          });
        }
      );

      req.on('error', (error) => {
        console.error('ElevenLabs TTS error:', error);
        resolve(Buffer.alloc(0));
      });

      req.write(body);
      req.end();
    });
  }
}
