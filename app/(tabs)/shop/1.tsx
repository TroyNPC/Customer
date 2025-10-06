import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const vbW = 1440;
const vbH = 320;

export default function Shop1() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Svg
          width={screenWidth}
          height={screenHeight * 0.4}
          viewBox={`0 0 ${vbW} ${vbH}`}
          style={styles.waveTop}
          preserveAspectRatio="none"
        >
          <Path
            fill="#3864C3"
            d={`
              M0,${vbH * 0.2}
              C ${vbW * 0.5},${vbH * -0.1} ${vbW * 0.45},${vbH * 0.6} ${vbW},${vbH * 0.2}
              L${vbW},0
              L0,0
              Z
            `}
          />
        </Svg>

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push("/map")}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>(BRAND) LAUNDRY SHOP</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>
            
      <ScrollView
        style={{ flex: 1, backgroundColor: "#D9D9D966" }}
        bounces={false}             // iOS: disables bounce
        overScrollMode="never"      // Android: disables overscroll glow + bounce
        alwaysBounceVertical={false} // iOS: make sure no vertical bounce
        showsVerticalScrollIndicator={true} // optional, just UI preference
      >

         <View
  style={{
    backgroundColor: "#D4F6F9",
    borderRadius: 0,        // full-width like your screenshot
    padding: 15,
    marginTop: 0,           // sits flush under header
    flexDirection: "row",
    alignItems: "center",
  }}
>
  {/* Left side: Text */}
  <View style={{ flex: 1 }}>
    <Text
      style={{
        fontSize: 16,
        fontWeight: "bold",
        color: "#000000",
        marginBottom: 6,
      }}
    >
      Laundry Shop Information
    </Text>
    <Text
      style={{
        fontSize: 13,
        color: "#333333",
        marginBottom: 12,
      }}
    >
      This is a Laundry Shop where Pick-up and Delivery are available, tailored
      to the services you choose.
    </Text>

    {/* Buttons row */}
    <View style={{ flexDirection: "row" }}>
      <TouchableOpacity
        style={{
          backgroundColor: "#193ABC",
          borderRadius: 20,
          paddingVertical: 8,
          paddingHorizontal: 15,
          marginRight: 10,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontWeight: "bold",
            fontSize: 13,
          }}
        >
          Learn More
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: "#193ABC",
          borderRadius: 20,
          paddingVertical: 8,
          paddingHorizontal: 15,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontWeight: "bold",
            fontSize: 13,
          }}
        >
          Rating & Reviews
        </Text>
      </TouchableOpacity>
    </View>
  </View>

  {/* Right side: Logo */}
  <Image
    source={{
      uri: "https://i.ibb.co/3shhNns/laundry-logo.png",
    }}
    style={{
      width: 80,
      height: 80,
      marginLeft: 10,
      borderRadius: 40,
    }}
    resizeMode="contain"
  />
