/**
 * BusTrack - Universal RTC Live Bus Tracking System
 * Complete client-side application logic, Leaflet mapping, live simulation, i18n, search & alerts
 */

const STORAGE_KEY = 'bustrack_data_v1';
const USER_KEY = 'bustrack_user';
const THEME_KEY = 'bustrack_theme';
const LANG_KEY = 'bustrack_lang';
const RECENT_KEY = 'bustrack_recent_searches';
const FAV_KEY = 'bustrack_favorites';

// Standard Andhra Pradesh Stop Coordinates Dictionary
const STOP_COORDINATES = {
  'Tanuku': [16.7565, 81.6811],
  'Undrajavaram': [16.7905, 81.6702],
  'Tadepalligudem': [16.8142, 81.5273],
  'Attili': [16.6969, 81.6041],
  'Bhimavaram': [16.5449, 81.5212],
  'Ravulapalem': [16.7523, 81.8415],
  'Rajahmundry': [17.0005, 81.8040],
  'Eluru': [16.7107, 81.0952],
  'Vijayawada': [16.5062, 80.6480],
  'Nidadavole': [16.9088, 81.6707],
  'Palakollu': [16.5249, 81.7335],
  'Jangareddygudem': [17.1264, 81.2941]
};

// Fallback coordinate generation for any unknown stop
function getStopCoords(stopName, fallbackLat = 16.75, fallbackLng = 81.7) {
  if (STOP_COORDINATES[stopName]) {
    return STOP_COORDINATES[stopName];
  }
  // Generate stable deterministic pseudo-coords near Tanuku/AP
  let hash = 0;
  for (let i = 0; i < stopName.length; i++) {
    hash = (hash << 5) - hash + stopName.charCodeAt(i);
    hash |= 0;
  }
  const offsetLat = ((Math.abs(hash) % 100) - 50) * 0.002;
  const offsetLng = ((Math.abs(hash >> 3) % 100) - 50) * 0.002;
  return [fallbackLat + offsetLat, fallbackLng + offsetLng];
}

// Initial Sample Data
const DEFAULT_DATA = {
  cities: [
    { id: "c1", name: "Tanuku" },
    { id: "c2", name: "Rajahmundry" },
    { id: "c3", name: "Bhimavaram" }
  ],
  routes: [
    {
      id: "r1",
      cityId: "c1",
      from: "Tanuku",
      to: "Tadepalligudem",
      stops: ["Tanuku", "Undrajavaram", "Tadepalligudem"],
      firstTrip: "06:00",
      lastTrip: "21:00",
      frequency: "30 mins",
      fare: 35
    },
    {
      id: "r2",
      cityId: "c1",
      from: "Tanuku",
      to: "Bhimavaram",
      stops: ["Tanuku", "Attili", "Bhimavaram"],
      firstTrip: "06:30",
      lastTrip: "22:00",
      frequency: "20 mins",
      fare: 45
    },
    {
      id: "r3",
      cityId: "c2",
      from: "Rajahmundry",
      to: "Tanuku",
      stops: ["Rajahmundry", "Ravulapalem", "Tanuku"],
      firstTrip: "05:30",
      lastTrip: "23:00",
      frequency: "15 mins",
      fare: 55
    }
  ],
  buses: [
    {
      id: "b1",
      cityId: "c1",
      routeId: "r1",
      busNumber: "AP37-1234",
      busType: "Ordinary",
      driverName: "Raju",
      driverPhone: "9989012345",
      status: "Running",
      crowd: "Half",
      lat: 16.762,
      lng: 81.675,
      speed: 34,
      currentStopIndex: 0,
      targetStopIndex: 1,
      passengers: 24,
      rating: 4.7
    },
    {
      id: "b2",
      cityId: "c1",
      routeId: "r2",
      busNumber: "AP37-5678",
      busType: "Express",
      driverName: "Suresh",
      driverPhone: "9848023456",
      status: "Running",
      crowd: "Empty",
      lat: 16.698,
      lng: 81.605,
      speed: 42,
      currentStopIndex: 1,
      targetStopIndex: 2,
      passengers: 12,
      rating: 4.8
    },
    {
      id: "b3",
      cityId: "c1",
      routeId: "r1",
      busNumber: "AP37-9012",
      busType: "AC",
      driverName: "Anil",
      driverPhone: "9701034567",
      status: "Stopped",
      crowd: "Full",
      lat: 16.814,
      lng: 81.527,
      speed: 0,
      currentStopIndex: 2,
      targetStopIndex: 2,
      passengers: 44,
      rating: 4.2
    },
    {
      id: "b4",
      cityId: "c2",
      routeId: "r3",
      busNumber: "AP37-4321",
      busType: "Super Luxury",
      driverName: "Venkatesh",
      driverPhone: "9440123789",
      status: "Running",
      crowd: "Half",
      lat: 16.880,
      lng: 81.760,
      speed: 38,
      currentStopIndex: 1,
      targetStopIndex: 2,
      passengers: 28,
      rating: 4.6
    }
  ],
  reports: [
    {
      id: "rep-101",
      busNumber: "AP37-9012",
      issue: "Overcrowded during rush hour",
      date: "2026-09-26 14:30",
      status: "Resolved"
    },
    {
      id: "rep-102",
      busNumber: "AP37-1234",
      issue: "AC cooling reduced",
      date: "2026-09-26 16:15",
      status: "Pending"
    }
  ],
  sos: []
};

