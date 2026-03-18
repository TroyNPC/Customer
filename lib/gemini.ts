// lib/gemini.ts
export async function askGemini(message: string): Promise<{
  intent: string;
  entities: any;
  response: string;
}> {
  const msgLower = message.toLowerCase();
  
  // Still keep keyword fallback for common queries
  if (msgLower.includes("cheapest") || msgLower.includes("lowest price") || msgLower.includes("murang")) 
    return { intent: "CHEAPEST", entities: {}, response: "" };
  if (msgLower.includes("near") || msgLower.includes("malapit") || msgLower.includes("kalapit"))
    return { intent: "NEAREST", entities: {}, response: "" };
  if (msgLower.includes("laundry") || msgLower.includes("labahan"))
    return { intent: "SHOW_LAUNDRY", entities: {}, response: "" };
  if (msgLower.includes("service") || msgLower.includes("offer") || msgLower.includes("what do you have"))
    return { intent: "SERVICES", entities: {}, response: "" };
  if (msgLower.includes("ongoing") || msgLower.includes("my order") || msgLower.includes("status"))
    return { intent: "ORDER_STATUS", entities: {}, response: "" };

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is not configured");

  const conversationalPrompt = `
You are a friendly laundry assistant chatbot for a laundry service app. Your role is to help users with their laundry needs.

Available actions you can help with:
- Finding cheapest laundry shops
- Finding nearby laundry shops  
- Checking available services at laundry shops
- Checking order status (if user asks about their ongoing laundry)
- General questions about laundry services

For ANY question that is NOT about laundry, laundry shops, or laundry services, respond with: "I'm specifically designed to help with laundry-related questions. For other concerns, please contact our support team."

For laundry-related questions, respond naturally but identify what the user wants. Format your response as JSON:
{
  "intent": "CHEAPEST" | "NEAREST" | "SERVICES" | "ORDER_STATUS" | "GENERAL",
  "entities": {
    // Extract relevant info like location, shop name, etc.
    "location": "extracted location if any",
    "shopName": "extracted shop name if any",
    "orderId": "extracted order ID if any"
  },
  "response": "Your natural, friendly response to the user"
}

Examples:
User: "Where can I find cheap laundry?"
{"intent": "CHEAPEST", "entities": {}, "response": "I'll help you find the most affordable laundry shops in your area!"}

User: "Is my laundry done yet?"
{"intent": "ORDER_STATUS", "entities": {}, "response": "Let me check the status of your laundry for you."}

User: "What services does LaundryMart offer?"
{"intent": "SERVICES", "entities": {"shopName": "LaundryMart"}, "response": "I'll check what services LaundryMart has available!"}

User: "What's the weather today?"
{"intent": "OUT_OF_SCOPE", "entities": {}, "response": "I'm specifically designed to help with laundry-related questions. For other concerns, please contact our support team."}

User: "${message}"
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: conversationalPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Try to parse JSON from the response
    try {
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse Gemini response:", e);
    }

    // Fallback
    return {
      intent: "GENERAL",
      entities: {},
      response: text || "How can I help you with your laundry today?"
    };
  } catch (error) {
    console.error("Error in askGemini:", error);
    return {
      intent: "UNKNOWN",
      entities: {},
      response: "I'm having trouble understanding. Could you please rephrase that?"
    };
  }
}