# Battery Smart Voicebot - Conversation Design

## 📞 Sample Dialogues (Hindi + English Code-Switching)

This document showcases realistic conversation flows for each Tier-1 use case with natural Hinglish (Hindi + English mix).

---

## 🔄 Use Case 1: Swap History Lookup + Invoice Explanation

### Scenario 1.1: Simple Swap History Request

```
🤖 Bot: Namaste! Main Battery Smart voice assistant hoon. Aapki kya madad kar sakti hoon?

👤 Driver: Mera swap history dikhao

🤖 Bot: Aapne pichle mahine 24 battery swaps kiye hain. Last swap kal Connaught 
        Place station pe 10:30 AM ko hua tha.

👤 Driver: Aur pichle hafte kitni baar kiya?

🤖 Bot: Pichle hafte aapne 6 swaps kiye. Sabse zyada swaps Monday aur Tuesday ko hue.

👤 Driver: Theek hai, thank you

🤖 Bot: Koi aur help chahiye aapko?

👤 Driver: Nahi bas

🤖 Bot: Theek hai! Aapke liye hamesha available hoon. Safe driving!

✅ RESOLVED - No handoff needed
```

### Scenario 1.2: Invoice Explanation with Confusion

```
🤖 Bot: Namaste! Main Battery Smart assistant hoon. Kaise madad karun?

👤 Driver: Mere bill mein 500 rupees kyu charge kiya hai?

🤖 Bot: Aapka bill dekh rahi hoon... Yeh 500 rupees aapke 10 battery swaps ka charge 
        hai. Har swap 50 rupees ka hai, to total 10 swaps ka 500 rupees hua.

👤 Driver: Par main to sirf 8 baar gaya tha station pe

🤖 Bot: Ek minute... Checking your records... Aapne 30th January ko 2 swaps kiye the - 
        ek subah 9 AM pe aur dusra shaam 4 PM pe. Total 10 swaps hi hain.

👤 Driver: Haan haan yaad aaya, do baar gaya tha us din. Accha theek hai

🤖 Bot: Koi problem nahi! Invoice ka breakdown maine SMS kar diya hai aapko. 
        Kuch aur poochhna hai?

👤 Driver: Nahi thanks

✅ RESOLVED - Driver satisfied after clarification
```

### Scenario 1.3: Complaint about Wrong Charge (Handoff)

```
🤖 Bot: Namaste! Kaise help kar sakti hoon?

👤 Driver: Yaar mujhe galat charge kar diya hai bill mein

🤖 Bot: Sorry to hear that. Invoice details batayein?

👤 Driver: Invoice number INV-2026-001, usme 942 rupees show ho raha hai but main 
        to only 8 swaps kiya

🤖 Bot: Dekhti hoon... According to records, aapne 10 swaps kiye hain with GST total 
        942 rupees.

👤 Driver: [FRUSTRATED] Nahi nahi! Yeh galat hai! Mujhe 8 hi baar yaad hai

[SENTIMENT: Negative (-0.7), Emotion: Frustrated]
[CONFIDENCE: 0.9 - Intent clear but dispute detected]

🤖 Bot: I understand aap upset hain. Main aapko abhi hamare executive se connect 
        karti hoon jo aapki invoice detail se check karenge. Ek minute rukiye.

🚨 WARM HANDOFF TRIGGERED
Reason: complaint + negative_sentiment
Priority: HIGH

--- AGENT SEES ---
📋 Handoff Summary:
- Driver: DRV12345 (Rajesh Kumar, +91-9876543210)
- Issue: Dispute over invoice INV-2026-001 (claims 8 swaps but system shows 10)
- Sentiment: Negative, frustrated
- Last query: "Nahi nahi! Yeh galat hai!"
- Action needed: Verify swap history, check if system error, offer refund if incorrect
- Priority: HIGH ⚠️

👨 Agent: Hello Rajesh ji, main Amit bol raha hoon. Maine aapki problem dekhi hai. 
         Aapke invoice ko main abhi detail mein check karta hoon...
```

---

## 🗺️ Use Case 2: Nearest Station + Availability

### Scenario 2.1: Finding Nearest Station

```
🤖 Bot: Hi! Battery Smart assistant here. Kaise help karun?

👤 Driver: Mere paas battery station kahan hai?

🤖 Bot: Aap abhi kahan hain? Area batayein?

👤 Driver: Connaught Place ke paas hoon

🤖 Bot: Perfect! Sabse paas Connaught Place Battery Station hai, sirf 2.3 km door. 
        Yeh 24x7 khula rehta hai. Directions SMS kar doon?

👤 Driver: Haan kar do

🤖 Bot: Done! Google Maps link aapke phone pe aa gaya hai. Aur kuch chahiye?

👤 Driver: Nahi thanks

✅ RESOLVED
```

