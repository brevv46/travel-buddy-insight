
import { toast } from "sonner";

// API keys
const GEMINI_API_KEY = "AIzaSyA_HPQ5HuPaIEYIV-Z54TxQlSkwkFoO16Y";
const FONNTE_TOKEN = "KmgyNwp1tcUohqfJj5f9";

// Types for our services
export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  wind: number;
}

export interface PlaceRecommendation {
  name: string;
  description: string;
  distance: string;
}

export interface FoodRecommendation {
  name: string;
  description: string;
}

export interface PackingItem {
  item: string;
  essential: boolean;
}

export interface TravelResponse {
  packingList: PackingItem[];
  nearbyPlaces: PlaceRecommendation[];
  localFoods: FoodRecommendation[];
  weatherInfo: WeatherData;
  safetyTips: string[];
  motivationalQuote: string;
}

// Updated Gemini API for generating travel recommendations
export const generateTravelRecommendations = async (destination: string, userLocation: string = ""): Promise<TravelResponse> => {
  try {
    const prompt = `
      Act as a travel advisor AI that provides detailed recommendations for a trip to ${destination}.
      I am currently in ${userLocation || "an unspecified location"}.
      
      Please provide the following in JSON format without any additional text:
      1. A packing list of 5-8 items specific to ${destination} with boolean "essential" property
      2. 3 nearby places to visit within or close to ${destination} with name, description, and approximate distance
      3. 3 local foods to try with name and description
      4. Current weather information (be realistic and specific)
      5. 3-5 safety tips for this location
      6. A short motivational travel quote
      
      Format your response as valid JSON with these keys: packingList, nearbyPlaces, localFoods, weatherInfo, safetyTips, motivationalQuote.
    `;

    // Updated API endpoint to use Gemini 1.5 Pro
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini API response:', data);
      throw new Error('Invalid response from AI service');
    }
    
    const textResponse = data.candidates[0].content.parts[0].text;
    // Extract JSON from the text response (handling potential markdown code blocks)
    const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) || textResponse.match(/```\s*([\s\S]*?)\s*```/) || [null, textResponse];
    const jsonText = jsonMatch[1] || textResponse;
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(jsonText.trim());
    console.log("Successfully parsed travel data:", parsedResponse);
    
    // Send weather notification via WhatsApp
    await sendWeatherNotification(parsedResponse.weatherInfo, destination, parsedResponse.motivationalQuote);
    
    return parsedResponse;
  } catch (error) {
    console.error('Error generating travel recommendations:', error);
    toast.error('Failed to generate travel recommendations. Please try again.');
    throw error;
  }
};

// Function to get the user's current location
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      reject(new Error('Geolocation not supported'));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }
  });
};

// Function to get location name from coordinates
export const getLocationNameFromCoords = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
    const data = await response.json();
    
    let locationName = 'Unknown location';
    if (data && data.display_name) {
      const addressParts = [
        data.address?.city,
        data.address?.town,
        data.address?.county,
        data.address?.state,
        data.address?.country
      ].filter(Boolean);
      
      locationName = addressParts.length > 0 ? addressParts.join(', ') : data.display_name;
    }
    
    return locationName;
  } catch (error) {
    console.error('Error getting location name:', error);
    return 'Unknown location';
  }
};

// Function to send weather notification via WhatsApp using Fonnte API
export const sendWeatherNotification = async (
  weather: WeatherData, 
  destination: string, 
  motivationalQuote: string
): Promise<void> => {
  try {
    // Get the user phone number from localStorage or ask for it
    let userPhone = localStorage.getItem('userPhoneNumber');
    
    if (!userPhone) {
      toast.info('WhatsApp notification requires your phone number');
      return;
    }
    
    // Format the phone number (ensure it starts with country code)
    if (!userPhone.startsWith('+')) {
      userPhone = `+${userPhone}`;
    }
    
    // Create the message for WhatsApp
    const message = `
🌤️ *Weather Update for ${destination}*
Temperature: ${weather.temperature}°C
Condition: ${weather.condition}
Humidity: ${weather.humidity}%
Wind: ${weather.wind} km/h

✨ *Travel Inspiration*
"${motivationalQuote}"

Sent by Travel Buddy Insight
    `.trim();

    // Send the message using Fonnte API
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: userPhone,
        message: message
      })
    });

    const result = await response.json();
    
    if (result.status && result.status === true) {
      toast.success('Weather update sent to your WhatsApp');
    } else {
      throw new Error(result.message || 'Failed to send WhatsApp notification');
    }
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    toast.error('Failed to send WhatsApp notification');
  }
};
