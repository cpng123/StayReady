// data/homeData.js
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

// --- Disaster Preparedness topics (full list of 10) ---
export const PREPAREDNESS = [
  { id: "flood",      title: "Flash Flood",      img: require("../assets/General/flash-flood.jpg") },
  { id: "haze",       title: "Haze (PM2.5)",     img: require("../assets/General/pm-haze.jpg") },
  { id: "storm",      title: "Thunderstorm",     img: require("../assets/General/thunder-storm.jpg") },
  { id: "dengue",     title: "Dengue Prevention",img: require("../assets/General/dengue-cluster.jpg") },
  { id: "wind",       title: "Strong Wind",      img: require("../assets/General/strong-wind.jpg") },
  { id: "aid",        title: "CPR & First Aid",  img: require("../assets/General/first-aid.jpg") },
  { id: "fire",       title: "Fire Safety",      img: require("../assets/General/fire-safety.jpg") },
  { id: "kit",        title: "Emergency Kits",   img: require("../assets/General/emergency-kits.jpg") },
  { id: "disease",    title: "Disease Outbreak", img: require("../assets/General/disease-outbreak.jpg") },
  { id: "earthquake", title: "Earthquake",       img: require("../assets/General/earthquake.jpg") },
];

export const GUIDE_IDS = ["flood","haze","dengue","storm","wind","fire","aid","kit","disease","earthquake"];
export const isGuideId = (id) => GUIDE_IDS.includes(id);

// Home only shows first N; “See More” can use full PREPAREDNESS later
export const getHomePreparedness = (n = 4) => PREPAREDNESS.slice(0, n);

// --- Routine Preparations (3) ---
export const ROUTINE = [
  { id: "routine-checklist", title: "StayReady Checklist", img: require("../assets/General/checklist.jpg") },
  { id: "routine-external",  title: "External Resources",  img: require("../assets/General/external-resource.jpg") },
  { id: "routine-quiz",      title: "Safety Quiz",         img: require("../assets/General/safety-quiz.jpg") },
];