### Scenario 2.2: Real-time Availability Check

```
🤖 Bot: Hello! Kaise help kar sakti hoon?

👤 Driver: CP station pe battery available hai abhi?

🤖 Bot: Haan bilkul! Connaught Place station pe abhi 15 fully charged batteries 
        available hain. Wait time 0-5 minutes hai. Aap abhi aa sakte hain.

👤 Driver: Station timing kya hai?

🤖 Bot: Connaught Place station 24x7 open hai. Kabhi bhi aa sakte hain aap.

👤 Driver: Okay perfect, aa raha hoon

🤖 Bot: Great! Safe driving!

✅ RESOLVED
```

### Scenario 2.3: Multiple Station Check (Edge Case)

```
🤖 Bot: Namaste! Battery Smart assistant. Kya help chahiye?

👤 Driver: Station dikhaao

🤖 Bot: Kaunsa area mein station chahiye? Aapka location batayein?

👤 Driver: South Delhi mein koi station hai kya?

🤖 Bot: Haan! South Delhi mein 3 stations hain:
        1. Hauz Khas Station - 1.5 km door
        2. Saket Station - 3.2 km door  
        3. Nehru Place Station - 4.1 km door
        
        Sabse paas Hauz Khas hai. Wahan ki details chahiye?

👤 Driver: Haan Hauz Khas ka address do

🤖 Bot: Hauz Khas station ka address: Hauz Khas Metro Station ke paas, Main Road. 
        Google Maps link SMS kar diya hai. Abhi 12 batteries available hain.

👤 Driver: Thank you!

✅ RESOLVED
```

### Scenario 2.4: Station Closed (Handoff Trigger)

```
🤖 Bot: Hello! Kaise help karun?

👤 Driver: Nehru Place station khula hai kya?

🤖 Bot: Checking... Nehru Place station abhi maintenance ke liye temporarily closed hai. 
        Nearest alternative Lajpat Nagar station hai, 2.8 km door.

👤 Driver: [ANNOYED] Yeh to har baar hi closed rehta hai! Bahut problem hai!

[SENTIMENT: Negative (-0.8), Emotion: Annoyed]

🤖 Bot: I'm sorry aapko inconvenience ho rahi hai. Main aapko hamare support executive 
        se connect karti hoon jo Nehru Place station ki exact reopening date batayenge.

🚨 WARM HANDOFF - Negative sentiment detected
Priority: MEDIUM
```

---

## 💳 Use Case 3: Subscription Plans

### Scenario 3.1: Check Validity

```
🤖 Bot: Namaste! Battery Smart assistant. Kaise help karun?

👤 Driver: Mera plan kab tak valid hai?

🤖 Bot: Aapka Gold Monthly plan aaj 31st January ko expire ho raha hai. Aapne is month 
        25 swaps use kiye hain, 5 swaps aur baaki hain aaj ke liye.

👤 Driver: Kal se kya hoga?

🤖 Bot: Agar aap renew nahi karenge to kal se per-swap charges lagenge - 75 rupees 
        per swap. Plan renew karne se 50 rupees per swap hi lagega. Renew karein?

👤 Driver: Haan karna hai, kaise karun?

🤖 Bot: Maine aapko renewal link SMS kar diya hai. 299 rupees pay karke instantly 
        renew ho jayega. UPI, card ya net banking se pay kar sakte hain.

👤 Driver: Okay karleta hoon

✅ RESOLVED
```

### Scenario 3.2: Plan Comparison

```
🤖 Bot: Hi! Kaise help karun?

👤 Driver: Mujhe plan lena hai, kaunsa plan accha hai?

🤖 Bot: Aapko kitne swaps chahiye monthly? Ya daily kitni rides karte hain?

👤 Driver: Har din 3-4 rides karta hoon, to lagbhag 25-30 swaps monthly

🤖 Bot: Aapke liye Gold Monthly plan perfect hai - 299 rupees mein 30 swaps milenge. 
        Basic plan mein sirf 15 swaps hain. Gold mein priority service bhi milegi.

👤 Driver: Gold mein kya benefits hain?

🤖 Bot: Gold plan mein:
        - 30 battery swaps (worth 2250 if paid per swap)
        - Priority service - no waiting
        - 24x7 phone support
        - Auto renewal option
        
        Total savings: 1950 rupees!

👤 Driver: Theek hai Gold hi le leta hoon

🤖 Bot: Perfect choice! Payment link SMS kar diya hai. Kuch aur help chahiye?

✅ RESOLVED - Successful upsell!
```

### Scenario 3.3: Plan Renewal Failed (Handoff)