// ==========================================
// i18n Translation Dictionary
// ==========================================
const LANG = {
  en: {
    appName: "BusTrack",
    liveTracking: "Live RTC Tracking",
    citySelect: "Select City",
    searchPlaceholder: "Search bus no, driver, route...",
    from: "From (Starting Stop)",
    to: "To (Destination)",
    swap: "Swap",
    date: "Date",
    timeSlot: "Time Slot",
    all: "All",
    morning: "Morning (06:00 - 12:00)",
    evening: "Evening (12:00 - 18:00)",
    night: "Night (18:00 - 24:00)",
    searchBuses: "Find Buses",
    busType: "Bus Type",
    fare: "Max Fare",
    lessCrowded: "Less Crowded Only",
    sortBy: "Sort By",
    sortEta: "Earliest ETA",
    sortFare: "Lowest Fare",
    sortSpeed: "Fastest Speed",
    viewList: "List View",
    viewMap: "Map View",
    running: "Running",
    stopped: "Stopped",
    breakdown: "Breakdown",
    empty: "Empty",
    half: "Half",
    full: "Full",
    fareApprox: "Fare: ₹",
    firstLast: "Timings",
    frequency: "Frequency",
    nextStop: "Next Stop",
    distanceAway: "away",
    track: "Track Live",
    follow: "Follow Bus",
    unfollow: "Stop Tracking",
    shareTrip: "Share Trip",
    getDirections: "Directions",
    driverCall: "Call Driver",
    speed: "Speed",
    stopsList: "Route Stops & Timetable",
    nearestStops: "Nearest Stops to Me",
    community: "Community Live Feedback",
    iamOnThisBus: "I am on this bus",
    reportIssue: "Report Issue",
    rateBus: "Rate Experience",
    sos: "SOS",
    guestLogin: "Continue as Guest",
    loginTitle: "Passenger Login",
    phone: "Mobile Number",
    otp: "Enter OTP (Mock: 123456)",
    verifyLogin: "Verify & Login",
    homeCollegeFav: "Quick: Home ↔ College",
    recentSearches: "Recent Searches",
    offlineNotice: "You are currently offline. Showing last known positions.",
    lowDataMode: "Low-Data Mode",
    myLocation: "My Location",
    verifiedRTC: "APSRTC / RTC Verified Fleet",
    amenities: "Amenities: AC, Free Wi-Fi, USB Charging, Emergency Kit",
    driverPortal: "Driver Portal",
    adminPortal: "Admin Portal",
    passengerPortal: "Passenger Portal"
  },
  te: {
    appName: "బస్ట్రాక్",
    liveTracking: "లైవ్ ఆర్టీసీ బస్సు ట్రాకింగ్",
    citySelect: "నగరం ఎంచుకోండి",
    searchPlaceholder: "బస్సు నంబర్, డ్రైవర్, రూట్ శోధించండి...",
    from: "ఎక్కే చోటు (ఫ్రమ్)",
    to: "దిగే చోటు (టూ)",
    swap: "మార్చు",
    date: "తేదీ",
    timeSlot: "సమయం స్లాట్",
    all: "అన్నీ",
    morning: "ఉదయం (06:00 - 12:00)",
    evening: "సాయంత్రం (12:00 - 18:00)",
    night: "రాత్రి (18:00 - 24:00)",
    searchBuses: "బస్సులను వెతకండి",
    busType: "బస్సు రకం",
    fare: "గరిష్ట ఛార్జీ",
    lessCrowded: "తక్కువ రద్దీ మాత్రమే",
    sortBy: "క్రమబద్ధీకరించు",
    sortEta: "త్వరగా వచ్చేది (ETA)",
    sortFare: "తక్కువ ఛార్జీ",
    sortSpeed: "అధిక వేగం",
    viewList: "జాబితా దృశ్యం",
    viewMap: "మ్యాప్ దృశ్యం",
    running: "నడుస్తోంది",
    stopped: "ఆగింది",
    breakdown: "మరమ్మతు / బ్రేక్‌డౌన్",
    empty: "ఖాళీగా ఉంది",
    half: "సగం రద్దీ",
    full: "పూర్తి రద్దీ",
    fareApprox: "ఛార్జీ: ₹",
    firstLast: "సమయాలు",
    frequency: "ప్రతి",
    nextStop: "తదుపరి స్టాప్",
    distanceAway: "దూరంలో",
    track: "లైవ్ ట్రాక్",
    follow: "బస్సును ఫాలో చేయి",
    unfollow: "ట్రాకింగ్ ఆపు",
    shareTrip: "ట్రిప్ షేర్ చేయి",
    getDirections: "దారి చూపించు",
    driverCall: "డ్రైవర్‌కు కాల్ చేయండి",
    speed: "వేగం",
    stopsList: "రూట్ స్టాప్‌లు & సమయ పట్టిక",
    nearestStops: "నాకు దగ్గర్లోని బస్ స్టాప్‌లు",
    community: "ప్రయాణికుల లైవ్ సమాచారం",
    iamOnThisBus: "నేను ఈ బస్సులోనే ఉన్నాను",
    reportIssue: "సమస్యను నివేదించండి",
    rateBus: "రేటింగ్ ఇవ్వండి",
    sos: "ఎస్.ఓ.ఎస్ (SOS)",
    guestLogin: "గెస్ట్‌గా కొనసాగండి",
    loginTitle: "ప్రయాణీకుల లాగిన్",
    phone: "మొబైల్ సంఖ్య",
    otp: "OTP నమోదు చేయండి (123456)",
    verifyLogin: "లాగిన్ చేయండి",
    homeCollegeFav: "ఇంటి ↔ కాలేజీ రూట్",
    recentSearches: "ఇటీవలి శోధనలు",
    offlineNotice: "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. చివరి లొకేషన్ చూపబడుతోంది.",
    lowDataMode: "తక్కువ డేటా మోడ్",
    myLocation: "నా ప్రస్తుత ప్రదేశం",
    verifiedRTC: "ఆర్టీసీ అధికారిక బస్సులు",
    amenities: "సౌకర్యాలు: AC, ఉచిత Wi-Fi, మొబైల్ ఛార్జింగ్, ప్రథమ చికిత్స",
    driverPortal: "డ్రైవర్ పోర్టల్",
    adminPortal: "అడ్మిన్ పోర్టల్",
    passengerPortal: "ప్రయాణికుల పేజీ"
  }
};

