# Quick Start Guide - Intent-Based Voice Agent

## What's New?

Your voice agent now supports **intent-based mapping**:

```
🎤 User speaks → 🎯 Intent detected → 📡 API called → 💬 Hinglish response → 🔊 TTS
```

Instead of just conversational AI, the system can now:
- Detect what the user wants (intent)
- Call specific APIs/databases
- Return structured information in natural language

## Flow Example

**User says:** "Mere account mein kitne paise hain?"

1. **STT** → Transcribes to text
2. **Intent Classifier** → Detects `check_balance` intent (confidence: 0.95)
3. **Intent Handler** → Calls database API to get balance
4. **Response Generator** → Converts `{balance: 15000}` to "Aapke account mein 15000 rupees hain"
5. **TTS** → Speaks the response

## Getting Started

### Step 1: Test the System

The system comes with 5 pre-built sample intents:

```bash
cd backend
npm run dev
```

Try these voice queries:
- "Mausam kaisa hai?" (Weather)
- "Mere account mein kitne paise hain?" (Balance)
- "Mera order kahan hai?" (Order tracking)
- "Appointment book karna hai" (Booking)
- "Hello, kaise ho?" (General chat)

### Step 2: Add Your First Custom Intent

Edit `backend/src/intents/index.ts`:

```typescript
// 1. Add intent definition
export const intentDefinitions: IntentDefinition[] = [
  // ... existing intents ...
  {
    name: 'get_student_marks',
    description: 'Get student exam marks',
    examples: [
      'mere marks kya hain',
      'mera result batao',
      'kitne number aaye',
      'exam ka score check karo',
    ],
    entitySchema: {
      student_id: 'string',
      subject: 'string',
    },
  },
];

// 2. Add handler
export function registerIntentHandlers(intentHandler: IntentHandler) {
  // ... existing handlers ...

  intentHandler.registerHandler('get_student_marks', async (entities) => {
    // Your database query
    const marks = await db.query(
      'SELECT * FROM student_marks WHERE student_id = ?',
      [entities.student_id || getCurrentStudent().id]
    );

    return {
      success: true,
      data: {
        student_name: marks.name,
        subject: entities.subject || 'All subjects',
        total_marks: marks.total,
        percentage: marks.percentage,
      },
    };
  });
}
```

### Step 3: Replace Mock Data with Real APIs

Current handlers have mock data. Replace with your actual APIs:

```typescript
// Before (Mock)
intentHandler.registerHandler('check_balance', async (entities) => {
  const mockBalanceData = {
    balance: 15000,
  };
  return { success: true, data: mockBalanceData };
});

// After (Real API)
intentHandler.registerHandler('check_balance', async (entities) => {
  const response = await fetch('https://your-api.com/balance', {
    headers: { 'Authorization': `Bearer ${process.env.API_KEY}` },
  });
  const data = await response.json();
  return { success: true, data };
});
```

