# Intent-Based Voice Agent System

## Overview

This voice agent now supports intent-based mapping, allowing structured API calls based on user queries instead of just conversational AI responses.

## Architecture

```
User Speech → STT → Intent Classifier → Intent Handler → Response Generator → TTS → Speech
                           ↓                    ↓                  ↓
                    Identifies Intent    Calls Database API   Converts to Hinglish
```

### Components

1. **IntentClassifier** (`services/intentClassifier.ts`)
   - Uses Groq LLM with structured output
   - Classifies user queries into predefined intents
   - Extracts entities from the query (e.g., location, date, order_id)

2. **IntentHandler** (`services/intentHandler.ts`)
   - Maps intents to specific API/database handlers
   - Executes the appropriate handler based on classified intent
   - Returns structured data from APIs

3. **ResponseGenerator** (`services/responseGenerator.ts`)
   - Converts structured API responses into natural Hinglish text
   - Keeps responses short (1-2 sentences) for speech
   - Makes responses sound conversational

4. **Intent Definitions** (`intents/index.ts`)
   - Central place to define all intents
   - Register handlers for each intent

## How to Add a New Intent

### Step 1: Define the Intent

Edit `backend/src/intents/index.ts` and add your intent to `intentDefinitions`:

```typescript
{
  name: 'your_intent_name',
  description: 'What this intent does',
  examples: [
    'example query 1 in Hinglish',
    'example query 2',
    'example query 3',
  ],
  entitySchema: {
    entity_name: 'type',
    another_entity: 'type',
  },
}
```

**Example:**
```typescript
{
  name: 'get_flight_status',
  description: 'Check flight status and timing',
  examples: [
    'meri flight ka status kya hai',
    'flight kab land karegi',
    'AI 101 ka status batao',
  ],
  entitySchema: {
    flight_number: 'string',
    date: 'string',
  },
}
```

### Step 2: Register the Handler

In the same file, add a handler in the `registerIntentHandlers` function:

```typescript
intentHandler.registerHandler('your_intent_name', async (entities) => {
  console.log('Processing your intent with entities:', entities);

  // Make your API call or database query here
  const response = await fetch('https://your-api.com/endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entities),
  });

  const data = await response.json();

  // Return structured data
  return {
    success: true,
    data: data,
  };
});
```

**Full Example: Flight Status**
```typescript
intentHandler.registerHandler('get_flight_status', async (entities) => {
  console.log('Fetching flight status for:', entities);

  try {
    // Replace with your actual API
    const response = await fetch(
      `https://api.flightaware.com/flight/${entities.flight_number}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.FLIGHT_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: 'Flight not found',
      };
    }

    const flightData = await response.json();

    return {
      success: true,
      data: {
        flight_number: flightData.flightNumber,
        status: flightData.status,
        departure_time: flightData.departureTime,
        arrival_time: flightData.arrivalTime,
        gate: flightData.gate,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to fetch flight status',
    };
  }
});
```

### Step 3: Test Your Intent

1. Start the backend server
2. Use the voice interface and say one of your example queries
3. Check console logs to see:
   - Intent classification result
   - API call execution
   - Generated response

## Database Integration Examples

### Example 1: MySQL Database Query

```typescript
import mysql from 'mysql2/promise';

// In your handler
intentHandler.registerHandler('get_user_info', async (entities) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE user_id = ?',
    [entities.user_id]
  );

  await connection.end();

  return {
    success: true,
    data: rows[0],
  };
});
```

### Example 2: MongoDB Query

```typescript
import { MongoClient } from 'mongodb';

intentHandler.registerHandler('get_product_info', async (entities) => {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('myshop');
  
  const product = await db.collection('products').findOne({
    product_id: entities.product_id,
  });

  await client.close();

  return {
    success: true,
    data: product,
  };
});
```

### Example 3: REST API Call

```typescript
intentHandler.registerHandler('get_weather', async (entities) => {
  const response = await fetch(
    `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${entities.location}`
  );

  const data = await response.json();

  return {
    success: true,
    data: {
      location: data.location.name,
      temperature: data.current.temp_c,
      condition: data.current.condition.text,
      humidity: data.current.humidity,
    },
  };
});
```

## Configuration

### Toggle Intent System

By default, the intent system is enabled. You can disable it:

```typescript
// In voiceAgent.ts
voiceAgent.setUseIntentSystem(false); // Disable intent system
voiceAgent.setUseIntentSystem(true);  // Enable intent system
```

### Adjust Confidence Threshold

Edit `intentHandler.ts` to change the minimum confidence level:

```typescript
// Currently set to 0.5 (50%)
if (intent.confidence < 0.5) {
  // Treat as unknown
}
```

## Pre-built Intents

The system comes with these sample intents:

1. **get_weather** - Weather information queries
2. **check_balance** - Account balance checks
3. **track_order** - Order tracking
4. **book_appointment** - Appointment booking
5. **general_conversation** - Fallback to regular LLM

## Response Format

The Response Generator automatically converts structured data to Hinglish:

**Input:**
```json
{
  "temperature": 28,
  "location": "Delhi",
  "condition": "Sunny"
}
```

**Output:**
```
"Delhi mein abhi 28 degrees hai aur mausam sunny hai"
```

## Troubleshooting

### Intent Not Being Detected

1. Check if your examples in `intentDefinitions` are similar to user queries
2. Add more diverse examples
3. Check console logs for confidence scores
4. Lower the confidence threshold if needed

### API Call Failing

1. Check console logs for error messages
2. Verify API credentials in `.env`
3. Test API endpoint separately
4. Add error handling in your handler

### Response Not Natural

1. The Response Generator uses LLM to convert data to Hinglish
2. Make sure your API returns clean, structured data
3. Check if data fields have meaningful names

## Best Practices

1. **Add 5+ examples** for each intent covering different phrasings
2. **Include Hindi, English, and Hinglish** examples
3. **Keep entity schemas simple** - only extract what you need
4. **Handle errors gracefully** - return meaningful error messages
5. **Test with real voice input** - text queries may differ from speech
6. **Keep API responses structured** - easier for Response Generator to work with
7. **Add logging** - helps debug issues in production

## Next Steps

1. Replace mock handlers with real database queries
2. Add authentication for sensitive intents
3. Implement rate limiting for API calls
4. Add caching for frequently accessed data
5. Monitor intent classification accuracy
6. Create a dashboard to visualize intent usage

## Support

For issues or questions, check the console logs which provide detailed information about:
- Intent classification results
- API call executions
- Response generation
- Any errors in the pipeline