```
🤖 Bot: Namaste! Kaise help karun?

👤 Driver: Mere plan ka payment nahi ho raha

🤖 Bot: Payment link pe ja kar try kiya?

👤 Driver: Haan yaar, 3 baar try kiya. Card decline ho raha hai

🤖 Bot: Sorry for the trouble. Aapke card mein sufficient balance hai?

👤 Driver: [FRUSTRATED] Haan hai! Dusre transactions to ho rahe hain. Sirf yahan 
        problem aa rahi hai!

[SENTIMENT: Negative (-0.6), Emotion: Frustrated]
[FAILED_ATTEMPTS: 3 - Payment gateway issue]

🤖 Bot: I understand. Yeh technical issue lag raha hai. Main aapko payment team se 
        connect kar rahi hoon jo manually activate kar denge aapka plan. Ek minute.

🚨 WARM HANDOFF
Reason: failed_attempts + negative_sentiment
Priority: HIGH
```

---

## 🏖️ Use Case 4: Leave Information + DSK

### Scenario 4.1: Leave Application Process

```
🤖 Bot: Hello! Battery Smart assistant. Kya help chahiye?

👤 Driver: Leave kaise apply karte hain?

🤖 Bot: Leave apply karne ke liye aapko paas ke DSK office jaana hoga. Aapke paas 
        abhi 5 casual leaves aur 3 sick leaves available hain.

👤 Driver: Documents kya chahiye?

🤖 Bot: Driver ID card chahiye. Agar sick leave hai to medical certificate bhi. 
        Form DSK pe mil jayega, wahan fill karke supervisor approval leni hogi.

👤 Driver: Kitne din mein activate hoga?

🤖 Bot: Leave application ke 24 hours mein activate ho jayegi. DSK ka address chahiye?

👤 Driver: Haan batao

🤖 Bot: Aap kahan se hain? City batayein?

👤 Driver: Delhi, Karol Bagh area

🤖 Bot: Karol Bagh DSK address: Office No. 12, Main Road, Karol Bagh. Monday se 
        Saturday 9 AM se 6 PM tak khula hai. Directions SMS kar doon?

👤 Driver: Haan please

✅ RESOLVED
```

### Scenario 4.2: Emergency Leave (Fast Track)

```
🤖 Bot: Namaste! Kaise help kar sakti hoon?

👤 Driver: Mujhe urgent leave chahiye, ghar pe emergency hai

🤖 Bot: Oh no! Sorry to hear that. Emergency leave ke liye aap DSK pe jakar immediately 
        apply kar sakte hain. Ya supervisor ko directly call bhi kar sakte hain.

👤 Driver: Supervisor ka number hai?

🤖 Bot: Supervisor contact details aapki ID card pe likha hai. Ya DSK ka helpline hai: 
        1800-XXX-XXXX. Wahan baat karke emergency approval le sakte hain phone pe hi.

👤 Driver: Theek hai, thank you

🤖 Bot: I hope sab theek ho jaye. Take care!

✅ RESOLVED
```

### Scenario 4.3: DSK Location Confusion (Multi-turn)

```
🤖 Bot: Hi! Battery Smart assistant. Kaise help karun?

👤 Driver: DSK ka address batao

🤖 Bot: Aapka location batayein? Kahan se hain aap?

👤 Driver: Rohini

🤖 Bot: Rohini DSK ka address: Sector 15, Rohini, opposite Metro Station. Yeh 
        sabse paas aapke liye.

👤 Driver: Yeh Sunday ko khula rahega kya?

🤖 Bot: Nahi, DSK Sunday ko band rehta hai. Monday se Saturday 9 AM to 6 PM tak open hai.

👤 Driver: [ANNOYED] To kal kaise jaun? Mujhe kal hi leave activate karni hai!

[SENTIMENT: Negative (-0.5), Emotion: Worried]

🤖 Bot: Emergency hai kya? Agar urgent hai to helpline pe call kar sakte hain - 
        1800-XXX-XXXX. Weekend pe bhi emergency support available hai.

👤 Driver: Haan emergency hi hai

🤖 Bot: Theek hai, main aapko emergency support team se connect karti hoon jo help 
        karenge. Ek minute please.

🚨 WARM HANDOFF
Reason: user_requested (implicit - urgent help needed)
Priority: MEDIUM
```

---

## 😠 Edge Cases & Frustration Loops

### Edge Case 1: Frustration Loop (Same Question 3x)

```
🤖 Bot: Namaste! Kaise help karun?

👤 Driver: Battery station batao

🤖 Bot: Aapka area kya hai?

👤 Driver: Delhi

🤖 Bot: Delhi mein 20+ stations hain. Kaunsa area specifically? Connaught Place, 
        Karol Bagh, Rohini...?

👤 Driver: Paas wala station batao na

🤖 Bot: Aapka exact location chahiye. GPS on hai? Ya area name batayein?

👤 Driver: [FRUSTRATED] Arrey yaar! Main puchh raha hoon station kahan hai!

[FRUSTRATION_LOOP: Same intent 3x]
[SENTIMENT: Negative (-0.7)]

🤖 Bot: I understand aap confused hain. Main aapko hamare support executive se 
        connect kar rahi hoon jo aapki exact location ke base pe station batayenge.

🚨 WARM HANDOFF
Reason: frustration_loop + negative_sentiment
Priority: MEDIUM
```

