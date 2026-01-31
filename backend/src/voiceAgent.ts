import { GroqSTT } from './services/groqSTT';
import { GroqLLM } from './services/groqLLM';
import { EdgeTTS } from './services/edgeTTS';
import { ElevenLabsTTS } from './services/elevenLabsTTS';

type TTSService = EdgeTTS | ElevenLabsTTS;

class VoiceAgent {
  private stt!: GroqSTT;
  private llm!: GroqLLM;
  private tts!: TTSService;
  private conversationHistory: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [];

  initialize() {
    console.log('Initializing voice agent services...');
    this.stt = new GroqSTT(process.env.GROQ_API_KEY!);
    this.llm = new GroqLLM(process.env.GROQ_API_KEY!);
    if (process.env.ELEVENLABS_API_KEY) {
      this.tts = new ElevenLabsTTS(process.env.ELEVENLABS_API_KEY);
      console.log('TTS: ElevenLabs');
    } else {
      this.tts = new EdgeTTS();
      console.log('TTS: Edge (set ELEVENLABS_API_KEY to use ElevenLabs)');
    }
    console.log('Voice agent services initialized');
  }

  resetConversation() {
    console.log('Resetting conversation history');
    this.conversationHistory = [];
  }

  async processAudio(
    audioData: string,
    voice?: string
  ): Promise<string | null> {
    try {
      console.log('Processing audio data...');

      // Decode base64 audio data to Buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      console.log('Audio buffer size:', audioBuffer.length, 'bytes');

      if (audioBuffer.length === 0) {
        console.error('Audio buffer is empty');
        return null; // Don't respond to empty audio
      }

      // Determine language from voice selection - AUTO DETECT from voice name
      let language = undefined;
      let languageCode = undefined;

      if (voice) {
        // English and Hindi only
        if (voice.startsWith('hi-')) {
          language = 'hi';
          languageCode = 'hi';
        } else if (voice.startsWith('en-IN')) {
          language = 'en';
          languageCode = 'en-IN';
        } else if (voice.startsWith('en-US')) {
          language = 'en';
          languageCode = 'en-US';
        } else {
          language = 'en';
          languageCode = 'en';
        }
      }

      // Transcribe audio using Groq STT
      console.log(
        'Starting transcription with language:',
        language || 'auto-detect',
        'Voice:',
        voice
      );
      const transcript = await this.stt.transcribe(audioBuffer, language);
      console.log('Transcript:', transcript);

      // Filter out empty transcripts
      if (!transcript || transcript.trim().length < 2) {
        console.log('Transcript too short or empty, ignoring');
        return null;
      }

      // Filter out single punctuation or repetitive short sounds
      const cleanTranscript = transcript.trim();

      // Check for meaningless patterns
      if (/^[.,!?…\s]+$/.test(cleanTranscript)) {
        console.log('Only punctuation, ignoring');
        return null;
      }

      // Check for repetitive patterns like "कर दो कर दो" or "a a a a"
      const words = cleanTranscript.split(/\s+/);
      if (words.length >= 2) {
        const uniqueWords = new Set(words);
        // If more than 70% of words are the same, it's probably noise
        if (uniqueWords.size / words.length < 0.3) {
          console.log('Repetitive pattern detected, ignoring');
          return null;
        }
      }

      // Allow single words (e.g. "Hi", "Yes") - no minimum word count

      // Generate AI response with language context
      const response = await this.llm.generateResponse(
        cleanTranscript,
        languageCode
      );
      console.log('AI Response:', response);

      return response;
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  }

  async generateSpeech(
    text: string,
    voice: string = 'en-IN-NeerjaNeural'
  ): Promise<Buffer> {
    console.log(
      'Generating speech with voice:',
      voice,
      'for text:',
      text.substring(0, 50)
    );

    // Just use the selected voice directly - let Edge TTS handle it
    // Edge TTS can handle Devanagari (Hindi) script with Hindi voices
    try {
      return await this.tts.generateSpeech(text, voice);
    } catch (error) {
      console.error('TTS generation failed:', error);
      throw error;
    }
  }
}

export const voiceAgent = new VoiceAgent();
