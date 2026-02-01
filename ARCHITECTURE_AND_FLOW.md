# AI Voice Agent — Architecture & Flow

This document describes the full architecture and data flow for the **BatterySmart** voice agent: a Hinglish/Hindi/English voice assistant for driver support (swaps, schemes, subscriptions, handoff to human agents).

---

## 1. Project Overview

| Aspect | Description |
|--------|-------------|
| **Purpose** | Voice-based driver support bot (BatterySmart domain) |
| **Languages** | Hinglish, Hindi, English (STT/TTS and responses) |
| **Frontend** | Next.js 15 (App Router), React, LiveKit client (token only), WebSocket for audio |
| **Backend** | Node.js, Express (REST health), WebSocket server (audio/response/TTS) |
| **AI** | Groq (STT, LLM), Edge TTS or ElevenLabs (TTS), external Predict API (intent classification) |
| **Domain** | Battery Smart: swap count/price, battery issued, schemes, subscriptions, nearest station, handoff |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    USER (Browser)                                 │
│                         Speaks → Hears response in chosen voice                  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js — port 3000)                                                   │
│  • VoiceChat.tsx: mic capture, silence detection, WebSocket client, audio play   │
│  • GET /api/token → LiveKit JWT (room join); WebSocket → Backend :3002             │
│  • Messages + TTS playback (base64 MP3 from backend)                             │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            GET /api/token         WebSocket :3002      (optional)
            (LiveKit JWT)          audio / response     LiveKit URL
                    │                    │
                    │                    ▼
                    │    ┌─────────────────────────────────────────────────────────┐
                    │    │  BACKEND (Node + Express + WS — ports 3001, 3002)      │
                    │    │  • Express: GET /health                                  │
                    │    │  • WebSocket: type=audio → processAudio → response+TTS  │
                    │    │             type=tts → generateSpeech only              │
                    │    │             type=reset → reset conversation             │
                    │    │  • voiceAgent: STT → Intent → Handler → Response → TTS  │
                    │    └────────────────────┬──────────────────────────────────┘
                    │                           │
                    │         ┌─────────────────┼─────────────────┐
                    │         ▼                 ▼                 ▼
                    │    Groq STT         IntentClassifier   Edge/ElevenLabs TTS
                    │    (Whisper)        (Predict API)      (speech out)
                    │         │                 │
                    │         │                 ▼
                    │         │            IntentHandler ──► Battery Smart API
                    │         │            (per-intent handlers)
                    │         │                 │
                    │         │                 ▼
                    │         │            ResponseGenerator (Groq LLM)
                    │         │            SentimentAnalyzer, WarmHandoffManager
                    │         │
                    └─────────┴───────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                                                │
│  • Predict API (PREDICT_API_URL): intent + entities from user query               │
│  • Battery Smart API (BATTERY_SMART_API): driver swaps, schemes, subscription     │
│  • Optional: Escalation API (ESCALATION_API), LiveKit Cloud (NEXT_PUBLIC_*)       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Map

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| **Frontend** | `VoiceChat.tsx` | Mic, silence detection, WebSocket send/recv, message list, TTS playback queue |
| | `app/api/token/route.ts` | Issue LiveKit JWT for room join (identity, room name) |
| | `app/page.tsx` | Renders `VoiceChat` |
| **Backend** | `index.ts` | Express app (health), WebSocket server on 3002, delegates to `voiceAgent` |
| | `voiceAgent.ts` | Orchestrator: STT → sentiment → intent → handoff check → handler → response → TTS |
| | `groqSTT.ts` | Groq Whisper — audio buffer → transcript |
| | `intentClassifier.ts` | POST to Predict API → `{ intent, confidence, entities }` |
| | `intentHandler.ts` | Registry of handlers; runs handler for intent, returns `IntentResponse` |
| | `responseGenerator.ts` | Groq LLM — intent + API data → short Hinglish reply |
| | `sentimentAnalyzer.ts` | Groq LLM — sentiment/emotion for handoff logic |
| | `warmHandoff.ts` | Tracks conversation, failed attempts; decides handoff; builds `HandoffSummary` |
| | `driverMemory.ts` | In-memory driver ID per session (e.g. `default`) |
| | `edgeTTS.ts` / `elevenLabsTTS.ts` | Text + voice → MP3 buffer |
| **Intents** | `realBatterySmartIntents.ts` | Intent definitions + `registerRealBatterySmartHandlers(IntentHandler)` |
| **Config** | `config/livekit.ts` | Generate LiveKit agent token (backend-side, for future use) |

---

## 4. End-to-End Data Flow (One User Utterance)

