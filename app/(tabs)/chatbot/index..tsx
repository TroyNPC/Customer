// app/chatbot/index.tsx
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { askGemini } from "../../../lib/gemini";
import { 
  getCheapestLaundries, 
  getNearbyLaundries, 
  getServicesByShop, 
  getUserOrders,
  getOrderStatus,
  getLaundryTips,
  ShopWithDetails
} from "../../../lib/supabase-queries";
import { formatPrice, formatDistance } from "../../../lib/formatHelpers";

// Types
interface Message {
  role: "user" | "bot";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface QueryEntities {
  shopName?: string;
  orderId?: string;
  location?: string;
  [key: string]: any;
}

export default function ChatbotScreen() {
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

  // ============== HANDLER FUNCTIONS ==============

  async function handleCheapestQuery(entities: QueryEntities): Promise<string> {
    try {
      const result = await getCheapestLaundries(5);
      
      if (!result.success || !result.data || result.data.length === 0) {
        return "I couldn't find any laundry services in our database at the moment. Please check back later! 🏪";
      }

      let response = "🏆 **Here are the most affordable laundries:**\n\n";
      
      result.data.forEach((shop: ShopWithDetails, index: number) => {
        response += `${index + 1}. **${shop.name}** (${shop.branchName})\n`;
        response += `   💰 Only ${formatPrice(shop.pricePerKg)}/kg\n`;
        response += `   📍 ${shop.address}\n\n`;
      });

      response += "Would you like more details about any of these? Just ask! 😊";
      
      return response;
    } catch (error) {
      console.error("Error fetching cheapest:", error);
      return "I had trouble finding the cheapest laundries. Please try again in a moment. 🔄";
    }
  }

  async function handleNearestQuery(entities: QueryEntities): Promise<string> {
    try {
      const result = await getNearbyLaundries(undefined, undefined, 5);

      if (!result.success || !result.data || result.data.length === 0) {
        return "I couldn't find any laundry shops nearby. 🗺️";
      }

      let response = "📍 **Laundry shops near you:**\n\n";
      
      result.data.forEach((shop: ShopWithDetails, index: number) => {
        response += `${index + 1}. **${shop.name}** - ${shop.branchName}\n`;
        response += `   📍 ${shop.address}\n`;
        if (shop.distance) {
          response += `   📏 ${formatDistance(shop.distance)}\n`;
        }
        response += `   💰 From ${formatPrice(shop.pricePerKg)}/kg\n\n`;
      });

      response += "Want to know more about any of these shops? Just ask! 🏪";
      
      return response;
    } catch (error) {
      console.error("Error fetching nearest:", error);
      return "I couldn't find nearby laundries right now. Please try again later. 🔄";
    }
  }

  async function handleServicesQuery(entities: QueryEntities): Promise<string> {
    const shopName = entities?.shopName;
    
    try {
      const result = await getServicesByShop(shopName);

      if (!result.success || !result.data || result.data.length === 0) {
        return shopName 
          ? `I couldn't find any services for ${shopName}. They might not be in our database yet. 🏪`
          : "I couldn't find any laundry services at the moment. 📋";
      }

      const servicesByShop: Record<string, any[]> = {};
      result.data.forEach((service: any) => {
        const shopKey = service.shop_branches?.shops?.name || "Unknown";
        if (!servicesByShop[shopKey]) {
          servicesByShop[shopKey] = [];
        }
        servicesByShop[shopKey].push(service);
      });

      let response = "📋 **Available Laundry Services:**\n\n";
      
      Object.entries(servicesByShop).forEach(([shopName, services]: [string, any[]]) => {
        response += `🏪 **${shopName}**\n`;
        services.slice(0, 3).forEach((service: any) => {
          response += `   • ${service.name}`;
          if (service.price_per_kg) {
            response += ` - ${formatPrice(service.price_per_kg)}/kg`;
          }
          response += "\n";
        });
        if (services.length > 3) {
          response += `   • ...and ${services.length - 3} more services\n`;
        }
        response += "\n";
      });

      response += "Is there a specific service you're interested in? 😊";
      
      return response;
    } catch (error) {
      console.error("Error fetching services:", error);
      return "I had trouble fetching the services. Please try again. 🔄";
    }
  }

  async function handleOrderStatusQuery(entities: QueryEntities): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return `🔍 **Order Status Check**

To check your order status, you need to:

1️⃣ **Log in** to your account
2️⃣ **Go to the Orders tab** to see all your orders

Or if you have an order number, just type it here and I'll look it up! 📱

Example format: ORD-2024-001 or #12345`;
      }
      
