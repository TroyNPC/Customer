// lib/gemini.ts
export async function askGemini(
  message: string,
  conversationHistory?: { role: string; content: string }[]
): Promise<{
  intent: string;
  entities: any;
  response: string;
}> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini API key is missing");
    return {
      intent: "GENERAL",
      entities: {},
      response: "I'm having trouble connecting to my brain right now. Please check your API configuration! 🧠❌"
    };
  }

  // Build context from conversation history
  let contextStr = "";
  if (conversationHistory && conversationHistory.length > 0) {
    const lastMessages = conversationHistory.slice(-3); // Last 3 messages for context
    contextStr =
      "Previous conversation:\n" +
      lastMessages.map((m) => `${m.role}: ${m.content}`).join("\n") +
      "\n\n";
  }

  const prompt = `
${contextStr}You are a laundry assistant AI for a laundry service app. Analyze the user's message and determine their intent.

Available intents:
- CHEAPEST: User wants to find affordable laundry shops (keywords: cheapest, mura, affordable, price, magkano, inexpensive, presyo, cost)
- NEAREST: User wants nearby laundry shops (keywords: near, malapit, kalapit, around me, nearby, located, location)
- SERVICES: User wants to know about available services (keywords: services, offer, available, what do you have, anong meron, what services, offerings)
- ORDER_STATUS: User wants to check their order (keywords: order, status, nasaan, my laundry, ready na ba, where is my, tracking)
- GENERAL: Any other laundry-related question (tips, how to, recommendations, care instructions, stains, etc.)
- OUT_OF_SCOPE: Questions NOT about laundry (weather, news, math, politics, etc.)

IMPORTANT: You MUST respond with ONLY a JSON object, no other text.

Examples:

User: "Saan may murang laundry?"
{
  "intent": "CHEAPEST",
  "entities": {},
  "response": "I'll help you find the most affordable laundry shops! Let me check our database for the best prices near you. 🏷️"
}

User: "Malapit na laundry shop sa may Ayala"
{
  "intent": "NEAREST",
  "entities": {"location": "Ayala"},
  "response": "Finding laundry shops near Ayala for you! 🗺️"
}

User: "Anong services meron sa LaundryWorks?"
{
  "intent": "SERVICES",
  "entities": {"shopName": "LaundryWorks"},
  "response": "Let me check what services LaundryWorks offers! 📋"
}

User: "Status ng order ko"
{
  "intent": "ORDER_STATUS",
  "entities": {},
  "response": "I'll help you check your order status. Could you please provide your order number or the name used for the order? 🔍"
}

User: "Paano mag-alis ng stain sa white na damit?"
{
  "intent": "GENERAL",
  "entities": {"stainType": "general", "fabricType": "white"},
  "response": "Great question about stain removal! For white clothes, you can try using hydrogen peroxide or baking soda. Would you like specific steps for a particular type of stain? 👕"
}

User: "Anong weather ngayon?"
{
  "intent": "OUT_OF_SCOPE",
  "entities": {},
  "response": "I'm specifically designed to help with laundry-related questions! I can help you find laundry shops, check prices, or give laundry care tips. Is there anything laundry-related I can assist you with? 😊"
}

Now analyze this message: "${message}"
`;

  try {
    // Validate message
    if (!message || message.trim().length === 0) {
      return {
        intent: "GENERAL",
        entities: {},
        response: "Hi! How can I help you with your laundry today? 😊"
      };
    }

    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 200,
          },
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    // Check if response is ok
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", response.status, errorData);
      
      // Handle specific HTTP errors
      if (response.status === 429) {
        return {
          intent: "GENERAL",
          entities: {},
          response: "I'm getting too many requests right now. Please try again in a moment! ⏳"
        };
      }
      
      if (response.status === 403 || response.status === 401) {
        return {
          intent: "GENERAL",
          entities: {},
          response: "There's an issue with my API key. Please check your configuration! 🔑"
        };
      }
      
      return {
        intent: "GENERAL",
        entities: {},
        response: "I'm having trouble connecting to my services. Please try again later! 🔄"
      };
    }

    const data = await response.json();
    
    // Check if response has the expected structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("Unexpected Gemini response structure:", data);
      return {
        intent: "GENERAL",
        entities: {},
        response: "I received an unexpected response. Please try asking in a different way! 🤔"
      };
    }

    const text = data.candidates[0].content.parts?.[0]?.text || "";

    // Try to parse JSON from the response
    try {
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate parsed object has required fields
        if (!parsed.intent || !parsed.response) {
          throw new Error("Missing required fields in Gemini response");
        }
        
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse Gemini response:", e);
      console.log("Raw response text:", text);
    }

    // If we can't parse JSON but got text, try to extract intent from text
    if (text.toLowerCase().includes("cheapest") || text.toLowerCase().includes("mura")) {
      return {
        intent: "CHEAPEST",
        entities: {},
        response: text || "I can help you find affordable laundry shops! What area are you in? 🏷️"
      };
    }
    
    if (text.toLowerCase().includes("near") || text.toLowerCase().includes("malapit")) {
      return {
        intent: "NEAREST",
        entities: {},
        response: text || "I'll help you find nearby laundry shops! Where are you located? 🗺️"
      };
    }

    // Fallback with more contextual response based on message length
    if (message.length < 10) {
      return {
        intent: "GENERAL",
        entities: {},
        response: "Hi! I'm your laundry assistant. You can ask me about:\n\n• Finding cheap laundries 🏷️\n• Nearby shops 🗺️\n• Available services 📋\n• Order status 🔍\n• Laundry tips 👕\n\nWhat would you like to know? 😊"
      };
    }

    return {
      intent: "GENERAL",
      entities: {},
      response: "I understand you're asking about laundry. Could you please be more specific? For example:\n\n• 'Find cheap laundry near me'\n• 'What services are available?'\n• 'How do I remove stains?'\n• 'Where's my order?'"
    };
    
  } catch (error: any) {
    console.error("Error in askGemini:", error);
    
    // Handle abort error (timeout)
    if (error.name === 'AbortError') {
      return {
        intent: "GENERAL",
        entities: {},
        response: "The request is taking too long. Please check your internet connection and try again! 🌐"
      };
    }
    
    // Handle network errors
    if (error.message?.includes('Network request failed')) {
      return {
        intent: "GENERAL",
        entities: {},
        response: "I'm having trouble connecting to the internet. Please check your connection and try again! 📡"
      };
    }
    
    return {
      intent: "GENERAL",
      entities: {},
      response: "I'm having technical difficulties. Please try again in a moment! 🔧"
    };
  }
}