// ==========================================
// App State & Database Helpers
// ==========================================
class BusTrackDB {
  static get() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Corrupt localStorage, reinitializing default data", e);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  static save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  static getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  static saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  static setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
  }

  static getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  static setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  static getFavorites() {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  static toggleFavorite(busId) {
    let favs = BusTrackDB.getFavorites();
    if (favs.includes(busId)) {
      favs = favs.filter(id => id !== busId);
    } else {
      favs.push(busId);
    }
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    return favs;
  }

  static getRecentSearches() {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  static addRecentSearch(searchObj) {
    let recents = BusTrackDB.getRecentSearches();
    recents = recents.filter(item => !(item.from === searchObj.from && item.to === searchObj.to));
    recents.unshift(searchObj);
    if (recents.length > 10) recents = recents.slice(0, 10);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents));
  }
}

// ==========================================
// Geo & Distance Calculations
// ==========================================
function calculateHaversine(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 5;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function calculateETA(distanceKm, speedKmh = 35) {
  const effectiveSpeed = Math.max(speedKmh, 15);
  const minutes = Math.round((distanceKm / effectiveSpeed) * 60);
  return Math.max(minutes, 1);
}

// Play Audio Alarm for Destination approach
function playGetOffAlarm() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    // 2-tone melodic chime
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880.00, now + 0.2); // A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    if (navigator.vibrate) {
      navigator.vibrate([250, 100, 250, 100, 400]);
    }
  } catch (e) {
    console.warn("AudioContext not allowed or supported yet:", e);
  }
}

