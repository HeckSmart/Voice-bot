# Driver Support Bot – Request to Speech Flow

This document describes how the driver support bot handles a driver’s request: **request → intent → API → JSON → text → speech**.

## End-to-end flow

```
Driver speaks
     ↓
Speech-to-Text (Groq STT)
     ↓
Intent classification (Predict API) → intent name + entities (e.g. driver_id)
     ↓
Intent handler calls backend API (e.g. swap count, scheme, subscription)
     ↓
API returns JSON
     ↓
ResponseGenerator: JSON → natural Hinglish text (LLM)
     ↓
Text-to-Speech (Edge TTS / ElevenLabs)
     ↓
Bot speaks answer to driver
```

## 1. Request (driver speaks)

- Driver speaks in Hinglish (e.g. “mera swap count batao”, “subscription kab khatam hoga”).
- Frontend sends audio over WebSocket; backend receives it in `voiceAgent.processAudio(audio, voice)`.

## 2. Find intent

- **IntentClassifier** (`services/intentClassifier.ts`) sends the transcribed text to the **Predict API**.
- Predict API returns structured output: `{ intent, confidence, driver_id?, entities }`.
- Example: “mera swap count batao” → `{ intent: "swap_count", confidence: 0.9, driver_id: "D0015" }`.

## 3. Call API

- **IntentHandler** (`services/intentHandler.ts`) looks up the handler for the classified intent.
- Handlers are registered in `intents/realBatterySmartIntents.ts`; each handler:
  - Uses `driver_id` (and other entities) from the intent.
  - Calls the appropriate backend API (e.g. `BATTERY_SMART_API` or `http://localhost:8000`).
  - Returns an **IntentResponse**: `{ success: boolean, data?: object, error?: string }`.
- API response is JSON (e.g. `{ success: true, data: { swap_count: 42 } }`).

## 4. JSON → text

- **ResponseGenerator** (`services/responseGenerator.ts`) takes:
  - User query, intent name, and **intent response (API JSON/data)**.
- It uses an LLM (Groq) to turn that structured data into **short, natural Hinglish** (1–2 sentences) suitable for voice.
- Example: `{ swap_count: 42 }` → “Aapne total 42 battery swap kiye hain.”

## 5. Text → speech

- The voice agent returns this **text** from `processAudio()`.
- In `backend/src/index.ts`, the WebSocket handler calls `voiceAgent.generateSpeech(response, voice)`.
- **Edge TTS** or **ElevenLabs** turns that text into audio; the buffer is base64-encoded and sent back to the client.
- The client plays the audio so the driver hears the answer.

## Key files

| Step              | File / component |
|-------------------|------------------|
| Entry (audio in)  | `src/index.ts` (WebSocket), `src/voiceAgent.ts` (`processAudio`) |
| Intent            | `src/services/intentClassifier.ts` |
| API call          | `src/services/intentHandler.ts`, `src/intents/realBatterySmartIntents.ts` |
| JSON → text       | `src/services/responseGenerator.ts` |
| Text → speech     | `src/voiceAgent.ts` (`generateSpeech`), `src/services/edgeTTS.ts` or `elevenLabsTTS.ts` |

## Adding a new driver-information intent

1. **Define intent** in `realBatterySmartIntents.ts`: add an entry to `realBatterySmartIntents` (name, description, examples, `entitySchema` e.g. `driver_id`).
2. **Register handler** in the same file: implement a function that calls your API with `driver_id` (from `entities`), then return `{ success, data }` or `{ success: false, error }`.
3. **Train/update Predict API** so that the new intent name and entities are in the model’s output schema.
4. No change needed in ResponseGenerator: it already converts any `intentResponse.data` (JSON) to spoken Hinglish text.
