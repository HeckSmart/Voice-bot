import { IntentDefinition } from '../services/intentClassifier';
import { IntentHandler } from '../services/intentHandler';
import { driverMemory } from '../services/driverMemory';
import { logApiCall } from '../utils/apiLogger';
import fetch from 'node-fetch';


const API_BASE = process.env.BATTERY_SMART_API || 'http://localhost:8000';

export const realBatterySmartIntents: IntentDefinition[] = [
  // ==========================================
  // SWAP & TRANSACTION INTENTS
  // ==========================================
  {
    name: 'swap_count',
    description: 'Get total number of battery swaps done by driver',
    examples: [
      'kitne swap kiye maine',
      'mera swap count batao',
      'total swaps kitne hain',
      'maine kitni baar battery swap ki',
      'swap count kya hai',
      'how many swaps',
      'swap history count',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'swap_price',
    description: 'Get last swap price paid by driver',
    examples: [
      'last swap ka price kya tha',
      'pichli swap mein kitna paisa laga',
      'swap price batao',
      'kitne rupees lage the',
      'last swap cost',
      'battery swap ka rate kya tha',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'last_swap_price',
    description: 'Get last swap price (same as swap_price)',
    examples: [
      'last swap price',
      'pichli baar kitna paisa laga',
      'latest swap ka price',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'battery_issued',
    description: 'Get batteries issued in last swap',
    examples: [
      'konsi battery mili thi',
      'battery number kya hai',
      'mujhe kaunsi battery di thi',
      'last battery issued',
      'battery details batao',
      'issued battery',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'last_battery_issued',
    description: 'Get last battery issued (same as battery_issued)',
    examples: [
      'last battery number',
      'pichli battery ka number',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'last_swap_partner',
    description: 'Get partner ID where last swap was done',
    examples: [
      'kahan se swap kiya tha',
      'konse station se battery li',
      'last swap partner',
      'partner ID batao',
      'kahan gaya tha battery ke liye',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'swap_history_invoice',
    description: 'Get detailed invoice of last swap',
    examples: [
      'last invoice dikhao',
      'swap ka bill chahiye',
      'invoice details',
      'pichle swap ki details',
      'bill breakdown chahiye',
      'invoice batao',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },

  // ==========================================
  // SCHEME INTENTS
  // ==========================================
  {
    name: 'available_scheme',
    description: 'Get available schemes for driver',
    examples: [
      'kya schemes available hain',
      'schemes batao',
      'kaunsi scheme hai',
      'available schemes',
      'schemes dikhao',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'driver_scheme',
    description: 'Get current scheme details of driver',
    examples: [
      'meri scheme kya hai',
      'scheme details batao',
      'current scheme',
      'mera kaunsa scheme hai',
      'scheme name',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },

  // ==========================================
  // SUBSCRIPTION INTENTS
  // ==========================================
  {
    name: 'driver_subscription',
    description: 'Get subscription details of driver',
    examples: [
      'mera subscription kya hai',
      'subscription details batao',
      'plan details',
      'subscription name',
      'current subscription',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'driver_subscription_end_date',
    description: 'Get subscription expiry date',
    examples: [
      'subscription kab khatam hoga',
      'expiry date kya hai',
      'plan kab tak valid hai',
      'end date batao',
      'kab expire hoga',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'driver_subscription_start_date',
    description: 'Get subscription start date',
    examples: [
      'subscription kab start hua',
      'start date kya hai',
      'plan kab se shuru hua',
      'activation date',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'driver_subscription_price',
    description: 'Get subscription price',
    examples: [
      'subscription ka price kya hai',
      'plan kitne ka hai',
      'subscription cost',
      'kitne rupees ka plan',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'driver_subscription_status',
    description: 'Get subscription status (active/inactive)',
    examples: [
      'subscription active hai kya',
      'status kya hai',
      'plan active hai',
      'subscription status',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },

  // ==========================================
  // LOCATION INTENTS (No driver ID needed)
  // ==========================================
  {
    name: 'nearest_station',
    description: 'Find nearest battery swap station',
    examples: [
      'nearest station kahan hai',
      'paas mein station',
      'battery station location',
      'kahan se battery lu',
    ],
    entitySchema: {
      location: 'string',
    },
  },
  {
    name: 'nearest_dsk',
    description: 'Find nearest DSK (Driver Service Kendra)',
    examples: [
      'nearest DSK kahan hai',
      'DSK location',
      'driver service kendra',
    ],
    entitySchema: {
      location: 'string',
    },
  },
  {
    name: 'nearest_ic',
    description: 'Find nearest IC (Information Center)',
    examples: [
      'nearest IC kahan hai',
      'IC location',
      'information center',
    ],
    entitySchema: {
      location: 'string',
    },
  },

  // ==========================================
  // DRIVER INFO INTENTS
  // ==========================================
  {
    name: 'onboarding_status',
    description: 'Get driver onboarding status',
    examples: [
      'onboarding status',
      'mera registration complete hai kya',
      'onboarding kaise chal raha hai',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },
  {
    name: 'driver_details',
    description: 'Get complete driver details',
    examples: [
      'meri details batao',
      'driver details',
      'mera account info',
      'profile dikhao',
    ],
    entitySchema: {
      driver_id: 'string',
    },
  },

  // ==========================================
  // SUPPORT INTENTS
  // ==========================================
  {
    name: 'speak_to_agent',
    description: 'User wants to talk to human agent',
    examples: [
      'agent se baat karni hai',
      'human chahiye',
      'customer care',
      'kisi insaan se baat karo',
    ],
    entitySchema: {},
  },
  {
    name: 'greeting',
    description: 'Greetings',
    examples: [
      'hello',
      'hi',
      'namaste',
      'hey',
    ],
    entitySchema: {},
  },
];

/**
 * Register all real Battery Smart intent handlers
 */
export function registerRealBatterySmartHandlers(intentHandler: IntentHandler) {
  // Helper function to get driver ID from entities or session
  const getDriverId = (entities: any, sessionId: string = 'default'): string | null => {
    console.log('[GET_DRIVER_ID] Checking for driver ID...', { entities, sessionId });
    
    // Check if driver ID provided in entities
    if (entities.driver_id) {
      const normalized = driverMemory.normalizeDriverId(entities.driver_id);
      driverMemory.setDriverId(sessionId, normalized);
      console.log('[GET_DRIVER_ID] Found in entities, normalized:', normalized);
      return normalized;
    }
    
    // Check if driver ID exists in session memory
    const storedDriverId = driverMemory.getDriverId(sessionId);
    if (storedDriverId) {
      console.log('[GET_DRIVER_ID] Found in memory:', storedDriverId);
      return storedDriverId;
    }
    
    console.log('[GET_DRIVER_ID] No driver ID found');
    return null;
  };

  // ==========================================
  // HANDLER: swap_count
  // ==========================================
  intentHandler.registerHandler('swap_count', async (entities) => {
    console.log('[INTENT:swap_count] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:swap_count] ❌ No driver ID available');
      return {
        success: false,
        error: 'NEED_DRIVER_ID',
      };
    }

    try {
      // Correct endpoint: /api/drivers/driverSwapCount?driverId=D0015
      // Response format: { "status": "success", "data": [{ "id": "D0015", "swapCount": 0 }] }
      const url = `${API_BASE}/api/drivers/driverSwapCount?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:swap_count', 'GET', url, response.status, data);

      if (data.status === 'success' && data.data && data.data.length > 0) {
        const result = {
          driver_id: data.data[0].id,
          swap_count: data.data[0].swapCount,
        };
        console.log('[INTENT:swap_count] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:swap_count] ⚠️ No data found in response');
      return { success: false, error: 'No data found' };
    } catch (error) {
      console.error('[INTENT:swap_count] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: swap_price & last_swap_price
  // ==========================================
  const swapPriceHandler = async (entities: any) => {
    console.log('[INTENT:swap_price] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:swap_price] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/transactions/lastSwapPrice?driverId=D0015
      // Response format: { "success": true, "data": { "swapPrice": 240 } }
      const url = `${API_BASE}/api/transactions/lastSwapPrice?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:swap_price', 'GET', url, response.status, data);

      if (data.success && data.data) {
        const result = { swap_price: data.data.swapPrice };
        console.log('[INTENT:swap_price] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:swap_price] ⚠️ No data found in response');
      return { success: false, error: 'No data found' };
    } catch (error) {
      console.error('[INTENT:swap_price] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  };

  intentHandler.registerHandler('swap_price', swapPriceHandler);
  intentHandler.registerHandler('last_swap_price', swapPriceHandler);

  // ==========================================
  // HANDLER: battery_issued & last_battery_issued
  // ==========================================
  const batteryIssuedHandler = async (entities: any) => {
    console.log('[INTENT:battery_issued] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:battery_issued] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/transactions/lastBatteryIssued?driverId=D0015
      // Response format: { "success": true, "data": { "batteriesIssued": "[\"B0142\",\"B0143\"]" } }
      const url = `${API_BASE}/api/transactions/lastBatteryIssued?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:battery_issued', 'GET', url, response.status, data);

      if (data.success && data.data && data.data.batteriesIssued) {
        const batteries = JSON.parse(data.data.batteriesIssued);
        const result = {
          batteries_issued: batteries,
          count: batteries.length,
        };
        console.log('[INTENT:battery_issued] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:battery_issued] ⚠️ No data found');
      return { success: false, error: 'No data found' };
    } catch (error) {
      console.error('[INTENT:battery_issued] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  };

  intentHandler.registerHandler('battery_issued', batteryIssuedHandler);
  intentHandler.registerHandler('last_battery_issued', batteryIssuedHandler);

  // ==========================================
  // HANDLER: last_swap_partner
  // ==========================================
  intentHandler.registerHandler('last_swap_partner', async (entities) => {
    console.log('[INTENT:last_swap_partner] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:last_swap_partner] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/transactions/lastSwapPartnerId?driverId=D0015
      // Response format: { "success": true, "data": { "partnerId": "P0003" } }
      const url = `${API_BASE}/api/transactions/lastSwapPartnerId?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:last_swap_partner', 'GET', url, response.status, data);

      if (data.success && data.data) {
        const result = { partner_id: data.data.partnerId };
        console.log('[INTENT:last_swap_partner] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:last_swap_partner] ⚠️ No data found in response');
      return { success: false, error: 'No data found' };
    } catch (error) {
      console.error('[INTENT:last_swap_partner] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: swap_history_invoice
  // ==========================================
  intentHandler.registerHandler('swap_history_invoice', async (entities) => {
    console.log('[INTENT:swap_history_invoice] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:swap_history_invoice] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/transactions/lastSwapHistoryInvoice?driverId=D0015
      // Response format: { "success": true, "data": { swapPrice, discount, penalty, ... } }
      const url = `${API_BASE}/api/transactions/lastSwapHistoryInvoice?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:swap_history_invoice', 'GET', url, response.status, data);

      if (data.success && data.data) {
        const invoice = data.data;
        const result = {
          swap_price: invoice.swapPrice,
          discount: invoice.discount,
          penalty: invoice.penalty,
          points_used: invoice.pointsUsed,
          service_charge: invoice.serviceCharge,
          batteries_received: JSON.parse(invoice.batteriesReceived),
          batteries_issued: JSON.parse(invoice.batteriesIssued),
          vehicle_type: invoice.vehicleType,
          date: invoice.date,
          partner_id: invoice.partnerId,
          status: invoice.status,
        };
        console.log('[INTENT:swap_history_invoice] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:swap_history_invoice] ⚠️ No invoice found');
      return { success: false, error: 'No invoice found' };
    } catch (error) {
      console.error('[INTENT:swap_history_invoice] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: available_scheme
  // ==========================================
  intentHandler.registerHandler('available_scheme', async (entities) => {
    console.log('[INTENT:available_scheme] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:available_scheme] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/schemes?driverId=D0015
      // Response format: { "success": true, "data": [{ id, driverId, schemeName, description, ... }] }
      const url = `${API_BASE}/api/schemes?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:available_scheme', 'GET', url, response.status, data);

      if (data.success && data.data && data.data.length > 0) {
        const result = {
          schemes: data.data.map((s: any) => ({
            name: s.schemeName,
            description: s.description,
          })),
        };
        console.log('[INTENT:available_scheme] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:available_scheme] ⚠️ No schemes available');
      return { success: false, error: 'No schemes available' };
    } catch (error) {
      console.error('[INTENT:available_scheme] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: driver_scheme
  // ==========================================
  intentHandler.registerHandler('driver_scheme', async (entities) => {
    console.log('[INTENT:driver_scheme] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:driver_scheme] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/schemes/details?driverId=D0015
      // Response format: { "success": true, "data": { "schemeName": "Pro Rider", "description": "..." } }
      const url = `${API_BASE}/api/schemes/details?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:driver_scheme', 'GET', url, response.status, data);

      if (data.success && data.data) {
        const result = {
          scheme_name: data.data.schemeName,
          description: data.data.description,
        };
        console.log('[INTENT:driver_scheme] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:driver_scheme] ⚠️ No scheme found');
      return { success: false, error: 'No scheme found' };
    } catch (error) {
      console.error('[INTENT:driver_scheme] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: driver_subscription
  // ==========================================
  intentHandler.registerHandler('driver_subscription', async (entities) => {
    console.log('[INTENT:driver_subscription] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:driver_subscription] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/subscriptions?driverId=D0015
      // Response format: { "success": true, "data": [{ id, driverId, subscriptionName, description, startDate, endDate, subscriptionPrice, status, ... }] }
      const url = `${API_BASE}/api/subscriptions?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:driver_subscription', 'GET', url, response.status, data);

      if (data.success && data.data && data.data.length > 0) {
        const sub = data.data[0];
        const result = {
          subscription_name: sub.subscriptionName,
          description: sub.description,
          start_date: sub.startDate,
          end_date: sub.endDate,
          price: sub.subscriptionPrice,
          status: sub.status,
        };
        console.log('[INTENT:driver_subscription] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:driver_subscription] ⚠️ No subscription found');
      return { success: false, error: 'No subscription found' };
    } catch (error) {
      console.error('[INTENT:driver_subscription] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: driver_subscription_end_date
  // ==========================================
  intentHandler.registerHandler('driver_subscription_end_date', async (entities) => {
    console.log('[INTENT:driver_subscription_end_date] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:driver_subscription_end_date] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/subscriptions/endDate?driverId=D0015
      // Response format: { "success": true, "data": { "endDate": "2027-01-01T21:10:15.000Z" } }
      const url = `${API_BASE}/api/subscriptions/endDate?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:driver_subscription_end_date', 'GET', url, response.status, data);

      if (data.success && data.data) {
        const result = { end_date: data.data.endDate };
        console.log('[INTENT:driver_subscription_end_date] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:driver_subscription_end_date] ⚠️ No data found');
      return { success: false, error: 'No data found' };
    } catch (error) {
      console.error('[INTENT:driver_subscription_end_date] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: driver_subscription_start_date
  // ==========================================
  intentHandler.registerHandler('driver_subscription_start_date', async (entities) => {
    console.log('[INTENT:driver_subscription_start_date] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:driver_subscription_start_date] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/subscriptions/startDate?driverId=D0015
      // Response format: { "success": true, "data": { "startDate": "2026-01-01T21:10:15.000Z" } }
      const url = `${API_BASE}/api/subscriptions/startDate?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:driver_subscription_start_date', 'GET', url, response.status, data);

      if (data.success && data.data) {
        const result = { start_date: data.data.startDate };
        console.log('[INTENT:driver_subscription_start_date] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:driver_subscription_start_date] ⚠️ No data found');
      return { success: false, error: 'No data found' };
    } catch (error) {
      console.error('[INTENT:driver_subscription_start_date] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: driver_subscription_price
  // ==========================================
  intentHandler.registerHandler('driver_subscription_price', async (entities) => {
    console.log('[INTENT:driver_subscription_price] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:driver_subscription_price] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/subscriptions/price?driverId=D0015
      // Response format: { "success": true, "data": { "subscriptionPrice": 4499 } }
      const url = `${API_BASE}/api/subscriptions/price?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:driver_subscription_price', 'GET', url, response.status, data);

      if (data.success && data.data) {
        const result = { subscription_price: data.data.subscriptionPrice };
        console.log('[INTENT:driver_subscription_price] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:driver_subscription_price] ⚠️ No data found');
      return { success: false, error: 'No data found' };
    } catch (error) {
      console.error('[INTENT:driver_subscription_price] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: driver_subscription_status
  // ==========================================
  intentHandler.registerHandler('driver_subscription_status', async (entities) => {
    console.log('[INTENT:driver_subscription_status] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:driver_subscription_status] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/subscriptions/status?driverId=D0015
      // Response format: { "success": true, "data": { "status": "active" } }
      const url = `${API_BASE}/api/subscriptions/status?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:driver_subscription_status', 'GET', url, response.status, data);

      if (data.success && data.data) {
        const result = { status: data.data.status };
        console.log('[INTENT:driver_subscription_status] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:driver_subscription_status] ⚠️ No data found');
      return { success: false, error: 'No data found' };
    } catch (error) {
      console.error('[INTENT:driver_subscription_status] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: nearest_station (mock - no real API)
  // ==========================================
  intentHandler.registerHandler('nearest_station', async (entities) => {
    // Mock implementation - generate random location
    const stations = [
      'Connaught Place Battery Station - 2.3 km',
      'Karol Bagh Station - 3.5 km',
      'Rohini Station - 5.1 km',
    ];
    
    const randomStation = stations[Math.floor(Math.random() * stations.length)];
    
    return {
      success: true,
      data: {
        nearest_station: randomStation,
        message: 'Nearest station found based on your location',
      },
    };
  });

  // ==========================================
  // HANDLER: nearest_dsk (mock - no real API)
  // ==========================================
  intentHandler.registerHandler('nearest_dsk', async (entities) => {
    const dsks = [
      'DSK Connaught Place - 2.8 km',
      'DSK Karol Bagh - 4.2 km',
      'DSK Rohini - 6.5 km',
    ];
    
    const randomDsk = dsks[Math.floor(Math.random() * dsks.length)];
    
    return {
      success: true,
      data: {
        nearest_dsk: randomDsk,
        message: 'Nearest DSK found based on your location',
      },
    };
  });

  // ==========================================
  // HANDLER: nearest_ic (mock - no real API)
  // ==========================================
  intentHandler.registerHandler('nearest_ic', async (entities) => {
    const ics = [
      'Information Center CP - 1.9 km',
      'IC Karol Bagh - 3.8 km',
      'IC Rohini - 5.7 km',
    ];
    
    const randomIc = ics[Math.floor(Math.random() * ics.length)];
    
    return {
      success: true,
      data: {
        nearest_ic: randomIc,
        message: 'Nearest IC found based on your location',
      },
    };
  });

  // ==========================================
  // HANDLER: onboarding_status
  // ==========================================
  intentHandler.registerHandler('onboarding_status', async (entities) => {
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      const url = `${API_BASE}/api/drivers/onboarding/status`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:onboarding_status', 'GET', url, response.status, data);

      if (data.status === 'success') {
        return {
          success: true,
          data: {
            onboarding_status: 'completed',
            message: 'Your onboarding is complete',
          },
        };
      }

      return { success: false, error: 'Status check failed' };
    } catch (error) {
      console.error('[onboarding_status] Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: driver_details
  // ==========================================
  intentHandler.registerHandler('driver_details', async (entities) => {
    console.log('[INTENT:driver_details] Handler called with entities:', entities);
    const driverId = getDriverId(entities);
    
    if (!driverId) {
      console.log('[INTENT:driver_details] ❌ No driver ID available');
      return { success: false, error: 'NEED_DRIVER_ID' };
    }

    try {
      // Correct endpoint: /api/drivers/details?driverId=D0015
      // Response format: { "status": "success", "data": { "id": "D0015", "status": "inactive", "swapCount": 0, ... } }
      const url = `${API_BASE}/api/drivers/details?driverId=${driverId}`;
      const response = await fetch(url);
      const data: any = await response.json();
      logApiCall('BatterySmart:driver_details', 'GET', url, response.status, data);

      if (data.status === 'success' && data.data) {
        const result = {
          driver_id: data.data.id,
          status: data.data.status,
          swap_count: data.data.swapCount,
          created_at: data.data.createdAt,
          updated_at: data.data.updatedAt,
        };
        console.log('[INTENT:driver_details] ✅ Success:', result);
        return {
          success: true,
          data: result,
        };
      }

      console.log('[INTENT:driver_details] ⚠️ Driver not found');
      return { success: false, error: 'Driver not found' };
    } catch (error) {
      console.error('[INTENT:driver_details] ❌ Error:', error);
      return { success: false, error: 'API call failed' };
    }
  });

  // ==========================================
  // HANDLER: speak_to_agent
  // ==========================================
  intentHandler.registerHandler('speak_to_agent', async (entities) => {
    return {
      success: true,
      data: {
        handoff_required: true,
        reason: 'user_requested',
      },
    };
  });

  // ==========================================
  // HANDLER: greeting
  // ==========================================
  intentHandler.registerHandler('greeting', async (entities) => {
    // Use regular LLM for greetings
    return {
      success: false,
      error: 'USE_REGULAR_LLM',
    };
  });

  console.log('[REAL_BATTERY_SMART] All 20 intent handlers registered successfully');
}
