import { IntentDefinition } from '../services/intentClassifier';
import { IntentHandler } from '../services/intentHandler';

/**
 * Define your intents here
 * Add more intents as per your use case
 */
export const intentDefinitions: IntentDefinition[] = [
  {
    name: 'get_weather',
    description: 'Get weather information for a location',
    examples: [
      'aaj ka mausam kaisa hai',
      'weather kya hai',
      'Delhi mein temperature kitna hai',
      "what's the weather like",
      'mausam batao',
    ],
    entitySchema: {
      location: 'string',
      date: 'string',
    },
  },
  {
    name: 'check_balance',
    description: 'Check account balance or financial information',
    examples: [
      'mere account mein kitne paise hain',
      'balance check karo',
      'my account balance',
      'kitna paisa bacha hai',
      'balance batao',
    ],
    entitySchema: {
      account_type: 'string',
    },
  },
  {
    name: 'track_order',
    description: 'Track order status or delivery information',
    examples: [
      'mera order kahan hai',
      'delivery status kya hai',
      'order track karo',
      'parcel kab aayega',
      'delivery kab hogi',
    ],
    entitySchema: {
      order_id: 'string',
    },
  },
  {
    name: 'book_appointment',
    description: 'Book or schedule an appointment',
    examples: [
      'appointment book karo',
      'kal ka slot check karo',
      'doctor se milna hai',
      'booking karni hai',
      'time slot available hai',
    ],
    entitySchema: {
      date: 'string',
      time: 'string',
      service_type: 'string',
    },
  },
  {
    name: 'general_conversation',
    description: 'General conversation, greetings, or chitchat',
    examples: [
      'hello',
      'hi',
      'kaise ho',
      'namaste',
      'what is your name',
      'tum kaun ho',
    ],
    entitySchema: {},
  },
];

/**
 * Register all intent handlers
 * Implement your API calls here for each intent
 */
export function registerIntentHandlers(intentHandler: IntentHandler) {
  // Weather Intent Handler
  intentHandler.registerHandler('get_weather', async (entities) => {
    console.log('Fetching weather data for entities:', entities);

    // TODO: Replace with your actual API call
    // Example: const response = await fetch(`https://api.weather.com/...`);

    // Mock response for demonstration
    const mockWeatherData = {
      location: entities.location || 'Delhi',
      temperature: 28,
      condition: 'Sunny',
      humidity: 65,
    };

    return {
      success: true,
      data: mockWeatherData,
    };
  });

  // Balance Check Intent Handler
  intentHandler.registerHandler('check_balance', async (entities) => {
    console.log('Fetching balance data for entities:', entities);

    // TODO: Replace with your actual database query
    // Example: const balance = await db.query('SELECT balance FROM accounts WHERE...');

    // Mock response for demonstration
    const mockBalanceData = {
      account_type: entities.account_type || 'Savings',
      balance: 15000,
      currency: 'INR',
      last_updated: new Date().toISOString(),
    };

    return {
      success: true,
      data: mockBalanceData,
    };
  });

  // Order Tracking Intent Handler
  intentHandler.registerHandler('track_order', async (entities) => {
    console.log('Fetching order data for entities:', entities);

    // TODO: Replace with your actual API call
    // Example: const order = await fetch(`https://api.yourservice.com/orders/${entities.order_id}`);

    // Mock response for demonstration
    const mockOrderData = {
      order_id: entities.order_id || '12345',
      status: 'Out for Delivery',
      estimated_delivery: 'Today by 6 PM',
      location: 'Near your address',
    };

    return {
      success: true,
      data: mockOrderData,
    };
  });

  // Appointment Booking Intent Handler
  intentHandler.registerHandler('book_appointment', async (entities) => {
    console.log('Booking appointment for entities:', entities);

    // TODO: Replace with your actual database operation
    // Example: const appointment = await db.insert('appointments', {...});

    // Mock response for demonstration
    const mockAppointmentData = {
      date: entities.date || 'Tomorrow',
      time: entities.time || '10:00 AM',
      service_type: entities.service_type || 'Consultation',
      status: 'Confirmed',
      confirmation_id: 'APT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    };

    return {
      success: true,
      data: mockAppointmentData,
    };
  });

  // General Conversation Intent Handler (fallback to regular LLM)
  intentHandler.registerHandler('general_conversation', async (entities) => {
    console.log('General conversation detected, will use regular LLM');

    // Return null to indicate this should be handled by regular LLM
    return {
      success: false,
      error: 'USE_REGULAR_LLM', // Special flag
    };
  });

  console.log('All intent handlers registered successfully');
}
