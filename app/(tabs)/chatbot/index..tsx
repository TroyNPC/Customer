// app/chatbot/index.tsx
import { View, Text, TextInput, Button, FlatList, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { askGemini } from "../../../lib/gemini";

interface Message {
  role: "user" | "bot";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

export default function Chatbot() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "👋 Hi! I'm your laundry assistant. I can help you with:\n\n• Finding the cheapest laundry shops\n• Locating nearby laundries\n• Checking available services\n• Tracking your order status\n• Answering laundry-related questions\n\nWhat would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions] = useState([
    "What are the cheapest laundries near me?",
    "Show me nearby laundry shops",
    "What services do you offer?",
    "Is my laundry ready?",
    "How much does laundry cost?"
  ]);

  async function handleSendMessage() {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage("");
    
    // Add user message
    setMessages(prev => [...prev, { 
      role: "user", 
      text: userMessage,
      timestamp: new Date() 
    }]);

    // Show typing indicator
    setMessages(prev => [...prev, { 
      role: "bot", 
      text: "...", 
      isTyping: true,
      timestamp: new Date() 
    }]);

    setIsLoading(true);

    try {
      // Get AI response
      const { intent, entities, response: aiResponse } = await askGemini(userMessage);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));

      // Handle different intents
      let botResponse = "";

      switch (intent) {
        case "CHEAPEST":
          botResponse = await handleCheapestQuery(entities);
          break;
        case "NEAREST":
          botResponse = await handleNearestQuery(entities);
          break;
        case "SERVICES":
          botResponse = await handleServicesQuery(entities);
          break;
        case "ORDER_STATUS":
          botResponse = await handleOrderStatusQuery(entities);
          break;
        case "OUT_OF_SCOPE":
          botResponse = aiResponse;
          break;
        default:
          // For GENERAL intent, use Gemini's response but enhance with data if needed
          botResponse = await enhanceGeneralResponse(aiResponse, userMessage);
      }

      // Add bot response
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: botResponse,
        timestamp: new Date() 
      }]);

    } catch (error) {
      console.error("Error:", error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: "😕 I encountered an error. Please try again or rephrase your question.",
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheapestQuery(entities: any) {
    try {
      const { data, error } = await supabase
        .from("shop_services")
        .select(`
          price_per_kg,
          name,
          description,
          shop_branches (
            id,
            name,
            address,
            shops (
              name,
              logo_url
            )
          )
        `)
        .order("price_per_kg", { ascending: true })
        .limit(5);

      if (error) throw error;

      if (!data || data.length === 0) {
        return "I couldn't find any laundry services in our database at the moment. Please check back later! 🏪";
      }

      let response = "🏆 **Here are the most affordable laundries:**\n\n";
      
      data.forEach((service, index) => {
        const branch = service.shop_branches;
        const shop = branch?.shops;
        
        response += `${index + 1}. **${shop?.name}** (${branch?.name})\n`;
        response += `   💰 Only ₱${service.price_per_kg}/kg\n`;
        response += `   📍 ${branch?.address}\n`;
        if (service.description) {
          response += `   ℹ️ ${service.description}\n`;
        }
        response += "\n";
      });

      response += "Would you like more details about any of these? Just ask! 😊";
      
      return response;
    } catch (error) {
      console.error("Error fetching cheapest:", error);
      return "I had trouble finding the cheapest laundries. Please try again in a moment. 🔄";
    }
  }

  async function handleNearestQuery(entities: any) {
    try {
      // For now, just show available branches
      // In a real app, you'd use user's location
      const { data, error } = await supabase
        .from("shop_branches")
        .select(`
          id,
          name,
          address,
          shops (
            name,
            logo_url
          ),
          shop_services (
            price_per_kg
          )
        `)
        .limit(5);

      if (error) throw error;

      if (!data || data.length === 0) {
        return "I couldn't find any laundry shops nearby. 🗺️";
      }

      let response = "📍 **Laundry shops near you:**\n\n";
      
      data.forEach((branch, index) => {
        const shop = branch.shops;
       const validPrices = branch.shop_services
  ?.map(s => s.price_per_kg)
  .filter((price): price is number => price !== null); // Remove nulls and tell TypeScript these are now numbers

const cheapestPrice = validPrices && validPrices.length > 0 
  ? Math.min(...validPrices)  // Now all values are guaranteed to be numbers
  : null;
        response += `${index + 1}. **${shop?.name}** - ${branch.name}\n`;
        response += `   📍 ${branch.address}\n`;
        if (cheapestPrice) {
          response += `   💰 From ₱${cheapestPrice}/kg\n`;
        }
        response += "\n";
      });

      response += "Want to know more about any of these shops? Just ask! 🏪";
      
      return response;
    } catch (error) {
      console.error("Error fetching nearest:", error);
      return "I couldn't find nearby laundries right now. Please try again later. 🔄";
    }
  }

  async function handleServicesQuery(entities: any) {
    const shopName = entities?.shopName;
    
    try {
      let query = supabase
        .from("shop_services")
        .select(`
          name,
          description,
          price_per_kg,
          shop_branches (
            name,
            shops (
              name
            )
          )
        `)
        .limit(10);

      if (shopName) {
        // Filter by shop name if specified
        query = query.ilike('shop_branches.shops.name', `%${shopName}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return shopName 
          ? `I couldn't find any services for ${shopName}. They might not be in our database yet. 🏪`
          : "I couldn't find any laundry services at the moment. 📋";
      }

      // Group by shop
      const servicesByShop: any = {};
      data.forEach(service => {
        const shopKey = service.shop_branches?.shops?.name || "Unknown";
        if (!servicesByShop[shopKey]) {
          servicesByShop[shopKey] = [];
        }
        servicesByShop[shopKey].push(service);
      });

      let response = "📋 **Available Laundry Services:**\n\n";
      
      Object.entries(servicesByShop).forEach(([shopName, services]: [string, any]) => {
        response += `🏪 **${shopName}**\n`;
        services.forEach((service: any) => {
          response += `   • ${service.name}`;
          if (service.price_per_kg) {
            response += ` - ₱${service.price_per_kg}/kg`;
          }
          if (service.description) {
            response += `\n     ${service.description}`;
          }
          response += "\n";
        });
        response += "\n";
      });

      response += "Is there a specific service you're interested in? 😊";
      
      return response;
    } catch (error) {
      console.error("Error fetching services:", error);
      return "I had trouble fetching the services. Please try again. 🔄";
    }
  }

  async function handleOrderStatusQuery(entities: any) {
    // This would need user authentication to work properly
    // For now, return a helpful message
    return "To check your order status, please:\n\n" +
           "1️⃣ Make sure you're logged in\n" +
           "2️⃣ Go to the 'Orders' tab\n" +
           "3️⃣ You can also provide your order number and I'll check!\n\n" +
           "If you have an order number, just type it here and I'll look it up. 🔍";
  }

  async function enhanceGeneralResponse(aiResponse: string, userMessage: string) {
    // Check if the response might benefit from actual data
    const msgLower = userMessage.toLowerCase();
    
    if (msgLower.includes("price") || msgLower.includes("cost") || msgLower.includes("how much")) {
      // Fetch some price data to enhance response
      const { data } = await supabase
        .from("shop_services")
        .select("price_per_kg, name, shop_branches(shops(name))")
        .order("price_per_kg", { ascending: true })
        .limit(3);
      
      if (data && data.length > 0) {
        return aiResponse + "\n\n**Quick price reference:**\n" + 
               data.map(s => `• ${s.shop_branches?.shops?.name}: ₱${s.price_per_kg}/kg`).join("\n");
      }
    }
    
    return aiResponse;
  }

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isTyping) {
      return (
        <View style={{ marginBottom: 15, alignItems: "flex-start" }}>
          <View style={{ 
            padding: 12,
            borderRadius: 16,
            backgroundColor: "#E5E5EA",
            borderBottomLeftRadius: 4,
          }}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        </View>
      );
    }

    return (
      <View style={{ 
        marginBottom: 15,
        alignItems: item.role === "user" ? "flex-end" : "flex-start"
      }}>
        <View style={{ 
          maxWidth: "80%",
          padding: 12,
          borderRadius: 16,
          backgroundColor: item.role === "user" ? "#007AFF" : "#E5E5EA",
          borderBottomRightRadius: item.role === "user" ? 4 : 16,
          borderBottomLeftRadius: item.role === "user" ? 16 : 4,
        }}>
          <Text style={{ 
            color: item.role === "user" ? "white" : "black",
            fontSize: 16,
            lineHeight: 22
          }}>
            {item.text}
          </Text>
          <Text style={{
            fontSize: 10,
            color: item.role === "user" ? "rgba(255,255,255,0.7)" : "#666",
            marginTop: 4,
            alignSelf: "flex-end"
          }}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <View style={{ 
        padding: 20, 
        backgroundColor: "#007AFF",
        alignItems: "center"
      }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
          Laundry Assistant 🤖
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        style={{ flex: 1, padding: 15 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={renderMessage}
      />

      {/* Suggested Questions */}
      {messages.length < 3 && (
        <View style={{ padding: 10 }}>
          <Text style={{ color: "#666", marginBottom: 8 }}>Try asking:</Text>
          <FlatList
            horizontal
            data={suggestedQuestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setMessage(item);
                  handleSendMessage();
                }}
                style={{
                  backgroundColor: "white",
                  paddingHorizontal: 15,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: "#007AFF"
                }}
              >
                <Text style={{ color: "#007AFF" }}>{item}</Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Input Area */}
      <View style={{ 
        padding: 15,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#ddd",
        flexDirection: "row",
        alignItems: "center"
      }}>
        <TextInput
          placeholder="Ask me anything about laundry..."
          value={message}
          onChangeText={setMessage}
          editable={!isLoading}
          multiline
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 25,
            paddingHorizontal: 15,
            paddingVertical: 10,
            maxHeight: 100,
            backgroundColor: "#f8f8f8",
            marginRight: 10
          }}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={isLoading || !message.trim()}
          style={{
            backgroundColor: message.trim() && !isLoading ? "#007AFF" : "#ccc",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 25
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            {isLoading ? "..." : "Send"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}