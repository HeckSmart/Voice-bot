# Intent-Based Voice Agent - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION                            │
│                     🎤 User speaks in Hinglish                       │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SPEECH-TO-TEXT (Groq STT)                        │
│               "mere account mein kitne paise hain"                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      INTENT CLASSIFIER                               │
│                    (LLM with Structured Output)                     │
│                                                                      │
│   Input: "mere account mein kitne paise hain"                      │
│   Output: {                                                         │
│     intent: "check_balance",                                        │
│     confidence: 0.95,                                               │
│     entities: { account_type: "savings" }                           │
│   }                                                                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │  Confidence Check       │
                    │  (threshold: 0.5)       │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
         High Confidence    Low Confidence    General Chat
                │                │                │
                ▼                ▼                ▼
    ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Intent Handler   │  │ Regular LLM  │  │ Regular LLM  │
    │                  │  │ (Fallback)   │  │ (General)    │
    └────────┬─────────┘  └──────────────┘  └──────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE / API CALL                               │
│                                                                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│   │   MySQL      │  │  REST API    │  │   MongoDB    │            │
│   │   Query      │  │   Call       │  │   Query      │            │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│          └──────────────────┴─────────────────┘                     │
│                            │                                         │
│   Response: {                                                       │
│     balance: 15000,                                                 │
│     account_type: "savings",                                        │
│     currency: "INR"                                                 │
│   }                                                                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESPONSE GENERATOR                                │
│              (LLM converts data to Hinglish)                        │
│                                                                      │
│   Input: {balance: 15000, currency: "INR"}                         │
│   Output: "Aapke account mein 15000 rupees hain"                   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  TEXT-TO-SPEECH (Edge TTS)                          │
│            Converts Hinglish text to speech audio                   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION                            │
│                   🔊 Bot speaks in Hinglish                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Speech-to-Text (STT)
- **Service**: Groq Whisper
- **Purpose**: Convert user audio to text
- **Supports**: Hindi, English, Hinglish
- **Latency**: ~500-800ms

### 2. Intent Classifier
- **Service**: Groq LLM (llama-3.3-70b-versatile)
- **Purpose**: Classify user intent and extract entities
- **Method**: Structured JSON output
- **Latency**: ~200-300ms
- **Confidence**: 0-1 score for reliability

### 3. Intent Handler
- **Purpose**: Route to appropriate API/DB handler
- **Features**:
  - Confidence threshold checking
  - Handler registration system
  - Error handling & fallback
- **Extensible**: Easy to add new intents

### 4. Database/API Layer
- **Supports**:
  - MySQL, PostgreSQL queries
  - REST API calls
  - MongoDB queries
  - Third-party APIs
- **Async**: Non-blocking operations

### 5. Response Generator
- **Service**: Groq LLM
- **Purpose**: Convert structured data to natural Hinglish
- **Features**:
  - Context-aware responses
  - Short & conversational (1-2 sentences)
  - Natural sounding for TTS
- **Latency**: ~200-300ms

### 6. Text-to-Speech (TTS)
- **Service**: Edge TTS or ElevenLabs
- **Purpose**: Convert text to speech audio
- **Voices**: Multiple Hindi/English voices
- **Latency**: ~400-600ms

## Data Flow Example

### Example 1: Balance Check

```javascript
// User Input
"mere account mein kitne paise hain"

// STT Output
"mere account mein kitne paise hain"

// Intent Classifier Output
{
  intent: "check_balance",
  confidence: 0.95,
  entities: { account_type: "savings" }
}

// Intent Handler (Database Query)
SELECT balance, account_type, currency 
FROM accounts 
WHERE user_id = '12345' AND account_type = 'savings'

// Database Response
{
  balance: 15000,
  account_type: "savings",
  currency: "INR",
  last_updated: "2026-01-31"
}

// Response Generator Output
"Aapke savings account mein 15000 rupees hain"

// TTS Output
[Audio Buffer] → 🔊 Spoken output
```

### Example 2: Order Tracking

```javascript
// User Input
"mera order kahan hai"

// Intent Classifier
{
  intent: "track_order",
  confidence: 0.88,
  entities: {}
}

// API Call
GET https://api.yourshop.com/orders/latest?user_id=12345

// API Response
{
  order_id: "ORD123",
  status: "out_for_delivery",
  location: "Near your address",
  estimated_delivery: "Today by 6 PM"
}

// Response Generator
"Aapka order delivery ke liye nikal gaya hai, aaj shaam 6 baje tak mil jayega"

// TTS → 🔊
```

## Why This Architecture?

### ✅ Benefits

1. **Fast**: Intent classification + API call in ~500ms
2. **Accurate**: LLM-based intent detection with confidence scores
3. **Scalable**: Easy to add new intents without retraining
4. **Flexible**: Works with any database or API
5. **Natural**: Responses sound conversational in Hinglish
6. **Maintainable**: Clear separation of concerns

### ❌ Alternatives Considered

#### Option 1: RAG (Retrieval-Augmented Generation)
- ⏱️ Slower (embedding + vector search + LLM)
- 💾 Requires vector database maintenance
- 🎯 Overkill for intent classification
- ✅ Better for: Large knowledge bases, documentation search

#### Option 2: Traditional NLU (Rasa, Dialogflow)
- 📚 Requires extensive training data
- 🔄 Needs retraining for new intents
- 💰 Often requires paid services
- ✅ Better for: Simple, fixed intent patterns