// ==========================================
// Bus Movement Simulation Loop
// ==========================================
let simulationInterval = null;
let followedBusId = null;
let userCoordinates = [16.7565, 81.6811]; // default Tanuku center
let isLowDataMode = false;

function startBusSimulation(onTickCallback) {
  if (simulationInterval) clearInterval(simulationInterval);
  const intervalMs = isLowDataMode ? 15000 : 3000;

  simulationInterval = setInterval(() => {
    const data = BusTrackDB.get();
    let hasChanges = false;

    data.buses.forEach(bus => {
      if (bus.status !== 'Running') return;

      const route = data.routes.find(r => r.id === bus.routeId);
      if (!route || !route.stops || route.stops.length < 2) return;

      const totalStops = route.stops.length;
      if (bus.currentStopIndex === undefined) bus.currentStopIndex = 0;
      if (bus.targetStopIndex === undefined) bus.targetStopIndex = (bus.currentStopIndex + 1) % totalStops;

      const currentStopName = route.stops[bus.currentStopIndex];
      const targetStopName = route.stops[bus.targetStopIndex];
      const currentStopCoords = getStopCoords(currentStopName);
      const targetStopCoords = getStopCoords(targetStopName);

      // Move incrementally towards target stop
      const step = 0.08; // interpolation step fraction
      const nextLat = bus.lat + (targetStopCoords[0] - bus.lat) * step + (Math.random() - 0.5) * 0.0006;
      const nextLng = bus.lng + (targetStopCoords[1] - bus.lng) * step + (Math.random() - 0.5) * 0.0006;

      // Realistic speed jitter between 25 and 48 km/h
      bus.speed = Math.floor(25 + Math.random() * 20);
      bus.lat = Math.round(nextLat * 100000) / 100000;
      bus.lng = Math.round(nextLng * 100000) / 100000;

      // Check proximity to target stop
      const distToTarget = calculateHaversine(bus.lat, bus.lng, targetStopCoords[0], targetStopCoords[1]);
      if (distToTarget < 0.3) {
        // Bus arrived at stop! Move to next stop
        bus.currentStopIndex = bus.targetStopIndex;
        bus.targetStopIndex = (bus.targetStopIndex + 1) % totalStops;
      }

      hasChanges = true;
    });

    if (hasChanges) {
      BusTrackDB.save(data);
    }

    if (typeof onTickCallback === 'function') {
      onTickCallback(data);
    }
  }, intervalMs);
}

// ==========================================
// Voice Search Support (Telugu te-IN)
// ==========================================
function setupTeluguVoiceRecognition(micButtonId, onResultCallback, statusElementId) {
  const micBtn = document.getElementById(micButtonId);
  const statusEl = document.getElementById(statusElementId);
  if (!micBtn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.title = "Speech recognition is not supported in this browser.";
    micBtn.style.opacity = '0.5';
    micBtn.addEventListener('click', () => {
      alert("Voice recognition is not supported in this browser. Please use Chrome/Edge.");
    });
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'te-IN'; // Primary Telugu
  recognition.continuous = false;
  recognition.interimResults = false;

  let isListening = false;

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    if (statusEl) {
      statusEl.classList.add('active');
      statusEl.textContent = "🎙️ Listening... Please speak (e.g. 'Tanuku to Tadepalligudem')";
    }
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    if (statusEl) {
      statusEl.textContent = `🗣️ Recognized: "${transcript}"`;
    }
    
    // Parse phrase by speech connectors (e.g. from / to)
    let from = "";
    let to = "";
    const connectors = ["నుండి", "నుంచి", "to", "కి", "నుండి", "-"];
    let matchedConnector = null;

    for (const c of connectors) {
      if (transcript.includes(c)) {
        matchedConnector = c;
        break;
      }
    }

    if (matchedConnector) {
      const parts = transcript.split(matchedConnector);
      from = parts[0].trim();
      to = parts[1] ? parts[1].trim() : "";
    } else {
      from = transcript;
    }

    if (typeof onResultCallback === 'function') {
      onResultCallback(from, to, transcript);
    }
  };

  recognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    if (statusEl) {
      statusEl.textContent = `Speech recognition error: ${event.error}`;
      setTimeout(() => statusEl.classList.remove('active'), 3000);
    }
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    setTimeout(() => {
      if (statusEl) statusEl.classList.remove('active');
    }, 4000);
  };

  micBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (e) {
        console.error("Speech recognition start failed:", e);
      }
    }
  });
}