## Project Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── intentClassifier.ts    # LLM-based intent detection
│   │   ├── intentHandler.ts       # Maps intents to API calls
│   │   ├── responseGenerator.ts   # Converts data to Hinglish
│   │   ├── groqSTT.ts            # Speech-to-text
│   │   ├── groqLLM.ts            # Regular LLM
│   │   └── edgeTTS.ts            # Text-to-speech
│   ├── intents/
│   │   └── index.ts              # 🔥 Define intents & handlers here
│   ├── voiceAgent.ts             # Main orchestrator
│   └── index.ts                  # WebSocket server
├── examples/
│   └── example-intents.ts        # Copy-paste examples
├── INTENT_SYSTEM.md              # Detailed documentation
└── QUICKSTART.md                 # This file
```

## Configuration

### Enable/Disable Intent System

In `src/index.ts` or `src/voiceAgent.ts`:

```typescript
// After initialization
voiceAgent.setUseIntentSystem(true);  // Enable (default)
voiceAgent.setUseIntentSystem(false); // Disable - uses regular LLM
```

### Adjust Confidence Threshold

In `src/services/intentHandler.ts`:

```typescript
// Line 31: Minimum confidence level
if (intent.confidence < 0.5) { // Change from 0.5 to your desired value
  return { success: false, error: 'Low confidence' };
}
```

Lower = More lenient (might classify incorrectly)  
Higher = More strict (might miss some intents)

## Common Use Cases

### 1. Database Queries

```typescript
intentHandler.registerHandler('get_user_profile', async (entities) => {
  const user = await db.users.findOne({ id: entities.user_id });
  return { success: true, data: user };
});
```

### 2. REST API Calls

```typescript
intentHandler.registerHandler('get_weather', async (entities) => {
  const response = await fetch(`https://api.weather.com/?city=${entities.city}`);
  const data = await response.json();
  return { success: true, data };
});
```

### 3. Multiple API Calls

```typescript
intentHandler.registerHandler('get_dashboard', async (entities) => {
  const [user, stats, notifications] = await Promise.all([
    fetchUser(entities.user_id),
    fetchStats(entities.user_id),
    fetchNotifications(entities.user_id),
  ]);

  return {
    success: true,
    data: { user, stats, notifications },
  };
});
```

### 4. Write Operations

```typescript
intentHandler.registerHandler('place_order', async (entities) => {
  const orderId = await db.orders.insert({
    user_id: getCurrentUser().id,
    product_id: entities.product_id,
    quantity: entities.quantity,
    created_at: new Date(),
  });

  return {
    success: true,
    data: {
      order_id: orderId,
      status: 'placed',
      delivery_by: calculateDeliveryDate(),
    },
  };
});
```

## Testing

### Console Logs

The system provides detailed logs:

```
✓ Detected intent: check_balance
✓ Confidence: 0.95
✓ Entities: {"account_type": "savings"}
✓ API response: {"balance": 15000}
✓ Generated response: "Aapke account mein 15000 rupees hain"
```

### Test Without Voice

You can test intent classification directly:

```typescript
// In src/index.ts or create a test file
const intent = await voiceAgent.intentClassifier.classifyIntent(
  'mere account mein kitne paise hain'
);
console.log('Intent:', intent);
```

## Troubleshooting

### Issue: Intent not detected correctly

**Solution:**
- Add more examples in `intentDefinitions`
- Make examples similar to how users actually speak
- Include Hindi, English, and Hinglish variations

### Issue: API call failing

**Solution:**
- Check console logs for error messages
- Verify API credentials in `.env`
- Add try-catch blocks in handlers
- Test API endpoint separately

### Issue: Response not in Hinglish

**Solution:**
- The Response Generator automatically converts to Hinglish
- Make sure API returns clean JSON data
- Check the system prompt in `responseGenerator.ts`

### Issue: Falls back to regular LLM

**Solution:**
- Check confidence score in logs
- Lower confidence threshold in `intentHandler.ts`
- Add more training examples for the intent

## Examples from Real Projects

See `backend/examples/example-intents.ts` for ready-to-use examples:

- E-commerce product search
- Restaurant booking
- Customer support tickets
- Banking transactions
- Medicine reminders
- Cab booking

## Next Steps

1. ✅ Test with pre-built intents
2. ✅ Add your first custom intent
3. ✅ Connect to your database
4. ✅ Replace mock handlers with real APIs
5. ✅ Test with voice input
6. 📊 Monitor intent accuracy
7. 🚀 Deploy to production

## Performance

- **Intent Classification**: ~200-300ms (Groq LLM)
- **Response Generation**: ~200-300ms (Groq LLM)
- **Total added latency**: ~400-600ms

This is acceptable for voice applications and much faster than RAG systems.

## Why LLM over RAG?

**LLM (Used here):**
- ✅ Fast classification (200-300ms)
- ✅ Works great with predefined intents
- ✅ Can extract entities from queries
- ✅ No need to maintain vector database

**RAG (Not used):**
- ⏱️ Slower (embedding + retrieval)
- 📚 Better for large knowledge bases
- 🔄 Overkill for intent classification

For intent mapping, LLM is the right choice!

## Support

- 📖 Detailed docs: `INTENT_SYSTEM.md`
- 💡 Examples: `examples/example-intents.ts`
- 🔍 Check console logs for debugging
- 📝 Intent definitions: `src/intents/index.ts`

Happy coding! 🚀