#### Option 3: Direct LLM (No Intent System)
- 🎲 Unpredictable responses
- 🐌 Slower for structured queries
- 💸 Higher token costs
- ✅ Better for: Pure conversational AI

## Scalability Considerations

### Horizontal Scaling
```
┌─────────────┐
│  Load       │
│  Balancer   │
└──────┬──────┘
       │
   ┌───┴───┬───────┬───────┐
   │       │       │       │
   ▼       ▼       ▼       ▼
┌──────┐┌──────┐┌──────┐┌──────┐
│ VM 1 ││ VM 2 ││ VM 3 ││ VM 4 │
│Voice ││Voice ││Voice ││Voice │
│Agent ││Agent ││Agent ││Agent │
└──────┘└──────┘└──────┘└──────┘
   │       │       │       │
   └───┬───┴───┬───┴───┬───┘
       │       │       │
       ▼       ▼       ▼
   ┌──────────────────────┐
   │   Database Pool      │
   └──────────────────────┘
```

### Caching Strategy
```javascript
// Intent classification cache
const intentCache = new Map();

// Response cache for common queries
const responseCache = new Map();

// Database query cache
const dbCache = new Map();
```

### Performance Optimization

1. **Intent Classification Cache**
   - Cache frequently asked questions
   - TTL: 1 hour

2. **API Response Cache**
   - Cache non-real-time data (product info, static content)
   - TTL: Varies by data type

3. **Database Connection Pool**
   - Reuse connections
   - Avoid cold starts

4. **Parallel Processing**
   ```javascript
   // Process multiple intents in parallel
   const [intent1, intent2] = await Promise.all([
     classifyIntent(query1),
     classifyIntent(query2),
   ]);
   ```

## Security Considerations

### 1. API Key Management
```typescript
// Store in environment variables
GROQ_API_KEY=your_key
DATABASE_URL=your_url

// Never commit to git
.env
.env.local
```

### 2. Input Validation
```typescript
// Validate entities before database queries
if (!isValidUserId(entities.user_id)) {
  return { success: false, error: 'Invalid user ID' };
}
```

### 3. Rate Limiting
```typescript
// Limit API calls per user
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  perMinutes: 1,
});
```

### 4. SQL Injection Prevention
```typescript
// Use parameterized queries
db.query('SELECT * FROM users WHERE id = ?', [userId]);
// NOT: `SELECT * FROM users WHERE id = '${userId}'`
```

## Monitoring & Observability

### Key Metrics to Track

1. **Intent Classification Accuracy**
   - % of correctly classified intents
   - Average confidence score
   - Fallback rate to regular LLM

2. **Latency**
   - STT latency
   - Intent classification time
   - API call duration
   - Response generation time
   - End-to-end latency

3. **Error Rates**
   - Failed API calls
   - Database errors
   - LLM errors

4. **User Satisfaction**
   - Successful task completion rate
   - User feedback
   - Conversation length

### Logging Example

```typescript
{
  timestamp: '2026-01-31T10:30:00Z',
  user_id: '12345',
  query: 'mere account mein kitne paise hain',
  intent: 'check_balance',
  confidence: 0.95,
  api_call: 'database.balance_check',
  api_latency_ms: 45,
  response: 'Aapke account mein 15000 rupees hain',
  end_to_end_latency_ms: 823,
  success: true
}
```

## Future Enhancements

1. **Multi-turn Conversations**
   - Maintain context across multiple exchanges
   - Handle follow-up questions

2. **Intent Disambiguation**
   - Ask clarifying questions when confidence is medium
   - "Aap kis account ka balance chahte hain?"

3. **Personalization**
   - Learn user preferences
   - Adapt responses based on history

4. **Analytics Dashboard**
   - Visualize intent distribution
   - Monitor system health
   - Track user engagement

5. **A/B Testing**
   - Test different prompts
   - Optimize response generation
   - Improve intent accuracy

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   CloudFlare     │
                    │   Load Balancer  │
                    └────────┬─────────┘
                             │
                ┌────────────┴─────────────┐
                │                          │
                ▼                          ▼
        ┌──────────────┐          ┌──────────────┐
        │  Backend 1   │          │  Backend 2   │
        │  (Voice Agent)│         │  (Voice Agent)│
        └───────┬──────┘          └───────┬──────┘
                │                          │
                └────────────┬─────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Database       │
                    │   (PostgreSQL)   │
                    └──────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Redis Cache    │
                    └──────────────────┘
```

## Tech Stack Summary

| Component           | Technology                | Why Chosen                    |
|---------------------|---------------------------|-------------------------------|
| STT                 | Groq Whisper              | Fast, accurate, multi-lingual|
| Intent Classifier   | Groq LLM                  | Structured output, fast       |
| Response Generator  | Groq LLM                  | Natural Hinglish generation   |
| TTS                 | Edge TTS / ElevenLabs     | Free / High quality voices    |
| Backend Framework   | Express.js                | Simple, well-documented       |
| Communication       | WebSocket                 | Real-time bidirectional       |
| Language            | TypeScript                | Type safety, better DX        |

## Conclusion

This architecture provides a robust, scalable, and maintainable solution for intent-based voice interactions. The use of LLM for intent classification offers the perfect balance between accuracy and speed, while the modular design makes it easy to extend and customize.

**Key Takeaway**: LLM-based intent classification > RAG for structured query handling in voice agents.