</View>


        
        <View
          style={{
            backgroundColor: "#3864C3",
            paddingVertical: 15,
            marginBottom: 22,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: "bold",
              marginLeft: 60,
            }}
          >
          
            {"Available Laundry Services\n"}
          </Text>
        </View>

        {/* ✅ All Your Service Cards Start Here */}
          
           {/* --- Wash Only + Dry Only (Inserted at top) --- */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 11,
            marginHorizontal: 42,
          }}
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: 13,
              paddingTop: 28,
              paddingBottom: 15,
              paddingHorizontal: 3,
              marginRight: 6,
              

            }}
          >
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/4428d013-0638-4b6a-8b5f-30e52387319f",
              }}
              resizeMode={"stretch"}
              style={{
                width: 65,
                height: 66,
                marginBottom: 11,
              }}
            />
            <Text
              style={{
                color: "#092B75",
                fontSize: 15,
                fontWeight: "bold",
                marginBottom: 4,
              }}
            >
              {"Wash Only"}
            </Text>
            <Text
              style={{
                color: "#092B75",
                fontSize: 11,
                textAlign: "center",
                marginBottom: 19,
                width: 146,
              }}
            >
              {
                "This Laundry Service for the usual laundry such as towels, rugs, and sheets"
              }
            </Text>
            <View
              style={{
                backgroundColor: "#09ADFF",
                borderRadius: 4,
                paddingVertical: 4,
                marginBottom: 10,
                marginHorizontal: 6,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginHorizontal: 3,
                }}
              >
                {"This includes Wash + Dry + In a Bag"}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#3864C3",
                borderRadius: 4,
                paddingVertical: 5,
                marginHorizontal: 4,
              }}
            >
            <TouchableOpacity
              style={{
                alignItems: "center",
                backgroundColor: "#3864C3",
                borderRadius: 4,
                paddingVertical: 1,
                paddingHorizontal: 10,
              }}
              onPress={() => router.push("shop/Pages/Washonly")}
            >
             <Text style={{ color: "#FFFFFF", fontSize: 14 }}>
                {"Price Per KG: ₱ 45 "}
              </Text>
            </TouchableOpacity>
            </View>
          
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 13,
              paddingTop: 28,
              paddingBottom: 15,
            }}
          >
            <View
              style={{
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Image
                source={{
                  uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5ad4f214-42f0-4003-a4b7-fdaa819dd8e8",
                }}
                resizeMode={"stretch"}
                style={{
                  width: 65,
                  height: 65,
                }}
              />
            </View>
            <Text
              style={{
                color: "#092B75",
                fontSize: 15,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 4,
                marginHorizontal: 48,
              }}
            >
              {"Dry Only"}
            </Text>
            <Text
              style={{
                color: "#092B75",
                fontSize: 11,
                textAlign: "center",
                marginBottom: 31,
                marginHorizontal: 13,
                    minWidth: 130, // ✅ keeps both boxes the same width
              maxWidth: 130, // ✅ avoids one being longer than the other
              }}
            >
              {"This Laundry Service is for delicate fabrics clothes"}
            </Text>
            <View
              style={{
                alignItems: "center",
                backgroundColor: "#09ADFF",
                borderRadius: 4,
                paddingVertical: 3,
                marginBottom: 10,
                marginHorizontal: 14,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {"Dry Cleaning + Ironing + Hangers"}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                alignItems: "center",
                backgroundColor: "#3864C3",
                borderRadius: 4,
                paddingVertical: 1,
                marginHorizontal: 10,
                
              }}
              onPress={() => router.push("shop/Pages/Dryonly")}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                }}
              >
                {"Price Per KG: ₱45"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Row 1: Wash, Dry & Fold / Iron Only */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 15,
            marginHorizontal: 42,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 13,
              paddingVertical: 23,
              marginRight: 6,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 13 }}>
              <Image
                source={{
                  uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/1887029d-96aa-465b-b8b3-9973d47238d8",
                }}
                resizeMode="stretch"
                style={{ width: 65, height: 66 }}
              />
            </View>
            <Text
              style={{
                color: "#092B75",
                fontSize: 15,
                fontWeight: "bold",
                marginBottom: 5,
                marginLeft: 20,
              }}
            >
              {"Wash, Dry & Fold"}
            </Text>
            <Text
              style={{
                color: "#092B75",
                fontSize: 11,
                textAlign: "center",
                marginBottom: 20,
                marginHorizontal: 12,
              }}
            >
              {"This Laundry Services is for the usual laundry but with Drying & Folding"}
            </Text>
            <View
              style={{
                backgroundColor: "#09ADFF",
                borderRadius: 4,
                paddingVertical: 2,
                marginBottom: 10,
                marginHorizontal: 14,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginHorizontal: 1,
                }}
              >
                {"Wash + Dry + Iron + Fold + Hanger"}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                alignItems: "center",
                backgroundColor: "#3864C3",
                borderRadius: 4,
                paddingVertical: 8,
                marginHorizontal: 7,
              }}
              onPress={() => router.push("shop/Pages/Washdryfold")}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14 }}>
                {"Price Per KG: ₱30"}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 13,
              paddingVertical: 24,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 13 }}>
              <Image
                source={{
                  uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/0a392eb9-7103-4c0d-b1be-0bfc186d0043",
                }}
                resizeMode="stretch"
                style={{ width: 65, height: 65 }}
              />
            </View>
            <Text
              style={{
                color: "#092B75",
                fontSize: 15,
                fontWeight: "bold",
                marginBottom: 13,
                marginLeft: 53,
              }}
            >
              {"Iron Only"}
            </Text>
            <Text
              style={{
                color: "#092B75",
                fontSize: 11,
                textAlign: "center",
                marginBottom: 27,
                marginHorizontal: 13,
              }}
            >
              {"This Laundry Services is for the items that are already clean"}
            </Text>
            <View style={{ marginBottom: 10, marginHorizontal: 12 }}>
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: "#09ADFF",
                  borderRadius: 4,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold", alignContent: "center", textAlign: "center",}}
                >
                  {"Dry Cleaning, Ironing & Hangers"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{
                alignItems: "center",
                backgroundColor: "#3864C3",
                borderRadius: 4,
                paddingVertical: 8,
                marginHorizontal: 8,
              }}
              onPress={() => router.push("shop/Pages/Irononly")}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14 }}>
                {"Price Per KG: ₱75"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Bulk Laundry / Fold Only */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 19,
            marginHorizontal: 40,
          }}
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: 13,
              paddingTop: 27,
              paddingBottom: 16,
              paddingHorizontal: 9,
              marginRight: 6,
            }}
          >
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/e64a5b17-4e6c-4fbc-b5f0-d06d32ad248b",
              }}
              resizeMode="stretch"
              style={{ width: 65, height: 65, marginBottom: 9 }}
            />
            <Text
              style={{
                color: "#092B75",
                fontSize: 15,
                fontWeight: "bold",
                marginBottom: 10,
              }}
            >
              {"Bulk Laundry"}
            </Text>
            <Text
              style={{
                color: "#092B75",
                fontSize: 11,
                textAlign: "center",
                marginBottom: 18,
              }}
            >
              {"This Laundry Services is Standard bulk washing for everyday clothes."}
            </Text>
            <View
              style={{
                backgroundColor: "#09ADFF",
                borderRadius: 4,
                paddingVertical: 3,
                marginBottom: 8,
                marginHorizontal: 3,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginHorizontal: 1,
                }}
              >
                {"Wash + Dry + Iron + Fold + Hanger"}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                alignItems: "center",
                backgroundColor: "#3864C3",
                borderRadius: 4,
                paddingVertical: 9,
              }}
              onPress={() => router.push("shop/Pages/Bulk")}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14 }}>
                {"Price Per KG: ₱45"}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 13,
              paddingTop: 27,
              paddingBottom: 15,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 13 }}>
              <Image
                source={{
                  uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/dae2b417-e99a-4c50-9f5a-924a5ceabe7a",
                }}
                resizeMode="stretch"
                style={{ width: 65, height: 65 }}
              />
            </View>
            <Text
              style={{
                color: "#092B75",
                fontSize: 15,
                fontWeight: "bold",
                marginBottom: 4,
                marginLeft: 52,
              }}
            >
              {"Fold Only"}
            </Text>
            <Text
              style={{
                color: "#092B75",
                fontSize: 12,
                textAlign: "center",
                marginBottom: 19,
                marginHorizontal: 13,
              }}
            >
              {"Folding Service for Laundries That are already done"}
            </Text>
            <View
              style={{
                backgroundColor: "#09ADFF",
                borderRadius: 4,
                paddingVertical: 2,
                marginBottom: 10,
                marginHorizontal: 22,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginHorizontal: 2,
                }}
              >
                {"Ironing + Hangers"}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                alignItems: "center",
                backgroundColor: "#3864C3",
                borderRadius: 4,
                paddingVertical: 8,
                marginHorizontal: 8,
              }}
              onPress={() => router.push("shop/Pages/Foldonly")}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14 }}>
                {"Price Per KG: ₱45"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 3: Dry & Fold Single */}
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#FFFFFF",
            borderRadius: 13,
            paddingVertical: 23,
            marginBottom: 41,
            marginLeft: 37,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 11 }}>
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/e300e31a-2a3f-4e3f-aead-a0126378df9f",
              }}
              resizeMode="stretch"
              style={{ width: 65, height: 65 }}
            />
          </View>
          <Text
            style={{
              color: "#092B75",
              fontSize: 15,
              fontWeight: "bold",
              marginBottom: 10,
              marginLeft: 44,
            }}
          >
            {"Dry & Fold"}
          </Text>
          <Text
            style={{
              color: "#092B75",
              fontSize: 11,
              textAlign: "center",
              marginBottom: 32,
              marginHorizontal: 12,
              width: 153,
            }}
          >
            {"This Laundry Service for Drying & Folding Cleaned Clothes "}
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#09ADFF",
              borderRadius: 4,
              paddingVertical: 4,
              paddingHorizontal: 1,
              marginBottom: 12,
              marginHorizontal: 25,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              {"Wash + Dry +  Fold + Hanger"}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#3864C3",
              borderRadius: 4,
              paddingVertical: 7,
              paddingHorizontal: 28,
              marginHorizontal: 7,
            }}
            onPress={() => router.push("shop/Pages/Dry&Fold")}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
              }}
            >
              {"Price Per KG: ₱25"}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  headerBox: {
    width: "100%",
    height: screenHeight * 0.15,
    backgroundColor: "#0AADFF",
    paddingTop: screenHeight * 0.05,
    justifyContent: "center",
    overflow: "hidden",
  },
  waveTop: { position: "absolute", top: 0, left: 0, zIndex: 1 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
});