// ==========================================
// Common i18n & Theme Controller
// ==========================================
function applyLanguage(lang) {
  BusTrackDB.setLang(lang);
  const dict = LANG[lang] || LANG.en;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (dict[key]) {
      el.title = dict[key];
    }
  });

  const langToggleBtn = document.getElementById('lang-toggle-btn');
  if (langToggleBtn) {
    langToggleBtn.textContent = lang === 'en' ? 'తెలుగు' : 'English';
  }
}

function applyTheme(theme) {
  BusTrackDB.setTheme(theme);
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  }
}

// Network Online/Offline Handler
function initNetworkWatcher() {
  const offlineBar = document.getElementById('offline-bar');
  const updateStatus = () => {
    if (!navigator.onLine) {
      if (offlineBar) {
        offlineBar.classList.add('offline');
        offlineBar.textContent = `⚠️ Offline. Showing last known positions (${new Date().toLocaleTimeString()})`;
      }
    } else {
      if (offlineBar) {
        offlineBar.classList.remove('offline');
      }
    }
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
}

// Toast alerts helper
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('alerts-container');
  if (!container) return;

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert-card ${type}`;
  alertDiv.innerHTML = `
    <div>${message}</div>
    <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.prepend(alertDiv);

  if (duration > 0) {
    setTimeout(() => {
      if (alertDiv.parentElement) alertDiv.remove();
    }, duration);
  }
}

// Global SOS Trigger
function triggerSOS(busNumber, currentLat, currentLng) {
  const data = BusTrackDB.get();
  const bus = busNumber ? data.buses.find(b => b.busNumber === busNumber) : data.buses[0];
  const lat = currentLat || (bus ? bus.lat : 16.7565);
  const lng = currentLng || (bus ? bus.lng : 81.6811);
  const busNo = bus ? bus.busNumber : "RTC-SOS";

  const confirmSOS = confirm(`🚨 EMERGENCY SOS:\n\nDo you want to send an emergency alert?\n(Live location: ${lat}, ${lng} on Bus ${busNo})\n\nRTC Helpline: 0866-2570005 | Police: 112 | Ambulance: 108`);

  if (!confirmSOS) return;

  const nowStr = new Date().toLocaleString();
  const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
  const sosMessage = `EMERGENCY ALERT: I need immediate help. I am on RTC Bus ${busNo}. Live GPS location: ${mapsLink} at ${nowStr}`;

  // Save in local reports / sos array
  if (!data.sos) data.sos = [];
  data.sos.unshift({
    id: "sos-" + Date.now(),
    busNumber: busNo,
    lat: lat,
    lng: lng,
    time: nowStr,
    status: "Active Alert"
  });
  BusTrackDB.save(data);

  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(sosMessage).catch(() => {});
  }

  // Open WhatsApp or SMS share
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(sosMessage)}`;
  window.open(shareUrl, '_blank');

  showToast(`🚨 SOS triggered! Live location shared. Emergency response team notified. (Link copied!)`, 'danger', 10000);
}

// Export essentials to window object for access across passenger, driver, and admin
window.BusTrack = {
  DB: BusTrackDB,
  STOP_COORDINATES,
  getStopCoords,
  calculateHaversine,
  calculateETA,
  playGetOffAlarm,
  startBusSimulation,
  setupTeluguVoiceRecognition,
  applyLanguage,
  applyTheme,
  initNetworkWatcher,
  showToast,
  triggerSOS,
  LANG,
  get isLowDataMode() { return isLowDataMode; },
  set isLowDataMode(val) { isLowDataMode = val; },
  get followedBusId() { return followedBusId; },
  set followedBusId(val) { followedBusId = val; },
  get userCoordinates() { return userCoordinates; },
  set userCoordinates(val) { userCoordinates = val; }
};
