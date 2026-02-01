import { GroqSTT } from './services/groqSTT';
import { GroqLLM } from './services/groqLLM';
import { EdgeTTS } from './services/edgeTTS';
import { ElevenLabsTTS } from './services/elevenLabsTTS';
import { IntentClassifier } from './services/intentClassifier';
import { IntentHandler } from './services/intentHandler';
import { ResponseGenerator } from './services/responseGenerator';
import { SentimentAnalyzer } from './services/sentimentAnalyzer';
import { WarmHandoffManager, HandoffSummary } from './services/warmHandoff';
import { driverMemory } from './services/driverMemory';
import fetch from 'node-fetch';
// Import Real Battery Smart intents with actual API calls
import { realBatterySmartIntents, registerRealBatterySmartHandlers } from './intents/realBatterySmartIntents';

type TTSService = EdgeTTS | ElevenLabsTTS;

class VoiceAgent {
  private stt!: GroqSTT;
  private llm!: GroqLLM;
  private tts!: TTSService;
  private intentClassifier!: IntentClassifier;
  private intentHandler!: IntentHandler;
  private responseGenerator!: ResponseGenerator;
  private sentimentAnalyzer!: SentimentAnalyzer;
  private handoffManager!: WarmHandoffManager;
  private conversationHistory: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [];
  private useIntentSystem: boolean = true; // Toggle to enable/disable intent system
  private handoffCallback?: (summary: HandoffSummary) => void;

  initialize() {
    console.log('Initializing Real Battery Smart Voice Agent services...');
    this.stt = new GroqSTT(process.env.GROQ_API_KEY!);
    this.llm = new GroqLLM(process.env.GROQ_API_KEY!);
    
    // Initialize intent-based system with REAL Battery Smart intents
    this.intentClassifier = new IntentClassifier(
      process.env.GROQ_API_KEY!,
      realBatterySmartIntents
    );
    this.intentHandler = new IntentHandler();
    this.responseGenerator = new ResponseGenerator(process.env.GROQ_API_KEY!);
    
    // Initialize sentiment analysis and warm handoff
    this.sentimentAnalyzer = new SentimentAnalyzer(process.env.GROQ_API_KEY!);
    this.handoffManager = new WarmHandoffManager();
    
    // Register all REAL Battery Smart intent handlers with actual API calls
    registerRealBatterySmartHandlers(this.intentHandler);
    console.log('Intent system initialized with', realBatterySmartIntents.length, 'Real Battery Smart intents');
    
    if (process.env.ELEVENLABS_API_KEY) {
      this.tts = new ElevenLabsTTS(process.env.ELEVENLABS_API_KEY);
      console.log('TTS: ElevenLabs');
    } else {
      this.tts = new EdgeTTS();
      console.log('TTS: Edge (set ELEVENLABS_API_KEY to use ElevenLabs)');
    }
    console.log('Real Battery Smart Voice Agent services initialized');
  }

  resetConversation() {
    console.log('Resetting conversation history');
    this.conversationHistory = [];
    this.llm.clearHistory();
    this.handoffManager.reset();
  }

