import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  MapPin, 
  Search, 
  Send, 
  Compass, 
  CalendarCheck, 
  Clock, 
  Bell, 
  Info, 
  CheckCircle 
} from 'lucide-react';
import { 
  generateTravelRecommendations, 
  getCurrentLocation, 
  getLocationNameFromCoords, 
  TravelResponse,
  generateSimpleResponse 
} from '@/services/apiService';
import { generateMockTravelData } from '@/services/mockData';

// Define message types
type MessageType = 'user' | 'bot' | 'loading';

interface Message {
  id: string;
  type: MessageType;
  text: string;
  travelData?: TravelResponse;
}

// Daftar kata kunci terkait travel untuk filter pertanyaan
const TRAVEL_KEYWORDS = [
  'pergi', 'jalan', 'wisata', 'liburan', 'travel', 'pantai', 'gunung', 'danau', 'kota', 
  'tempat', 'destinasi', 'trip', 'berlibur', 'berwisata', 'mengunjungi', 'kunjungi',
  'pulau', 'taman', 'resor', 'hotel', 'penginapan', 'tiket'
];

// Initial welcome message from the bot
const initialMessages: Message[] = [
  {
    id: 'welcome',
    type: 'bot',
    text: 'Hai! Selamat datang di Travel Buddy Insight! 👋\n\nKemana kamu ingin pergi hari ini? Beri tahu saya destinasi yang ingin kamu kunjungi, dan saya akan memberikan tips perjalanan, tempat-tempat terdekat yang menarik, makanan lokal yang wajib dicoba, serta informasi cuaca terkini.'
  }
];

