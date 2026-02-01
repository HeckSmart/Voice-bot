/**
 * Example Intent Implementations
 * Copy these examples to src/intents/index.ts and modify as needed
 */

import { IntentHandler } from '../src/services/intentHandler';
import { IntentDefinition } from '../src/services/intentClassifier';

// ==========================================
// Example 1: E-commerce Product Search
// ==========================================

export const productSearchIntent: IntentDefinition = {
  name: 'search_products',
  description: 'Search for products in the catalog',
  examples: [
    'laptop dikhaao',
    'shoes chahiye',
    'mobile phone search karo',
    'red dress dikhaao',
    'gaming laptop under 50000',
  ],
  entitySchema: {
    product_category: 'string',
    color: 'string',
    price_range: 'string',
  },
};

export function registerProductSearchHandler(intentHandler: IntentHandler) {
  intentHandler.registerHandler('search_products', async (entities) => {
    console.log('Searching products with filters:', entities);

    // Example with a hypothetical database
    const query = `
      SELECT * FROM products 
      WHERE category = ? 
      AND (price BETWEEN ? AND ?)
      LIMIT 5
    `;

    // Mock response
    const products = [
      {
        id: 1,
        name: 'Gaming Laptop',
        price: 45000,
        available: true,
      },
      {
        id: 2,
        name: 'Business Laptop',
        price: 38000,
        available: true,
      },
    ];

    return {
      success: true,
      data: {
        count: products.length,
        products: products,
      },
    };
  });
}

// ==========================================
// Example 2: Restaurant Booking
// ==========================================

export const restaurantBookingIntent: IntentDefinition = {
  name: 'book_restaurant',
  description: 'Book a table at a restaurant',
  examples: [
    'restaurant book karo',
    '4 logo ke liye table chahiye',
    'kal raat 8 baje dinner booking',
    'table reserve karna hai',
    'restaurant mein seat available hai kya',
  ],
  entitySchema: {
    date: 'string',
    time: 'string',
    number_of_people: 'number',
    restaurant_name: 'string',
  },
};

export function registerRestaurantBookingHandler(intentHandler: IntentHandler) {
  intentHandler.registerHandler('book_restaurant', async (entities) => {
    console.log('Booking restaurant with details:', entities);

    // Example API call
    const bookingResponse = await fetch('https://api.example.com/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: 123,
        date: entities.date,
        time: entities.time,
        party_size: entities.number_of_people || 2,
      }),
    }).catch(() => null);

    // Mock response
    return {
      success: true,
      data: {
        booking_id: 'BOOK-' + Math.random().toString(36).substr(2, 9),
        restaurant_name: entities.restaurant_name || 'The Great Indian Kitchen',
        date: entities.date || 'Tomorrow',
        time: entities.time || '8:00 PM',
        party_size: entities.number_of_people || 2,
        status: 'Confirmed',
      },
    };
  });
}

// ==========================================
// Example 3: Customer Support Ticket
// ==========================================

export const supportTicketIntent: IntentDefinition = {
  name: 'create_support_ticket',
  description: 'Create a customer support ticket',
  examples: [
    'complaint karna hai',
    'problem hai mujhe',
    'issue report karo',
    'help chahiye',
    'support ticket create karo',
  ],
  entitySchema: {
    issue_type: 'string',
    priority: 'string',
    description: 'string',
  },
};

export function registerSupportTicketHandler(intentHandler: IntentHandler) {
  intentHandler.registerHandler('create_support_ticket', async (entities) => {
    console.log('Creating support ticket:', entities);

    // Example with database insert
    // const ticket = await db.tickets.insert({
    //   customer_id: getCurrentUser().id,
    //   issue_type: entities.issue_type,
    //   priority: entities.priority || 'medium',
    //   description: entities.description,
    //   status: 'open',
    //   created_at: new Date(),
    // });

    // Mock response
    return {
      success: true,
      data: {
        ticket_id: 'TKT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        status: 'Open',
        priority: entities.priority || 'Medium',
        estimated_response: '2 hours',
      },
    };
  });
}

// ==========================================
// Example 4: Banking - Transaction History
// ==========================================

export const transactionHistoryIntent: IntentDefinition = {
  name: 'get_transactions',
  description: 'Get recent transaction history',
  examples: [
    'pichle transactions dikhaao',
    'last 5 payments batao',
    'aaj ke transactions kya hain',
    'recent transactions check karo',
    'kis kis ko payment kiya',
  ],
  entitySchema: {
    time_period: 'string',
    count: 'number',
    transaction_type: 'string',
  },
};