  setUseIntentSystem(enabled: boolean) {
    this.useIntentSystem = enabled;
    console.log('Intent system', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Register callback for warm handoff events
   */
  onHandoff(callback: (summary: HandoffSummary) => void) {
    this.handoffCallback = callback;
    console.log('Handoff callback registered');
  }

  /**
   * Get conversation statistics
   */
  getConversationStats() {
    return this.handoffManager.getStats();
  }

  /**
   * Get full conversation history
   */
  getConversationHistory() {
    return this.handoffManager.getConversationHistory();
  }

  /**
   * Set driver ID for tracking
   */
  setDriverId(driverId: string) {
    this.handoffManager.setDriverId(driverId);
  }

  /**
   * Determine handoff reason based on intent and sentiment
   */
  private determineHandoffReason(
    intent: any,
    sentiment: any
  ): 'low_confidence' | 'negative_sentiment' | 'user_requested' | 'failed_attempts' | 'complaint' {
    if (intent.name === 'complaint') return 'complaint';
    if (intent.name === 'speak_to_agent') return 'user_requested';
    if (intent.confidence < 0.5) return 'low_confidence';
    if (sentiment.score < -0.5) return 'negative_sentiment';
    return 'failed_attempts';
  }

  /**
   * Send escalation details to API when bot can't help
   */
  private async sendToEscalationAPI(handoffSummary: HandoffSummary) {
    try {
      const escalationEndpoint = process.env.ESCALATION_API || 'http://localhost:8000/api/escalations';
      
      const payload = {
        driverId: handoffSummary.driver_details.driver_id,
        conversationSummary: handoffSummary.conversation_summary,
        lastQuery: handoffSummary.last_query,
        sentimentTrend: handoffSummary.sentiment_trend,
        handoffReason: handoffSummary.handoff_reason,
        priority: handoffSummary.escalation_priority,
        timestamp: handoffSummary.timestamp,
        detectedIntents: handoffSummary.key_intents,
      };

      console.log('[ESCALATION_API] Sending to:', escalationEndpoint);
      
      const response = await fetch(escalationEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('[ESCALATION_API] Successfully sent escalation');
      } else {
        console.error('[ESCALATION_API] Failed to send:', response.status);
      }
    } catch (error) {
      console.error('[ESCALATION_API] Error sending escalation:', error);
      // Don't throw - escalation API failure shouldn't break the flow
    }
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

      // Process through intent system with sentiment analysis and warm handoff
      let response: string;

      if (this.useIntentSystem) {
        try {
          console.log('\n' + '🔵'.repeat(30));
          console.log('🤖 PROCESSING THROUGH BATTERY SMART INTENT SYSTEM');
          console.log('🔵'.repeat(30));
          console.log('📝 User Query:', cleanTranscript);
          console.log('');
          
          // Step 1: Analyze sentiment
          console.log('📊 Step 1: Analyzing Sentiment...');
          const sentiment = await this.sentimentAnalyzer.analyzeSentiment(cleanTranscript);
          console.log('   └─ Sentiment:', sentiment.sentiment, '| Score:', sentiment.score, '| Emotion:', sentiment.emotion);

          // Step 2: Classify the intent
          console.log('🎯 Step 2: Classifying Intent...');
          const intent = await this.intentClassifier.classifyIntent(cleanTranscript);
          console.log('   └─ Intent:', intent.name, '| Confidence:', intent.confidence);
          console.log('   └─ Entities:', JSON.stringify(intent.entities));

          // Step 3: Check if warm handoff is required BEFORE processing
          console.log('🔍 Step 3: Checking Handoff Requirements...');
          if (this.handoffManager.shouldHandoff(intent, sentiment)) {
            console.log('🚨 WARM HANDOFF TRIGGERED!');
            
            const handoffReason = this.determineHandoffReason(intent, sentiment);
            const handoffSummary = this.handoffManager.generateHandoffSummary(
              handoffReason,
              { driver_id: 'DRV12345' } // TODO: Get from session
            );

            // Trigger handoff callback if registered
            if (this.handoffCallback) {
              this.handoffCallback(handoffSummary);
            }

            // Return handoff message to user
            response = 'Ek minute rukiye, main aapko hamare executive se connect kar rahi hoon jo aapki better help kar payenge.';
            
            // Track in handoff manager
            this.handoffManager.trackConversation(
              cleanTranscript,
              response,
              intent,
              sentiment
            );

            return response;
          }

          // Step 4: Handle the intent (make API call)
          console.log('⚙️  Step 4: Handling Intent (Making API Call)...');
          const intentResponse = await this.intentHandler.handleIntent(intent);
          
          // Track API call
          console.log('📊 Step 5: Tracking API Call Result...');
          console.log('   └─ Success:', intentResponse.success);
          this.handoffManager.trackAPICall(intent.name, intentResponse.success);

          // Step 5: Check if response indicates handoff is needed
          if (intentResponse.success && intentResponse.data?.handoff_required) {
            console.log('[WARM_HANDOFF] Handoff requested by intent handler');
            
            const handoffSummary = this.handoffManager.generateHandoffSummary(
              intentResponse.data.reason || 'user_requested',
              { driver_id: intentResponse.data.driver_id }
            );

            if (this.handoffCallback) {
              this.handoffCallback(handoffSummary);
            }

            response = 'Bilkul, main aapko abhi agent se connect karti hoon. Ek moment please.';
            
            this.handoffManager.trackConversation(
              cleanTranscript,
              response,
              intent,
              sentiment
            );

            return response;
          }

          // Step 6: Check if driver ID is needed
          console.log('🆔 Step 6: Checking Driver ID Requirement...');
          if (!intentResponse.success && intentResponse.error === 'NEED_DRIVER_ID') {
            console.log('❓ Driver ID required, asking user...');
            
            // Check if user might have provided ID in the transcript
            const driverIdMatch = cleanTranscript.match(/\b[dD]?\s*(\d{4,})\b/);
            if (driverIdMatch) {
              const extractedId = driverIdMatch[1];
              const normalizedId = driverMemory.normalizeDriverId(extractedId);
              driverMemory.setDriverId('default', normalizedId);
              console.log('✅ Driver ID extracted from transcript:', normalizedId);
              
              // Retry intent with driver ID
              const retryResponse = await this.intentHandler.handleIntent(intent);
              if (retryResponse.success) {
                response = await this.responseGenerator.generateNaturalResponse(
                  cleanTranscript,
                  intent.name,
                  retryResponse
                );
              } else {
                response = 'Aapka driver ID batayein? Jaise D0015 ya sirf 0015.';
              }
            } else {
              response = 'Aapka driver ID batayein? Jaise D0015 ya sirf 0015.';
            }
          }
          // Step 7: Generate response based on intent result
          else if (
            !intentResponse.success &&
            intentResponse.error === 'USE_REGULAR_LLM'
          ) {
            console.log('[LLM] Falling back to regular LLM for general conversation');
            response = await this.llm.generateResponse(
              cleanTranscript,
              languageCode
            );
          } else if (!intentResponse.success) {
            console.log('❌ Intent handling failed:', intentResponse.error);
            // Increment failed attempts
            this.handoffManager.trackAPICall(intent.name, false);
            
            console.log('🔍 Checking if handoff needed after failure...');
            // Check if we should handoff after failure
            if (this.handoffManager.shouldHandoff(intent, sentiment)) {
              console.log('🚨 Handoff triggered due to failures');
              const driverId = driverMemory.getDriverId('default');
              const handoffSummary = this.handoffManager.generateHandoffSummary(
                'failed_attempts',
                { driver_id: driverId }
              );

              // Send to escalation API
              await this.sendToEscalationAPI(handoffSummary);

              if (this.handoffCallback) {
                this.handoffCallback(handoffSummary);
              }

              response = 'Aapki query agent ko de di gayi hai. Kuch time baad agent aapko connect karega. Dhanyavaad!';
            } else {
              // Fallback to regular LLM
              response = await this.llm.generateResponse(
                cleanTranscript,
                languageCode
              );
            }
          } else {
            // Step 8: Generate natural language response from API data
            console.log('💬 Step 8: Generating Natural Language Response...');
            response = await this.responseGenerator.generateNaturalResponse(
              cleanTranscript,
              intent.name,
              intentResponse
            );
            console.log('   └─ Generated response:', response.substring(0, 100) + (response.length > 100 ? '...' : ''));
          }

          // Track conversation
          console.log('📝 Step 9: Tracking Conversation...');
          this.handoffManager.trackConversation(
            cleanTranscript,
            response,
            intent,
            sentiment
          );
          console.log('🔵'.repeat(30) + '\n');

        } catch (error) {
          console.error('❌ ERROR: Intent system error, falling back to regular LLM:', error);
          console.log('🔵'.repeat(30) + '\n');
          // Fallback to regular LLM on any error
          response = await this.llm.generateResponse(
            cleanTranscript,
            languageCode
          );
        }
      } else {
        // Regular LLM mode (original behavior)
        response = await this.llm.generateResponse(
          cleanTranscript,
          languageCode
        );
      }

      console.log('Final AI Response:', response);
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