### Edge Case 2: Complaint (Immediate Handoff)

```
🤖 Bot: Hello! Battery Smart assistant. Kya help chahiye?

👤 Driver: Complaint karna hai mujhe

🤖 Bot: Sorry to hear that. Kya problem hai batayein?

👤 Driver: Station pe battery nahi mili, pura time waste ho gaya mera

[INTENT: Complaint detected]
[AUTO-HANDOFF: complaint = immediate escalation]

🤖 Bot: I'm very sorry aapko yeh problem face karni padi. Main aapko abhi senior 
        executive se connect kar rahi hoon jo is issue ko immediately resolve karenge.

🚨 WARM HANDOFF (IMMEDIATE)
Reason: complaint
Priority: URGENT ⚠️
```

### Edge Case 3: Background Noise (Low Confidence)

```
🤖 Bot: Hello! Kaise help karun?

👤 Driver: [TRUCK NOISE] ...station... availability... [HONKING]

[STT Result: "station ability" - Garbled]
[CONFIDENCE: 0.2 - Very low]

🤖 Bot: Sorry, thoda awaaz nahi aa rahi. Background mein bahut shor hai. Thoda 
        dhire boliye ya quiet jagah pe jakar baat karein?

👤 Driver: [STILL NOISY] ...battery... Nehru Place...

[CONFIDENCE: 0.35 - Still low]

🤖 Bot: Fir se samajh nahi aaya clearly. Agar urgent hai to main aapko agent se 
        connect kar deti hoon jo phone pe baat karenge?

👤 Driver: Haan kar do

🚨 WARM HANDOFF
Reason: low_confidence (unable to understand due to noise)
Priority: LOW
```

### Edge Case 4: Abusive Language (Immediate Handoff)

```
🤖 Bot: Namaste! Kaise help karun?

👤 Driver: [USES ABUSIVE LANGUAGE] ...tumhari service bahut bekaar hai...

[SENTIMENT: Very Negative (-0.95)]
[EMOTION: Very Angry]
[AUTO-ESCALATE: Extreme negativity]

🤖 Bot: Main aapko abhi senior executive se connect kar rahi hoon. Ek minute.

🚨 WARM HANDOFF (IMMEDIATE)
Reason: negative_sentiment (extreme)
Priority: URGENT ⚠️

Agent Briefing: "User is extremely upset. Handle with empathy. Offer compensation if needed."
```

---

## 🎯 Success Patterns

### Pattern 1: Quick Resolution
```
Duration: < 30 seconds
User Query → Intent Detection → API Call → Response → Done
Example: "Station availability check karo" → Response in 15 seconds
```

### Pattern 2: Multi-turn Clarification
```
Duration: 30-60 seconds
User → Clarifying Question → User Answer → Resolution
Example: "Station batao" → "Kaunsa area?" → "CP" → "CP station address..."
```

### Pattern 3: Upsell Success
```
User: "Plan batao"
Bot: Suggests best plan based on usage
User: "Okay kar deta hoon"
Result: Revenue + Happy customer
```

---

## 📊 Conversation Metrics to Track

1. **Average Conversation Length**
   - Target: < 60 seconds for bot resolution
   - Target: < 3 minutes if handed to agent

2. **Clarification Questions**
   - Target: < 2 clarifying questions per conversation

3. **User Interruptions**
   - If user interrupts bot mid-response = Too long response

4. **Positive Sentiment at End**
   - Target: > 70% conversations end with neutral/positive sentiment

5. **Repeat Queries**
   - Same user calling again for same issue within 24hrs = Bot failed

---

## 💡 Design Principles

1. **Keep It Short**: 1-2 sentences max per bot response
2. **Natural Hinglish**: Mix Hindi and English naturally
3. **Empathy First**: Acknowledge frustration before solving
4. **Confirm Understanding**: Repeat key details back to user
5. **Offer Alternatives**: If solution A fails, suggest B
6. **Know When to Handoff**: Don't frustrate user with loops
7. **End Positively**: "Safe driving!" / "Take care!"

---

## ✅ Conversation Quality Checklist

- [ ] Bot response < 15 words (ideal: 10-12 words)
- [ ] Natural Hinglish (not literal translation)
- [ ] No technical jargon
- [ ] Actionable (user knows what to do next)
- [ ] Empathetic tone when user frustrated
- [ ] Offers next steps clearly
- [ ] Handoff is smooth (not abrupt)

---

**Conversation design complete!** These real-world dialogues showcase how the bot handles various scenarios in natural Hinglish.
