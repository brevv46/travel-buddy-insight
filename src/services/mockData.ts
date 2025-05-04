
import { TravelResponse } from './apiService';

export const generateMockTravelData = (destination: string): TravelResponse => {
  console.log("Using mock data for destination:", destination);
  
  // Generate mock data based on destination
  const isMountain = /gunung|bromo|rinjani|semeru|merapi|mountain/i.test(destination);
  const isBeach = /pantai|beach|laut|bali|lombok|gili|batu angus/i.test(destination);
  const isCity = /jakarta|bandung|surabaya|yogyakarta|city|kota/i.test(destination);
  
  let packingList = [];
  let nearbyPlaces = [];
  let localFoods = [];
  let weatherInfo = {
    location: destination,
    temperature: 0,
    condition: "",
    humidity: 0,
    wind: 0
  };
  
  // Generate packing list based on destination type
  if (isMountain) {
    packingList = [
      { item: "Jaket Tebal", essential: true },
      { item: "Sepatu Hiking", essential: true },
      { item: "Topi", essential: true },
      { item: "Senter", essential: true },
      { item: "Sarung Tangan", essential: false },
      { item: "Kantong Tidur", essential: false },
      { item: "P3K", essential: true }
    ];
    weatherInfo = {
      location: destination,
      temperature: 15,
      condition: "Dingin dan Berawan",
      humidity: 80,
      wind: 20
    };
    nearbyPlaces = [
      { name: "Puncak Utama", description: "Tujuan utama pendakian dengan pemandangan spektakuler", distance: "2 km dari base camp" },
      { name: "Air Terjun Tersembunyi", description: "Air terjun alami yang menyegarkan", distance: "3 km dari jalur utama" },
      { name: "Kawah", description: "Kawah aktif dengan pemandangan asap belerang", distance: "500 m dari puncak" }
    ];
    localFoods = [
      { name: "Sup Hangat", description: "Sup tradisional yang menghangatkan tubuh di suhu dingin" },
      { name: "Kopi Lokal", description: "Kopi dari perkebunan sekitar gunung" },
      { name: "Mie Instan Spesial", description: "Hidangan favorit para pendaki dengan tambahan telur dan sayuran" }
    ];
  } else if (isBeach) {
    packingList = [
      { item: "Sunscreen SPF 50", essential: true },
      { item: "Topi Pantai", essential: true },
      { item: "Baju Renang", essential: true },
      { item: "Kacamata Hitam", essential: false },
      { item: "Handuk Pantai", essential: true },
      { item: "Sandal", essential: true },
      { item: "Baju Ganti", essential: false }
    ];
    weatherInfo = {
      location: destination,
      temperature: 30,
      condition: "Cerah dan Panas",
      humidity: 75,
      wind: 10
    };
    nearbyPlaces = [
      { name: "Pantai Tersembunyi", description: "Pantai kecil yang tenang dengan pasir putih", distance: "2 km dari pantai utama" },
      { name: "Spot Snorkeling", description: "Area dengan terumbu karang yang indah", distance: "500 m dari pantai" },
      { name: "Bukit Pemandangan", description: "Bukit kecil dengan pemandangan laut yang luas", distance: "1 km dari pantai" }
    ];
    localFoods = [
      { name: "Ikan Bakar", description: "Ikan segar yang dibakar dengan bumbu tradisional" },
      { name: "Kelapa Muda", description: "Minuman segar langsung dari pohon" },
      { name: "Seafood Segar", description: "Berbagai hidangan laut yang baru ditangkap nelayan lokal" }
    ];
  } else {
    // Default/city
    packingList = [
      { item: "Peta/Aplikasi Peta", essential: true },
      { item: "Payung/Jas Hujan", essential: true },
      { item: "Powerbank", essential: true },
      { item: "Tas Kecil", essential: true },
      { item: "Tiket/Reservasi", essential: true },
      { item: "Uang Tunai", essential: true },
      { item: "Camilan", essential: false }
    ];
    weatherInfo = {
      location: destination,
      temperature: 28,
      condition: "Cerah Berawan",
      humidity: 65,
      wind: 8
    };
    nearbyPlaces = [
      { name: "Museum Sejarah", description: "Museum dengan koleksi artefak budaya lokal", distance: "2 km dari pusat kota" },
      { name: "Taman Kota", description: "Taman luas dengan berbagai aktivitas", distance: "1 km dari pusat kota" },
      { name: "Pasar Tradisional", description: "Pasar dengan berbagai produk lokal dan suvenir", distance: "3 km dari pusat kota" }
    ];
    localFoods = [
      { name: "Makanan Khas Daerah", description: "Hidangan tradisional yang terkenal di daerah ini" },
      { name: "Jajanan Pasar", description: "Kue dan camilan tradisional yang dijual di pasar lokal" },
      { name: "Minuman Tradisional", description: "Minuman khas yang menyegarkan" }
    ];
  }
  
  return {
    packingList,
    nearbyPlaces,
    localFoods,
    weatherInfo,
    safetyTips: [
      "Selalu beri tahu orang lain tentang rencana perjalanan Anda",
      "Simpan dokumen penting dan uang di tempat yang aman",
      "Kenali nomor darurat lokal",
      "Patuhi peraturan dan adat istiadat setempat",
      "Selalu bawa air minum yang cukup"
    ],
    motivationalQuote: "Perjalanan sejati bukan tentang mencari pemandangan baru, tetapi memiliki mata yang baru."
  };
};