// Phone number collection modal
const PhoneNumberModal: React.FC<{
  isOpen: boolean;
  onClose: (phoneNumber?: string) => void;
}> = ({ isOpen, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Masukkan Nomor WhatsApp</h2>
        <p className="text-gray-600 mb-4">
          Untuk menerima notifikasi cuaca dan tips perjalanan di WhatsApp, silakan masukkan nomor WhatsApp Anda (dengan kode negara).
        </p>
        <Input 
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Contoh: 628123456789"
          className="mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onClose()}
          >
            Nanti saja
          </Button>
          <Button
            onClick={() => onClose(phoneNumber)}
            disabled={!phoneNumber}
          >
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
};

// TravelCard component for displaying travel recommendations
const TravelCard: React.FC<{ travelData: TravelResponse; destination: string }> = ({ travelData, destination }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mt-2">
      <div className="p-4 bg-travel-primary text-white">
        <h3 className="text-lg font-bold flex items-center">
          <MapPin className="mr-2" size={18} />
          Informasi Perjalanan: {destination}
        </h3>
      </div>
      
      <div className="p-4">
        {/* Weather Information */}
        <div className="mb-4 p-4 bg-travel-light rounded-lg">
          <h4 className="font-semibold text-travel-dark flex items-center mb-2">
            <CalendarCheck className="mr-2" size={16} /> 
            Informasi Cuaca
          </h4>
          <div className="flex flex-wrap items-center">
            <div className="w-full sm:w-1/2">
              <p className="text-2xl font-bold">{travelData.weatherInfo.temperature}°C</p>
              <p>{travelData.weatherInfo.condition}</p>
            </div>
            <div className="w-full sm:w-1/2 mt-2 sm:mt-0">
              <p className="text-sm">Kelembaban: {travelData.weatherInfo.humidity}%</p>
              <p className="text-sm">Angin: {travelData.weatherInfo.wind} km/h</p>
            </div>
          </div>
        </div>
        
        {/* Packing List */}
        <div className="mb-4">
          <h4 className="font-semibold text-travel-dark flex items-center mb-2">
            <CheckCircle className="mr-2" size={16} />
            Yang Perlu Dibawa
          </h4>
          <ul className="pl-6 list-disc">
            {travelData.packingList.map((item, index) => (
              <li key={index} className={item.essential ? "font-medium" : ""}>
                {item.item} {item.essential && <span className="text-travel-primary text-sm">(wajib)</span>}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Nearby Places */}
        <div className="mb-4">
          <h4 className="font-semibold text-travel-dark flex items-center mb-2">
            <Compass className="mr-2" size={16} />
            Tempat Terdekat untuk Dikunjungi
          </h4>
          {travelData.nearbyPlaces.map((place, index) => (
            <div key={index} className="mb-2 pb-2 border-b last:border-b-0">
              <p className="font-medium">{place.name} <span className="text-travel-primary font-normal">({place.distance})</span></p>
              <p className="text-sm text-gray-600">{place.description}</p>
            </div>
          ))}
        </div>
        
        {/* Local Foods */}
        <div className="mb-4">
          <h4 className="font-semibold text-travel-dark flex items-center mb-2">
            <Clock className="mr-2" size={16} />
            Makanan Lokal yang Wajib Dicoba
          </h4>
          {travelData.localFoods.map((food, index) => (
            <div key={index} className="mb-2 pb-2 border-b last:border-b-0">
              <p className="font-medium">{food.name}</p>
              <p className="text-sm text-gray-600">{food.description}</p>
            </div>
          ))}
        </div>
        
        {/* Safety Tips */}
        <div className="mb-2">
          <h4 className="font-semibold text-travel-dark flex items-center mb-2">
            <Info className="mr-2" size={16} />
            Tips Keamanan
          </h4>
          <ul className="pl-6 list-disc">
            {travelData.safetyTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
        
        {/* Motivational Quote */}
        <div className="mt-4 pt-4 border-t text-center italic text-travel-primary">
          "{travelData.motivationalQuote}"
        </div>
      </div>
    </div>
  );
};

// Loading indicator component
const TypingIndicator: React.FC = () => (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

// Main chatbot component
const TravelChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [currentDestination, setCurrentDestination] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fungsi untuk memeriksa apakah input terkait perjalanan
  const isTravelRelatedQuery = (input: string): boolean => {
    input = input.toLowerCase();
    return TRAVEL_KEYWORDS.some(keyword => input.includes(keyword.toLowerCase()));
  };

  // Get user's location on component mount
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const position = await getCurrentLocation();
        const locationName = await getLocationNameFromCoords(
          position.coords.latitude,
          position.coords.longitude
        );
        setUserLocation(locationName);
        console.log('Lokasi pengguna:', locationName);
      } catch (error) {
        console.error('Error mendapatkan lokasi pengguna:', error);
        toast.error('Tidak dapat mengakses lokasi Anda. Beberapa fitur mungkin terbatas.');
      }
    };
    
    getUserLocation();
    
    // Check if we have the user's phone number
    const phoneNumber = localStorage.getItem('userPhoneNumber');
    if (!phoneNumber) {
      // Show phone number modal after a brief delay
      setTimeout(() => setShowPhoneModal(true), 2000);
    }
  }, []);

  // Scroll to bottom of messages on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePhoneNumberSubmit = (phoneNumber?: string) => {
    if (phoneNumber) {
      localStorage.setItem('userPhoneNumber', phoneNumber);
      toast.success('Nomor WhatsApp berhasil disimpan!');
    }
    setShowPhoneModal(false);
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const userInput = inputValue.trim();
    if (!userInput) return;
    
    const userMessageId = Date.now().toString();
    
    // Add user message to the chat
    setMessages(prev => [
      ...prev,
      {
        id: userMessageId,
        type: 'user',
        text: userInput
      }
    ]);
    
    // Clear input and set loading state
    setInputValue('');
    setIsLoading(true);
    
    // Add loading indicator
    setMessages(prev => [
      ...prev,
      {
        id: 'loading',
        type: 'loading',
        text: ''
      }
    ]);
    
    try {
      // Cek apakah pertanyaan terkait perjalanan atau bukan
      if (isTravelRelatedQuery(userInput)) {
        setCurrentDestination(userInput);
        
        // Ini adalah pertanyaan terkait perjalanan, lanjutkan dengan respon travel
        let travelData: TravelResponse;
        try {
          travelData = await generateTravelRecommendations(userInput, userLocation);
        } catch (error) {
          console.error('Kesalahan API, menggunakan data mock:', error);
          // Fallback to mock data if API fails
          travelData = generateMockTravelData(userInput);
        }
        
        // Remove loading indicator and add bot response
        setMessages(prev => 
          prev.filter(msg => msg.id !== 'loading').concat({
            id: `bot-${Date.now()}`,
            type: 'bot',
            text: `Berikut informasi perjalanan untuk ${userInput}:`,
            travelData
          })
        );
      } else {
        // Ini bukan pertanyaan terkait perjalanan, berikan jawaban sederhana atau minta klarifikasi
        const simpleResponse = await generateSimpleResponse(userInput);
        
        // Remove loading indicator and add bot response
        setMessages(prev => 
          prev.filter(msg => msg.id !== 'loading').concat({
            id: `bot-${Date.now()}`,
            type: 'bot',
            text: simpleResponse
          })
        );
      }
    } catch (error) {
      console.error('Kesalahan memproses pesan:', error);
      
      // Remove loading indicator and add error message
      setMessages(prev => 
        prev.filter(msg => msg.id !== 'loading').concat({
          id: `bot-${Date.now()}`,
          type: 'bot',
          text: 'Maaf, saya tidak dapat memproses pertanyaan Anda saat ini. Silakan coba lagi nanti.'
        })
      );
      
      toast.error('Gagal memproses pesan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="bg-travel-primary text-white p-4 rounded-t-lg flex items-center space-x-3">
        <Compass size={24} />
        <h1 className="text-xl font-bold">Travel Buddy Insight</h1>
      </div>
      
      <Card className="flex-grow overflow-hidden flex flex-col">
        <ScrollArea className="flex-grow p-4">
          <div className="space-y-4">
            {messages.map(message => (
              <div key={message.id} className={`${message.type === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                {message.type === 'loading' ? (
                  <TypingIndicator />
                ) : (
                  <div className={`message-bubble ${message.type === 'user' ? 'user-message' : 'bot-message'}`}>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    {message.travelData && <TravelCard travelData={message.travelData} destination={currentDestination} />}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Beri tahu kemana kamu ingin pergi hari ini..."
            disabled={isLoading}
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? <Clock className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </Card>
      
      <PhoneNumberModal 
        isOpen={showPhoneModal} 
        onClose={handlePhoneNumberSubmit} 
      />
    </div>
  );
};

export default TravelChatbot;
