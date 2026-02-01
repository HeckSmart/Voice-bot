import { IntentDefinition } from '../services/intentClassifier';
import { IntentHandler } from '../services/intentHandler';

/**
 * Battery Smart Tier-1 Driver/Rider Support Intents
 * 
 * Use Cases:
 * 1. Swap history lookup + invoice explanation
 * 2. Nearest Battery Smart station + real-time availability
 * 3. Subscription plan validity + renewals + pricing clarification
 * 4. Leave information + nearest DSK for activation
 */

export const batterySmart_Tier1_Intents: IntentDefinition[] = [
  // ==========================================
  // USE CASE 1: Swap History + Invoice
  // ==========================================
  {
    name: 'swap_history_lookup',
    description: 'Check battery swap history and transaction details',
    examples: [
      'mera swap history dikhao',
      'kitne swap kiye maine',
      'pichle hafte kitni baar battery swap ki',
      'last 5 swaps ka record chahiye',
      'swap history batao',
      'battery kitni baar change ki maine',
      'show my swap history',
      'mere transactions dekho',
    ],
    entitySchema: {
      time_period: 'string', // "last_week", "last_month", "yesterday"
      count: 'number', // number of records to show
      driver_id: 'string',
    },
  },
  {
    name: 'invoice_explanation',
    description: 'Explain invoice details, charges, and billing breakdown',
    examples: [
      'invoice ka matlab kya hai',
      'bill mein yeh charge kya hai',
      'mujhe 500 rupees kyu charge kiye',
      'invoice samjhao',
      'bill ka breakdown chahiye',
      'yeh amount kis liye hai',
      'invoice details batao',
      'billing explain karo',
      'bill mein discrepancy hai',
      'extra charge kyu laga',
    ],
    entitySchema: {
      invoice_id: 'string',
      charge_type: 'string',
      driver_id: 'string',
    },
  },

  // ==========================================
  // USE CASE 2: Station Location + Availability
  // ==========================================
  {
    name: 'find_nearest_station',
    description: 'Find nearest Battery Smart station with directions',
    examples: [
      'mere paas battery station kahan hai',
      'nearest station batao',
      'station ka address kya hai',
      'battery swap kahan karun',
      'paas mein station hai kya',
      'nearest battery smart station',
      'station location chahiye',
      'kahan jaun battery ke liye',
      'address batao station ka',
      'swap station kahan hai mere area mein',
    ],
    entitySchema: {
      current_location: 'string',
      city: 'string',
      area: 'string',
      driver_id: 'string',
    },
  },
  {
    name: 'check_station_availability',
    description: 'Check real-time battery availability at station',
    examples: [
      'station pe battery available hai kya',
      'abhi battery milegi kya',
      'battery stock check karo',
      'station khula hai kya',
      'availability dekho',
      'battery hai station pe',
      'real time availability batao',
      'abhi jaun to battery milegi',
      'station operational hai',
      'slot available hai kya',
    ],
    entitySchema: {
      station_id: 'string',
      station_name: 'string',
      driver_id: 'string',
    },
  },

  // ==========================================
  // USE CASE 3: Subscription Plans
  // ==========================================
  {
    name: 'check_subscription_validity',
    description: 'Check subscription plan status, expiry, and validity',
    examples: [
      'mera plan kab tak valid hai',
      'subscription kab expire hoga',
      'plan ka status kya hai',
      'validity check karo',
      'mera plan active hai kya',
      'subscription kab khatam hoga',
      'plan ki details batao',
      'expiry date kya hai',
      'plan status dekho',
      'subscription details chahiye',
    ],
    entitySchema: {
      driver_id: 'string',
      plan_type: 'string',
    },
  },
  {
    name: 'subscription_renewal',
    description: 'Renew subscription plan or get renewal information',
    examples: [
      'plan renew karna hai',
      'subscription renew kaise karun',
      'plan extend karo',
      'renewal ka process kya hai',
      'plan ko renew kar do',
      'subscription badhaani hai',
      'renewal link bhejo',
      'kaise renew karun',
      'auto renewal hai kya',
      'renewal charges kitne hain',
    ],
    entitySchema: {
      driver_id: 'string',
      plan_type: 'string',
    },
  },
  {
    name: 'subscription_pricing',
    description: 'Get subscription plan pricing and comparison',
    examples: [
      'plan ka price kya hai',
      'kitne mein plan milega',
      'pricing batao',
      'kaunsa plan sasta hai',
      'monthly plan ka cost kya hai',
      'plans compare karo',
      'pricing details chahiye',
      'kitne paise lagenge',
      'plans ka difference batao',
      'cost breakdown do',
    ],
    entitySchema: {
      plan_type: 'string',
      duration: 'string', // "monthly", "quarterly", "yearly"
      driver_id: 'string',
    },
  },

  // ==========================================
  // USE CASE 4: Leave Information + DSK
  // ==========================================
  {
    name: 'leave_information',
    description: 'Get information about applying for leave',
    examples: [
      'leave kaise apply karun',
      'chutti chahiye mujhe',
      'leave ka process kya hai',
      'off lena hai',
      'leave apply karna hai',
      'chutti kaise milegi',
      'leave request kaise karun',
      'holidays ke bare mein batao',
      'off days kaise lu',
      'leave policy kya hai',
    ],
    entitySchema: {
      leave_type: 'string', // "sick", "casual", "emergency"
      start_date: 'string',
      end_date: 'string',
      driver_id: 'string',
    },
  },
  {
    name: 'find_nearest_dsk',
    description: 'Find nearest DSK (Driver Service Kendra) for leave activation',
    examples: [
      'DSK kahan hai',
      'nearest DSK batao',
      'leave activate kahan se karun',
      'driver service kendra kahan hai',
      'DSK ka address do',
      'paas mein DSK hai kya',
      'leave ke liye kahan jaun',
      'DSK location chahiye',
      'kendra kahan hai',
      'office kahan hai tumhara',
    ],
    entitySchema: {
      current_location: 'string',
      city: 'string',
      area: 'string',
      driver_id: 'string',
    },
  },

  // ==========================================
  // SUPPORT & ESCALATION INTENTS
  // ==========================================
  {
    name: 'speak_to_agent',
    description: 'User explicitly wants to talk to human agent',
    examples: [
      'agent se baat karni hai',
      'human se connect karo',
      'kisi insaan se baat karani hai',
      'executive se milao',
      'call transfer karo',
      'customer care se connect karo',
      'agent chahiye',
      'bot nahi insaan chahiye',
      'human support do',
      'escalate karo',
    ],
    entitySchema: {
      reason: 'string',
      driver_id: 'string',
    },
  },
  {
    name: 'general_greeting',
    description: 'Greetings and general conversation',
    examples: [
      'hello',
      'hi',
      'namaste',
      'kaise ho',
      'good morning',
      'hey',
      'haan bolo',
      'suno',
    ],
    entitySchema: {},
  },
  {
    name: 'complaint',
    description: 'User has a complaint or issue',
    examples: [
      'complaint hai mujhe',
      'issue hai',
      'problem hai',
      'galat charge laga hai',
      'station pe battery nahi mili',
      'service kharab hai',
      'complain karna hai',
      'bahut problem ho rahi hai',
      'dissatisfied hoon',
      'not happy with service',
    ],
    entitySchema: {
      complaint_type: 'string',
      description: 'string',
      driver_id: 'string',
    },
  },
];