      const result = await getUserOrders(user.id, 5);
      
      if (!result.success || !result.data || result.data.length === 0) {
        return "You don't have any orders yet. Would you like help finding a laundry shop to get started? 🏪";
      }

      let response = "📋 **Your Recent Orders:**\n\n";
      
      result.data.forEach((order: any, index: number) => {
        response += `${index + 1}. **Order #${order.id.substring(0, 8)}**\n`;
        response += `   🏪 ${order.shopName}\n`;
        response += `   📅 ${new Date(order.createdAt).toLocaleDateString()}\n`;
        response += `   👕 ${order.serviceName}\n`;
        response += `   📍 Status: ${order.status}\n\n`;
      });

      response += "Want details about a specific order? Just tell me the order number! 🔍";
      
      return response;
    } catch (error) {
      console.error("Error checking order:", error);
      return "I had trouble checking your order. Please try again or contact support. 🆘";
    }
  }

  async function handleGeneralQuery(aiResponse: string, userMessage: string, entities: QueryEntities): Promise<string> {
    const msgLower = userMessage.toLowerCase();
    
    if (msgLower.includes("tip") || msgLower.includes("paano") || msgLower.includes("how to")) {
      const topic = msgLower.includes("stain") ? "stain" : 
                    msgLower.includes("white") ? "white" :
                    msgLower.includes("color") ? "color" : "general";
      
      const tips = await getLaundryTips(topic);
      
      if (tips.success && tips.data) {
        let tipResponse = "🧺 **Laundry Tips:**\n\n";
        tips.data.forEach((tip: string, i: number) => {
          tipResponse += `${i + 1}. ${tip}\n`;
        });
        return tipResponse + "\n" + aiResponse;
      }
    }
    
    if (msgLower.includes("price") || msgLower.includes("cost") || msgLower.includes("magkano")) {
      const prices = await getCheapestLaundries(3);
      if (prices.success && prices.data) {
        return aiResponse + "\n\n**Quick price reference:**\n" + 
               prices.data.map((s: ShopWithDetails) => `• ${s.name}: ${formatPrice(s.pricePerKg)}/kg`).join("\n");
      }
    }
    
    return aiResponse;
  }

  async function handleSendMessage() {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    
    setMessages(prev => [...prev, { 
      role: "user", 
      text: userMessage,
      timestamp: new Date() 
    }]);

    setMessages(prev => [...prev, { 
      role: "bot", 
      text: "...", 
      isTyping: true,
      timestamp: new Date() 
    }]);

    setIsLoading(true);

    try {
      const recentHistory = messages.slice(-4).map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text
      }));

      const { intent, entities, response: aiResponse } = await askGemini(userMessage, recentHistory);
      
      setMessages(prev => prev.filter(msg => !msg.isTyping));

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
        case "GENERAL":
          botResponse = await handleGeneralQuery(aiResponse, userMessage, entities);
          break;
        case "OUT_OF_SCOPE":
          botResponse = aiResponse;
          break;
        default:
          botResponse = aiResponse;
      }

      setMessages(prev => [...prev, { 
        role: "bot", 
        text: botResponse,
        timestamp: new Date() 
      }]);

    } catch (error) {
      console.error("Error:", error);
      
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