```
User speaks
    → Browser: MediaRecorder (audio/webm), silence detection
    → On silence: blob → base64, send over WebSocket { type: 'audio', audio, voice }
    → Backend WS receives
        → voiceAgent.processAudio(audio, voice)
            → Groq STT: buffer → transcript (language from voice)
            → SentimentAnalyzer: transcript → sentiment
            → IntentClassifier: transcript → { intent, confidence, entities } (Predict API)
            → WarmHandoffManager.shouldHandoff(intent, sentiment)?
                → If yes: handoff message, callback, return
            → IntentHandler.handleIntent(intent)
                → Get driver ID (entities or driverMemory); if NEED_DRIVER_ID → ask user
                → Call Battery Smart API (or mock) per intent
            → If handoff_required in response → handoff message, callback, return
            → ResponseGenerator: intent + API data → Hinglish text
            → WarmHandoffManager.trackConversation(...)
        → voiceAgent.generateSpeech(responseText, voice) → MP3 buffer
        → WS send { type: 'response', text, audio: base64 }
    → Frontend: push audio to queue, play in order; add message to list
```

---

## 5. Frontend Flow (VoiceChat)

1. **On mount**
   - `initializeRoom()`: `fetch('/api/token')` → LiveKit JWT, `room.connect(NEXT_PUBLIC_LIVEKIT_URL, token)` (connection state shown in UI).
   - `initializeWebSocket()`: connect to `NEXT_PUBLIC_WS_URL` or `ws://localhost:3002`.
   - `startContinuousListening()`: getUserMedia → MediaRecorder, AnalyserNode for level; start recording.

2. **While listening**
   - `monitorAudioLevel()`: when level > threshold for ≥ 500 ms, then silence ≥ 3 s → stop recording.
   - `onstop`: if not pausing for playback, blob size > 50 KB → base64 → `sendAudioToBackend(audioData)` (WS `{ type: 'audio', audio, voice }`).
   - Recording restarts after send (and after TTS queue drains).

3. **WebSocket messages**
   - `response`: show `data.text`, push `data.audio` to queue → `processAudioQueue()` (play MP3, then next).
   - `audio`: TTS-only reply → push and play.
   - `no_response`: stop processing indicator.
   - `error`: show `data.message`.

4. **Voice change**
   - Select new voice → clear messages, clear queue, send `{ type: 'reset' }` so backend clears conversation/history.

5. **Mute**
   - Stop recording and listening; unmute resumes recording.

So: **LiveKit** is used only for connection state (and future real-time room features); **audio in/out and bot responses** go over **WebSocket** to the backend.

---

## 6. Backend Flow (index.ts + voiceAgent.ts)

### 6.1 WebSocket Server (index.ts)

- **Port**: 3002.
- **Messages**:
  - `type: 'reset'` → `voiceAgent.resetConversation()`.
  - `type: 'audio'` → `voiceAgent.processAudio(data.audio, data.voice)` then `voiceAgent.generateSpeech(...)` → send `{ type: 'response', text, audio? }` or `{ type: 'no_response' }`.
  - `type: 'tts'` → `voiceAgent.generateSpeech(data.text, data.voice)` → send `{ type: 'audio', audio }`.
- Errors → `{ type: 'error', message }`.

### 6.2 Voice Agent Pipeline (voiceAgent.ts)

1. **Initialization**
   - Groq STT, Groq LLM, IntentClassifier (Predict API URL + `realBatterySmartIntents`), IntentHandler (with handlers registered from `realBatterySmartIntents`), ResponseGenerator, SentimentAnalyzer, WarmHandoffManager, driverMemory, Edge or ElevenLabs TTS.

2. **processAudio(audioBase64, voice)**
   - Decode base64 → buffer; infer language from `voice` (hi / en-IN / en-US).
   - **STT**: Groq Whisper → transcript; skip if empty/short/punctuation-only/repetitive.
   - **Intent path** (if intent system enabled):
     - Sentiment analysis.
     - Intent classification (Predict API).
     - **Handoff (before handler)**: if `shouldHandoff(intent, sentiment)` (e.g. complaint, speak_to_agent, low confidence, negative sentiment) → handoff message, callback, return.
     - **IntentHandler.handleIntent(intent)** (may return `NEED_DRIVER_ID`, `USE_REGULAR_LLM`, or success with optional `handoff_required`).
     - If `handoff_required` → handoff message, callback, return.
     - If `NEED_DRIVER_ID` → optionally try to extract ID from transcript and retry; else ask for driver ID.
     - If `USE_REGULAR_LLM` or no handler / failure → Groq LLM fallback.
     - On success → ResponseGenerator from intent + API data.
     - Track conversation and API calls in WarmHandoffManager.
   - **Fallback**: any exception or intent disabled → Groq LLM response.
   - Return reply text; caller (index.ts) then calls `generateSpeech` and sends over WS.