/**
 * Register all Battery Smart Tier-1 intent handlers
 * Replace mock responses with actual API calls to your backend
 */
export function registerBatterySmartHandlers(intentHandler: IntentHandler) {
  // ==========================================
  // HANDLER 1: Swap History Lookup
  // ==========================================
  intentHandler.registerHandler('swap_history_lookup', async (entities) => {
    console.log('[SWAP_HISTORY] Fetching swap history for:', entities);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${process.env.BATTERY_SMART_API}/swaps/history`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.API_TOKEN}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     driver_id: entities.driver_id || getCurrentDriverId(),
      //     time_period: entities.time_period || 'last_month',
      //     limit: entities.count || 10,
      //   }),
      // });
      // const data = await response.json();

      // Mock response
      const mockData = {
        driver_id: entities.driver_id || 'DRV12345',
        total_swaps: 24,
        period: entities.time_period || 'last_month',
        recent_swaps: [
          {
            swap_id: 'SWP001',
            date: '2026-01-30',
            time: '10:30 AM',
            station: 'Connaught Place Station',
            battery_number: 'BAT-7890',
            amount: 50,
          },
          {
            swap_id: 'SWP002',
            date: '2026-01-29',
            time: '03:15 PM',
            station: 'Karol Bagh Station',
            battery_number: 'BAT-1234',
            amount: 50,
          },
          {
            swap_id: 'SWP003',
            date: '2026-01-28',
            time: '09:00 AM',
            station: 'Rohini Station',
            battery_number: 'BAT-5678',
            amount: 50,
          },
        ],
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error('[SWAP_HISTORY] Error:', error);
      return {
        success: false,
        error: 'Unable to fetch swap history at the moment',
      };
    }
  });

  // ==========================================
  // HANDLER 2: Invoice Explanation
  // ==========================================
  intentHandler.registerHandler('invoice_explanation', async (entities) => {
    console.log('[INVOICE] Fetching invoice details for:', entities);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${process.env.BATTERY_SMART_API}/invoices/${entities.invoice_id}`);

      // Mock response
      const mockData = {
        invoice_id: entities.invoice_id || 'INV-2026-001',
        driver_id: entities.driver_id || 'DRV12345',
        date: '2026-01-25',
        breakdown: [
          { item: 'Battery Swaps (10x)', amount: 500, per_unit: 50 },
          { item: 'Subscription Fee', amount: 299, per_unit: 299 },
          { item: 'GST (18%)', amount: 143.82, per_unit: null },
        ],
        total: 942.82,
        payment_status: 'Paid',
        payment_date: '2026-01-26',
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error('[INVOICE] Error:', error);
      return {
        success: false,
        error: 'Unable to fetch invoice details',
      };
    }
  });

  // ==========================================
  // HANDLER 3: Find Nearest Station
  // ==========================================
  intentHandler.registerHandler('find_nearest_station', async (entities) => {
    console.log('[STATION_FIND] Finding nearest station for:', entities);

    try {
      // TODO: Replace with actual geolocation API
      // const response = await fetch(`${process.env.BATTERY_SMART_API}/stations/nearest`, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     lat: entities.latitude,
      //     lng: entities.longitude,
      //     city: entities.city,
      //   }),
      // });

      // Mock response
      const mockData = {
        station_name: 'Connaught Place Battery Station',
        station_id: 'STN001',
        address: 'Block A, Connaught Place, New Delhi - 110001',
        distance: 2.3, // km
        open_now: true,
        operating_hours: '24x7',
        contact: '+91-9876543210',
        directions_link: 'https://maps.google.com/?q=28.6304,77.2177',
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error('[STATION_FIND] Error:', error);
      return {
        success: false,
        error: 'Unable to find nearest station',
      };
    }
  });

  // ==========================================
  // HANDLER 4: Check Station Availability
  // ==========================================
  intentHandler.registerHandler('check_station_availability', async (entities) => {
    console.log('[STATION_AVAILABILITY] Checking availability for:', entities);

    try {
      // TODO: Replace with real-time availability API
      // const response = await fetch(`${process.env.BATTERY_SMART_API}/stations/${entities.station_id}/availability`);

      // Mock response
      const mockData = {
        station_name: entities.station_name || 'Connaught Place Station',
        station_id: entities.station_id || 'STN001',
        available_batteries: 15,
        total_capacity: 20,
        status: 'operational',
        wait_time: '0-5 mins',
        last_updated: new Date().toISOString(),
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error('[STATION_AVAILABILITY] Error:', error);
      return {
        success: false,
        error: 'Unable to check station availability',
      };
    }
  });

  // ==========================================
  // HANDLER 5: Check Subscription Validity
  // ==========================================
  intentHandler.registerHandler('check_subscription_validity', async (entities) => {
    console.log('[SUBSCRIPTION_CHECK] Checking subscription for:', entities);

    try {
      // TODO: Replace with actual subscription API
      // const response = await fetch(`${process.env.BATTERY_SMART_API}/subscriptions/${driver_id}`);

      // Mock response
      const mockData = {
        driver_id: entities.driver_id || 'DRV12345',
        plan_name: 'Gold Monthly Plan',
        plan_type: 'monthly',
        status: 'active',
        start_date: '2026-01-01',
        expiry_date: '2026-01-31',
        days_remaining: 0,
        swaps_remaining: 5,
        swaps_used: 25,
        auto_renewal: true,
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error('[SUBSCRIPTION_CHECK] Error:', error);
      return {
        success: false,
        error: 'Unable to check subscription status',
      };
    }
  });

  // ==========================================
  // HANDLER 6: Subscription Renewal
  // ==========================================
  intentHandler.registerHandler('subscription_renewal', async (entities) => {
    console.log('[SUBSCRIPTION_RENEWAL] Processing renewal for:', entities);

    try {
      // TODO: Replace with actual renewal API
      // const response = await fetch(`${process.env.BATTERY_SMART_API}/subscriptions/renew`, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     driver_id: entities.driver_id,
      //     plan_type: entities.plan_type,
      //   }),
      // });

      // Mock response
      const mockData = {
        renewal_link: 'https://batteryswap.in/renew/DRV12345',
        plan_name: 'Gold Monthly Plan',
        renewal_amount: 299,
        validity: '30 days',
        benefits: ['Unlimited swaps', 'Priority service', '24x7 support'],
        payment_methods: ['UPI', 'Card', 'Net Banking'],
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error('[SUBSCRIPTION_RENEWAL] Error:', error);
      return {
        success: false,
        error: 'Unable to process renewal',
      };
    }
  });

  // ==========================================
  // HANDLER 7: Subscription Pricing
  // ==========================================
  intentHandler.registerHandler('subscription_pricing', async (entities) => {
    console.log('[SUBSCRIPTION_PRICING] Fetching pricing for:', entities);

    try {
      // TODO: Replace with actual pricing API
      // const response = await fetch(`${process.env.BATTERY_SMART_API}/plans/pricing`);

      // Mock response
      const mockData = {
        plans: [
          {
            name: 'Basic Monthly',
            price: 199,
            duration: 'monthly',
            swaps_included: 15,
            features: ['15 swaps/month', 'Standard support'],
          },
          {
            name: 'Gold Monthly',
            price: 299,
            duration: 'monthly',
            swaps_included: 30,
            features: ['30 swaps/month', 'Priority support', 'No wait time'],
          },
          {
            name: 'Premium Monthly',
            price: 499,
            duration: 'monthly',
            swaps_included: 'unlimited',
            features: ['Unlimited swaps', '24x7 priority support', 'Home delivery'],
          },
        ],
        recommended: 'Gold Monthly',
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error('[SUBSCRIPTION_PRICING] Error:', error);
      return {
        success: false,
        error: 'Unable to fetch pricing information',
      };
    }
  });

  // ==========================================
  // HANDLER 8: Leave Information
  // ==========================================
  intentHandler.registerHandler('leave_information', async (entities) => {
    console.log('[LEAVE_INFO] Fetching leave information for:', entities);

    try {
      // TODO: Replace with actual leave management API
      // const response = await fetch(`${process.env.BATTERY_SMART_API}/leave/info`);

      // Mock response
      const mockData = {
        leave_balance: {
          casual: 5,
          sick: 3,
          emergency: 2,
        },
        how_to_apply: [
          'Visit nearest DSK',
          'Submit leave form',
          'Get supervisor approval',
          'Activation within 24 hours',
        ],
        documents_required: ['Driver ID', 'Medical certificate (for sick leave)'],
        contact: 'DSK helpline: 1800-XXX-XXXX',
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error('[LEAVE_INFO] Error:', error);
      return {
        success: false,
        error: 'Unable to fetch leave information',
      };
    }
  });

  // ==========================================
  // HANDLER 9: Find Nearest DSK
  // ==========================================
  intentHandler.registerHandler('find_nearest_dsk', async (entities) => {
    console.log('[DSK_FIND] Finding nearest DSK for:', entities);

    try {
      // TODO: Replace with actual DSK location API
      // const response = await fetch(`${process.env.BATTERY_SMART_API}/dsk/nearest`);

      // Mock response
      const mockData = {
        dsk_name: 'Battery Smart DSK - Connaught Place',
        dsk_id: 'DSK001',
        address: 'Office No. 5, Block B, Connaught Place, New Delhi - 110001',
        distance: 3.5, // km
        open_now: true,
        operating_hours: '9:00 AM - 6:00 PM (Mon-Sat)',
        contact: '+91-9876543210',
        services: ['Leave activation', 'ID renewal', 'Account support'],
        directions_link: 'https://maps.google.com/?q=28.6304,77.2177',
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error('[DSK_FIND] Error:', error);
      return {
        success: false,
        error: 'Unable to find nearest DSK',
      };
    }
  });

  // ==========================================
  // HANDLER 10: Speak to Agent (Warm Handoff Trigger)
  // ==========================================
  intentHandler.registerHandler('speak_to_agent', async (entities) => {
    console.log('[AGENT_HANDOFF] User requested human agent:', entities);

    // This will trigger warm handoff
    return {
      success: true,
      data: {
        handoff_required: true,
        reason: 'user_requested',
        driver_id: entities.driver_id,
        escalation_note: entities.reason || 'User requested to speak with human agent',
      },
    };
  });

  // ==========================================
  // HANDLER 11: General Greeting
  // ==========================================
  intentHandler.registerHandler('general_greeting', async (entities) => {
    console.log('[GREETING] General greeting detected');

    // Use regular LLM for greetings
    return {
      success: false,
      error: 'USE_REGULAR_LLM',
    };
  });

  // ==========================================
  // HANDLER 12: Complaint
  // ==========================================
  intentHandler.registerHandler('complaint', async (entities) => {
    console.log('[COMPLAINT] Complaint registered:', entities);

    try {
      // TODO: Log complaint to CRM/Jarvis system
      // const response = await fetch(`${process.env.BATTERY_SMART_API}/complaints`, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     driver_id: entities.driver_id,
      //     complaint_type: entities.complaint_type,
      //     description: entities.description,
      //   }),
      // });

      // Mock response - trigger warm handoff for complaints
      return {
        success: true,
        data: {
          handoff_required: true,
          reason: 'complaint_logged',
          complaint_id: 'CMP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          driver_id: entities.driver_id,
          escalation_note: `Complaint: ${entities.complaint_type || 'General complaint'}`,
        },
      };
    } catch (error) {
      console.error('[COMPLAINT] Error:', error);
      return {
        success: false,
        error: 'Unable to log complaint',
      };
    }
  });

  console.log('[BATTERY_SMART] All Tier-1 intent handlers registered successfully');
}
