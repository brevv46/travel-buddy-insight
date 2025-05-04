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
      Bertindaklah sebagai asisten perjalanan yang memberikan rekomendasi terperinci untuk perjalanan ke ${destination}.
      Saya saat ini berada di ${userLocation || "lokasi yang belum ditentukan"}.
      
      Berikan informasi berikut dalam format JSON tanpa teks tambahan:
      1. Daftar barang yang perlu dibawa (5-8 item) khusus untuk ${destination} dengan properti "essential" boolean
      2. 3 tempat terdekat yang bisa dikunjungi di atau dekat dengan ${destination} dengan nama, deskripsi, dan perkiraan jarak
      3. 3 makanan lokal yang harus dicoba dengan nama dan deskripsi
      4. Informasi cuaca saat ini (yang realistis dan spesifik)
      5. 3-5 tips keamanan untuk lokasi ini
      6. Kutipan motivasi perjalanan yang pendek
      
      Format respons Anda sebagai JSON yang valid dengan kunci: packingList, nearbyPlaces, localFoods, weatherInfo, safetyTips, motivationalQuote.
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
      console.error('Respons API Gemini tidak valid:', data);
      throw new Error('Respons tidak valid dari layanan AI');
    }
    
    const textResponse = data.candidates[0].content.parts[0].text;
    // Extract JSON from the text response (handling potential markdown code blocks)
    const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) || textResponse.match(/```\s*([\s\S]*?)\s*```/) || [null, textResponse];
    const jsonText = jsonMatch[1] || textResponse;
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(jsonText.trim());
    console.log("Berhasil memproses data perjalanan:", parsedResponse);
    
    // Send weather notification via WhatsApp
    await sendWeatherNotification(parsedResponse.weatherInfo, destination, parsedResponse.motivationalQuote);
    
    return parsedResponse;
  } catch (error) {
    console.error('Error generating travel recommendations:', error);
    toast.error('Gagal menghasilkan rekomendasi perjalanan. Silakan coba lagi.');
    throw error;
  }
};

// Fungsi baru untuk menghasilkan respons terhadap pertanyaan sederhana
export const generateSimpleResponse = async (question: string): Promise<string> => {
  try {
    // Cek pertanyaan untuk pola umum
    if (question.toLowerCase().includes('lapar') || question.toLowerCase().includes('makan')) {
      return "Maaf, saya adalah asisten perjalanan dan hanya bisa membantu Anda dengan informasi tentang destinasi wisata. Saya tidak bisa merekomendasikan restoran atau makanan secara spesifik kecuali untuk destinasi wisata. Mohon tanyakan tentang tempat wisata yang ingin Anda kunjungi.";
    }
    
    // Untuk pertanyaan umum lainnya
    const prompt = `
      Kamu adalah asisten perjalanan. Jawablah pertanyaan berikut dengan singkat dan jelas. 
      Jika pertanyaan tidak terkait dengan perjalanan atau pariwisata, jelaskan bahwa kamu hanya bisa membantu dengan informasi perjalanan.
      
      Pertanyaan: ${question}
    `;

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
          temperature: 0.2,
          maxOutputTokens: 200
        }
      })
    });

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Respons API Gemini tidak valid:', data);
      return "Maaf, saya adalah asisten perjalanan wisata. Saya hanya dapat memberikan informasi tentang tempat wisata. Silakan tanyakan pada saya tentang destinasi wisata yang ingin Anda kunjungi.";
    }
    
    return data.candidates[0].content.parts[0].text;
    
  } catch (error) {
    console.error('Error generating simple response:', error);
    return "Maaf, saya tidak dapat memproses pertanyaan Anda saat ini. Saya adalah asisten perjalanan dan dapat membantu Anda dengan rekomendasi destinasi wisata.";
  }
};

// Function to get the user's current location
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      toast.error('Geolokasi tidak didukung oleh browser Anda');
      reject(new Error('Geolocation tidak didukung'));
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
    
    let locationName = 'Lokasi tidak diketahui';
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
    console.error('Error mendapatkan nama lokasi:', error);
    return 'Lokasi tidak diketahui';
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
      toast.info('Notifikasi WhatsApp memerlukan nomor telepon Anda');
      return;
    }
    
    // Format the phone number (ensure it starts with country code)
    if (!userPhone.startsWith('+')) {
      userPhone = `+${userPhone}`;
    }
    
    // Create the message for WhatsApp
    const message = `
      🌡️ *Info Cuaca untuk ${destination}*
      Suhu: ${weather.temperature}°C
      Kondisi: ${weather.condition}
      Kelembaban: ${weather.humidity}%
      Angin: ${weather.wind} km/h
      
      ✨ *Inspirasi Perjalanan*
      "${motivationalQuote}"
      
      Dikirim oleh Travel Buddy Insight
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
      toast.success('Info cuaca telah dikirim ke WhatsApp Anda');
    } else {
      throw new Error(result.message || 'Gagal mengirim notifikasi WhatsApp');
    }
  } catch (error) {
    console.error('Error mengirim notifikasi WhatsApp:', error);
    toast.error('Gagal mengirim notifikasi WhatsApp');
  }
};