export function registerTransactionHistoryHandler(intentHandler: IntentHandler) {
  intentHandler.registerHandler('get_transactions', async (entities) => {
    console.log('Fetching transactions for:', entities);

    // Example database query
    // const transactions = await db.query(`
    //   SELECT * FROM transactions 
    //   WHERE user_id = ? 
    //   AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    //   ORDER BY date DESC 
    //   LIMIT ?
    // `, [userId, entities.count || 5]);

    // Mock response
    const mockTransactions = [
      {
        id: 1,
        date: '2026-01-30',
        description: 'Amazon Purchase',
        amount: -1299,
        balance: 13701,
      },
      {
        id: 2,
        date: '2026-01-29',
        description: 'Salary Credit',
        amount: 50000,
        balance: 15000,
      },
      {
        id: 3,
        date: '2026-01-28',
        description: 'Zomato Payment',
        amount: -450,
        balance: -35000,
      },
    ];

    return {
      success: true,
      data: {
        transactions: mockTransactions.slice(0, entities.count || 5),
        total_count: mockTransactions.length,
      },
    };
  });
}

// ==========================================
// Example 5: Healthcare - Medicine Reminder
// ==========================================

export const medicineReminderIntent: IntentDefinition = {
  name: 'set_medicine_reminder',
  description: 'Set a reminder for taking medicine',
  examples: [
    'medicine ka reminder set karo',
    'dawa lene ka alarm lagao',
    'subah 8 baje tablet lena hai',
    'medicine reminder chahiye',
    'daily medicine yaad dilao',
  ],
  entitySchema: {
    medicine_name: 'string',
    time: 'string',
    frequency: 'string',
  },
};

export function registerMedicineReminderHandler(intentHandler: IntentHandler) {
  intentHandler.registerHandler('set_medicine_reminder', async (entities) => {
    console.log('Setting medicine reminder:', entities);

    // Example: Insert into database
    // const reminder = await db.reminders.create({
    //   user_id: getCurrentUser().id,
    //   type: 'medicine',
    //   medicine_name: entities.medicine_name,
    //   time: entities.time,
    //   frequency: entities.frequency || 'daily',
    //   active: true,
    // });

    // Mock response
    return {
      success: true,
      data: {
        reminder_id: 'REM-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        medicine_name: entities.medicine_name || 'Medicine',
        time: entities.time || '8:00 AM',
        frequency: entities.frequency || 'Daily',
        status: 'Active',
        next_reminder: 'Tomorrow at 8:00 AM',
      },
    };
  });
}

// ==========================================
// Example 6: Travel - Cab Booking
// ==========================================

export const cabBookingIntent: IntentDefinition = {
  name: 'book_cab',
  description: 'Book a cab or ride',
  examples: [
    'cab book karo',
    'airport jaana hai',
    'taxi chahiye',
    'ghar se office jaana hai',
    'ride book kar do',
  ],
  entitySchema: {
    pickup_location: 'string',
    drop_location: 'string',
    time: 'string',
    cab_type: 'string',
  },
};

export function registerCabBookingHandler(intentHandler: IntentHandler) {
  intentHandler.registerHandler('book_cab', async (entities) => {
    console.log('Booking cab with details:', entities);

    // Example: Call ride-hailing API
    // const booking = await fetch('https://api.uber.com/v1/requests', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.UBER_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     pickup: entities.pickup_location,
    //     destination: entities.drop_location,
    //     product_id: getCabProductId(entities.cab_type),
    //   }),
    // });

    // Mock response
    return {
      success: true,
      data: {
        booking_id: 'CAB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        driver_name: 'Rajesh Kumar',
        car_model: 'Honda City',
        car_number: 'DL 01 AB 1234',
        estimated_arrival: '5 minutes',
        estimated_fare: '₹250-280',
        pickup: entities.pickup_location || 'Current Location',
        drop: entities.drop_location || 'Destination',
      },
    };
  });
}

// ==========================================
// How to Use These Examples
// ==========================================

/**
 * 1. Copy the intent definitions you need to src/intents/index.ts
 * 2. Add them to the intentDefinitions array
 * 3. Call the register functions in registerIntentHandlers()
 * 4. Replace mock responses with real API/database calls
 * 5. Test with voice input
 * 
 * Example:
 * 
 * // In src/intents/index.ts
 * 
 * export const intentDefinitions: IntentDefinition[] = [
 *   ...existingIntents,
 *   productSearchIntent,
 *   restaurantBookingIntent,
 * ];
 * 
 * export function registerIntentHandlers(intentHandler: IntentHandler) {
 *   // ... existing handlers ...
 *   registerProductSearchHandler(intentHandler);
 *   registerRestaurantBookingHandler(intentHandler);
 * }
 */
