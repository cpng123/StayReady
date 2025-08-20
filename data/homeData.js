// Put this at <root>/data/homeData.js
export const CONTACTS = [
  {
    id: "sos",
    title: "SOS",
    subtitle: "Trigger Loud\nEmergency Alert",
    number: "SOS",
    img: require("../assets/Contact/sos.png"),
  },
  {
    id: "995",
    title: "995",
    subtitle: "SCDF Emergency\nAmbulance / Fire",
    number: "995",
    img: require("../assets/Contact/emergency-call.png"),
  },
  {
    id: "999",
    title: "999",
    subtitle: "SPF Emergency\nPolice Response",
    number: "999",
    img: require("../assets/Contact/police.png"),
  },
  {
    id: "1777",
    title: "1777",
    subtitle: "Non-Emergency\nAmbulance",
    number: "1777",
    img: require("../assets/Contact/non-emergency-call.png"),
  },
];

// Keep the full list here (>= 6). Home will slice to 4.
export const WARNINGS = [
  {
    id: "flood",
    title: "Flash-Flood Risk",
    level: "High",
    color: "#F25555",
    img: require("../assets/General/flash-flood2.jpg"),
    desc: "Flood risk near Balestier — drains at high level; avoid low-lying roads.",
    updated: "12:15 PM",
  },
  {
    id: "pm",
    title: "PM2.5 Levels",
    level: "Med",
    color: "#F29F3D",
    img: require("../assets/General/pm-haze2.jpg"),
    desc: "Air quality in Central at unhealthy range; limit outdoor activities.",
    updated: "1:45 PM",
  },
  {
    id: "dengue",
    title: "Dengue Clusters",
    level: "Safe",
    color: "#03A55A",
    img: require("../assets/General/dengue-cluster2.jpg"),
    desc: "Active cluster in Bedok South; clear stagnant water and use repellent.",
    updated: "2:05 PM",
  },
  {
    id: "thunderstorm",
    title: "Thunderstorm",
    level: "Safe",
    color: "#03A55A",
    img: require("../assets/General/thunder-storm2.jpg"),
    desc: "Heavy rain forecast in Ang Mo Kio and Hougang — lightning risk; seek shelter indoors.",
    updated: "2:05 PM",
  },
  {
    id: "covid",
    title: "Covid-19",
    level: "Safe",
    color: "#03A55A",
    img: require("../assets/General/disease-outbreak2.jpg"),
    desc: "COVID-19 cases rising in Singapore; follow MOH guidelines and practise good hygiene.",
    updated: "2:05 PM",
  },
  {
    id: "wind",
    title: "Strong Wind",
    level: "Safe",
    color: "#03A55A",
    img: require("../assets/General/strong-wind2.jpg"),
    desc: "Strong winds expected in coastal and open areas; secure loose items and stay indoors if possible.",
    updated: "2:05 PM",
  },
];

export const getHomeWarnings = (n = 4) => WARNINGS.slice(0, n);

// --- Disaster Preparedness topics (full list of 10) ---
export const PREPAREDNESS = [
  { id: "prep-flood",        title: "Flash Flood",      img: require("../assets/General/flash-flood.jpg") },
  { id: "prep-haze",         title: "Haze (PM2.5)",     img: require("../assets/General/pm-haze.jpg") },
  { id: "prep-thunder",      title: "Thunderstorm",     img: require("../assets/General/thunder-storm.jpg") },
  { id: "prep-dengue",       title: "Dengue Prevention",img: require("../assets/General/dengue-cluster.jpg") },
  { id: "prep-wind",         title: "Strong Wind",      img: require("../assets/General/strong-wind.jpg") },
  { id: "prep-firstaid",     title: "CPR & First Aid",  img: require("../assets/General/first-aid.jpg") },
  { id: "prep-fire",         title: "Fire Safety",      img: require("../assets/General/fire-safety.jpg") },
  { id: "prep-kits",         title: "Emergency Kits",   img: require("../assets/General/emergency-kits.jpg") },
  { id: "prep-disease",      title: "Disease Outbreak", img: require("../assets/General/disease-outbreak.jpg") },
  { id: "prep-earthquake",   title: "Earthquake",       img: require("../assets/General/earthquake.jpg") },
];

// Home only shows first N; “See More” can use full PREPAREDNESS later
export const getHomePreparedness = (n = 4) => PREPAREDNESS.slice(0, n);

// --- Routine Preparations (3) ---
export const ROUTINE = [
  { id: "routine-checklist", title: "StayReady Checklist", img: require("../assets/General/checklist.jpg") },
  { id: "routine-learning",  title: "Learning Resources",  img: require("../assets/General/learning-resource.jpg") },
  { id: "routine-quiz",      title: "Safety Quiz",         img: require("../assets/General/safety-quiz.jpg") },
];