3. **generateSpeech(text, voice)**
   - Edge TTS or ElevenLabs → MP3 buffer (used by WS to send base64).

4. **Warm handoff**
   - `onHandoff(callback)` registered in `index.ts`: logs summary; TODO send to CRM/Jarvis, notify agents, create ticket.

---

## 7. Intent System Flow

```
User transcript
       │
       ▼
┌──────────────────┐     POST /predict      ┌──────────────────┐
│ IntentClassifier │ ───────────────────►  │  Predict API     │
│ (predictApiUrl,  │  { instruction, input }│  (external)      │
│  intents list)   │  ◄───────────────────  │  → intent,       │
└────────┬─────────┘     { response: JSON }  │    confidence,   │
         │                                    │    driver_id,   │
         ▼                                    │    entities     │
┌──────────────────┐                         └──────────────────┘
│ Intent           │
│ { name,          │
│   confidence,    │
│   entities }     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     confidence < 0.5 → error / LLM fallback
│ IntentHandler    │     no handler → error / LLM fallback
│ (handlers Map)   │     handler(entities) → call Battery Smart API
└────────┬─────────┘     return { success, data?, error? }
         │
         ▼
┌──────────────────┐     NEED_DRIVER_ID → ask user; optional retry with extracted ID
│ ResponseGenerator│     USE_REGULAR_LLM → Groq LLM
│ (Groq LLM)       │     success → Hinglish 1–2 sentences from data
└──────────────────┘
```

**Intent definitions and handlers** live in `realBatterySmartIntents.ts`: swap_count, swap_price, battery_issued, last_swap_partner, swap_history_invoice, available_scheme, driver_scheme, driver_subscription*, nearest_station, nearest_dsk, nearest_ic, onboarding_status, driver_details, speak_to_agent (handoff), greeting (USE_REGULAR_LLM), etc. Each handler uses `getDriverId(entities)` (entities + driverMemory) and calls Battery Smart API or returns mock.

---

## 8. Warm Handoff & Escalation Flow

- **WarmHandoffManager** keeps: conversation_history, detected_intents, failed_attempts, sentiment_history, api_calls_made.
- **Handoff conditions** (e.g. before or after handling):
  - Intent = complaint or speak_to_agent.
  - Confidence < threshold.
  - Sentiment below threshold.
  - Too many failed API attempts.
- When handoff is triggered:
  - **HandoffSummary** is built (reason, priority, driver_details, last_query, sentiment_trend, agent_context, etc.).
  - Callback in `index.ts` runs (log + TODO: CRM, notify agents, ticket).
  - Optional: `sendToEscalationAPI(handoffSummary)` (POST to `ESCALATION_API`).
  - User hears a short message (e.g. “Ek minute rukiye, main aapko hamare executive se connect kar rahi hoon…”).

---

## 9. Environment & Deployment

### 9.1 Environment Variables

| Where | Variable | Purpose |
|-------|----------|---------|
| Backend | `PORT` | Express port (default 3001) |
| Backend | `GROQ_API_KEY` | Groq STT + LLM |
| Backend | `PREDICT_API_URL` | Intent classification API (default http://localhost:5000/predict) |
| Backend | `BATTERY_SMART_API` | Battery Smart API base (e.g. https://qa.api.upgrid.in) |
| Backend | `ELEVENLABS_API_KEY` | Optional; if set, use ElevenLabs TTS instead of Edge |
| Backend | `ESCALATION_API` | Optional; POST handoff summary |
| Backend | `LIVEKIT_*` | For backend LiveKit token (e.g. agent) |
| Frontend | `NEXT_PUBLIC_WS_URL` | WebSocket URL (e.g. wss://your-backend/ws or leave blank for localhost:3002) |
| Frontend | `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit server URL (for room connect) |
| Frontend | LiveKit keys | For `/api/token` (server-side) |

### 9.2 Docker Compose

- **backend**: build from `./backend`, expose 3001 (HTTP), 3002 (WebSocket); env from `./backend/.env`.
- **frontend**: build from `./frontend`, expose 3000; env from `./frontend/.env`; `NEXT_PUBLIC_WS_URL` / `NEXT_PUBLIC_LIVEKIT_URL` can be set at build or runtime; depends_on backend.

For production, set `NEXT_PUBLIC_WS_URL` to the public WebSocket URL (e.g. `wss://api.yourdomain.com`) so the client connects to the right host.

---

## 10. Sequence Diagrams

### 10.1 Happy Path: User Asks “Swap count kitne hain?”

```
User          Frontend              WebSocket              Backend                  Predict API    Battery Smart API
  │               │                      │                     │                           │                  │
  │  (speaks)     │                      │                     │                           │                  │
  │──────────────►│                      │                     │                           │                  │
  │               │ { audio, voice }      │                     │                           │                  │
  │               │─────────────────────►│                     │                           │                  │
  │               │                      │────────────────────►│                           │                  │
  │               │                      │                     │ STT (Groq)                 │                  │
  │               │                      │                     │ Sentiment                  │                  │
  │               │                      │                     │ classifyIntent(transcript)│                  │
  │               │                      │                     │──────────────────────────►│                  │
  │               │                      │                     │ { intent: swap_count }    │                  │
  │               │                      │                     │◄─────────────────────────│                  │
  │               │                      │                     │ handleIntent → getDriverId│                  │
  │               │                      │                     │ GET /driver/.../swaps     │                  │
  │               │                      │                     │────────────────────────────────────────────►│
  │               │                      │                     │◄────────────────────────────────────────────│
  │               │                      │                     │ responseGenerator        │                  │
  │               │                      │                     │ generateSpeech           │                  │
  │               │                      │ { response, text,   │                           │                  │
  │               │                      │   audio }           │                           │                  │
  │               │                      │◄────────────────────│                           │                  │
  │               │◄─────────────────────│                     │                           │                  │
  │  (hears TTS)  │  play base64 MP3     │                     │                           │                  │
  │◄──────────────│                      │                     │                           │                  │
```

### 10.2 Handoff Path: User Says “Agent se baat karni hai”

```
User          Frontend              WebSocket              Backend                  WarmHandoffManager
  │               │                      │                     │                           │
  │  (speak_to_   │                      │                     │                           │
  │   agent)      │                      │                     │                           │
  │──────────────►│                      │                     │                           │
  │               │ { audio, voice }     │                     │                           │
  │               │─────────────────────►│                     │                           │
  │               │                      │────────────────────►│                           │
  │               │                      │                     │ intent = speak_to_agent   │
  │               │                      │                     │ shouldHandoff → true      │
  │               │                      │                     │ generateHandoffSummary    │
  │               │                      │                     │ onHandoff(summary)         │
  │               │                      │                     │ return handoff message    │
  │               │                      │ { response, text,   │                           │
  │               │                      │   audio }           │                           │
  │               │                      │◄────────────────────│                           │
  │               │◄─────────────────────│                     │                           │
  │  (hears       │                      │                     │                           │
  │   handoff     │                      │                     │                           │
  │   message)    │                      │                     │                           │
  │◄──────────────│                      │                     │                           │
```

---

## 11. File Tree (Relevant to Architecture)

```
ai-voice-agent/
├── docker-compose.yml          # backend (3001, 3002) + frontend (3000)
├── ARCHITECTURE_AND_FLOW.md    # this file
├── backend/
│   ├── .env / .env.example
│   ├── src/
│   │   ├── index.ts            # Express + WebSocket server
│   │   ├── voiceAgent.ts       # Main pipeline
│   │   ├── config/livekit.ts
│   │   ├── intents/
│   │   │   ├── index.ts
│   │   │   └── realBatterySmartIntents.ts  # Definitions + handler registration
│   │   └── services/
│   │       ├── groqSTT.ts
│   │       ├── groqLLM.ts
│   │       ├── edgeTTS.ts
│   │       ├── elevenLabsTTS.ts
│   │       ├── intentClassifier.ts
│   │       ├── intentHandler.ts
│   │       ├── responseGenerator.ts
│   │       ├── sentimentAnalyzer.ts
│   │       ├── warmHandoff.ts
│   │       ├── driverMemory.ts
│   │       └── utils/apiLogger.ts
│   └── ARCHITECTURE.md         # Intent-system detail (backend)
└── frontend/
    ├── .env
    ├── app/
    │   ├── page.tsx
    │   └── api/token/route.ts  # LiveKit JWT
    └── components/
        └── VoiceChat.tsx      # Main UI + WebSocket + audio
```

---

## 12. Summary

- **Frontend**: Next.js; LiveKit for room/token; **WebSocket** for sending audio and receiving text + TTS; continuous listening with silence detection; playback queue for bot replies.
- **Backend**: Express (health) + WebSocket (audio/tts/reset); **voiceAgent** runs STT → sentiment → intent (Predict API) → handoff check → IntentHandler (Battery Smart API) → ResponseGenerator → TTS; warm handoff and optional escalation API.
- **Intents**: Defined and registered in `realBatterySmartIntents.ts`; classifier uses external Predict API; handlers use driver ID from entities or driverMemory and call Battery Smart or return structured data for natural-language response.

This gives a single reference for the whole architecture and flow of the project.
