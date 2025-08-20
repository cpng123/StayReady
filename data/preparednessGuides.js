// data/preparednessGuides.js
// One place to define the title, hero image, description, and the 5 reason cards (with icons)
// for each preparedness category.

export const PREPAREDNESS_GUIDES = {
  flood: {
    id: "flood",
    title: "Flash Flood",
    hero: require("../assets/General/flash-flood.jpg"),
    description:
      "Know what to do before, during, and after a flash flood. Reduce risks, protect your property, and recover safely once waters recede.",
    reasons: [
      { id: "flood1", label: "Heavy\nRainfall", icon: require("../assets/Reason/flood1.png") },
      { id: "flood2", label: "Blocked\nDrains", icon: require("../assets/Reason/flood2.png") },
      { id: "flood3", label: "Deforesta-\ntion", icon: require("../assets/Reason/flood3.png") },
      { id: "flood4", label: "Urbaniza-\ntion", icon: require("../assets/Reason/flood4.png") },
      { id: "flood5", label: "Low-Lying\nTerrain", icon: require("../assets/Reason/flood5.png") },
    ],
  },

  haze: {
    id: "haze",
    title: "Haze (PM2.5)",
    hero: require("../assets/General/pm-haze.jpg"),
    description:
      "Understand PM2.5 risks and how to protect your lungs. Learn when to limit outdoor activity and use masks or purifiers effectively.",
    reasons: [
      { id: "haze1", label: "Forest\nFires", icon: require("../assets/Reason/haze1.png") },
      { id: "haze2", label: "Dry\nWeather", icon: require("../assets/Reason/haze2.png") },
      { id: "haze3", label: "Wind\nDirection", icon: require("../assets/Reason/haze3.png") },
      { id: "haze4", label: "Industrial\nSources", icon: require("../assets/Reason/haze4.png") },
      { id: "haze5", label: "Transboundary\nSmoke", icon: require("../assets/Reason/haze5.png") },
    ],
  },

  storm: {
    id: "storm",
    title: "Thunderstorm",
    hero: require("../assets/General/thunder-storm.jpg"),
    description:
      "Lightning, strong winds, and heavy rain can strike quickly. Learn sheltering strategies and what to avoid during storms.",
    reasons: [
      { id: "storm1", label: "Moisture-\nRich Air", icon: require("../assets/Reason/storm1.png") },
      { id: "storm2", label: "Instability", icon: require("../assets/Reason/storm2.png") },
      { id: "storm3", label: "Converging\nWinds", icon: require("../assets/Reason/storm3.png") },
      { id: "storm4", label: "Sea Breeze\nBoundaries", icon: require("../assets/Reason/storm4.png") },
      { id: "storm5", label: "Topography", icon: require("../assets/Reason/storm5.png") },
    ],
  },

  dengue: {
    id: "dengue",
    title: "Dengue Prevention",
    hero: require("../assets/General/dengue-cluster.jpg"),
    description:
      "Prevent mosquito breeding, protect your family, and act early if symptoms appear. Every small step cuts transmission.",
    reasons: [
      { id: "dengue1", label: "Stagnant\nWater", icon: require("../assets/Reason/dengue1.png") },
      { id: "dengue2", label: "Warm\nClimate", icon: require("../assets/Reason/dengue2.png") },
      { id: "dengue3", label: "Urban\nBreeding", icon: require("../assets/Reason/dengue3.png") },
      { id: "dengue4", label: "Travel\nExposure", icon: require("../assets/Reason/dengue4.png") },
      { id: "dengue5", label: "Low\nPrevention", icon: require("../assets/Reason/dengue5.png") },
    ],
  },

  wind: {
    id: "wind",
    title: "Strong Wind",
    hero: require("../assets/General/strong-wind.jpg"),
    description:
      "High winds can topple branches and loose items. Learn how to secure property and stay clear of hazards.",
    reasons: [
      { id: "wind1", label: "Pressure\nGradient", icon: require("../assets/Reason/wind1.png") },
      { id: "wind2", label: "Thunderstorm\nOutflow", icon: require("../assets/Reason/wind2.png") },
      { id: "wind3", label: "Monsoon\nSurges", icon: require("../assets/Reason/wind3.png") },
      { id: "wind4", label: "Terrain\nChanneling", icon: require("../assets/Reason/wind4.png") },
      { id: "wind5", label: "Tropical\nSystems", icon: require("../assets/Reason/wind5.png") },
    ],
  },

  aid: {
    id: "aid",
    title: "CPR & First Aid",
    hero: require("../assets/General/first-aid.jpg"),
    description:
      "Quick, correct actions save lives. Learn CPR basics, bleeding control, and when to call for emergency help.",
    reasons: [
      { id: "aid1", label: "Cardiac\nArrest", icon: require("../assets/Reason/aid1.png") },
      { id: "aid2", label: "Choking", icon: require("../assets/Reason/aid2.png") },
      { id: "aid3", label: "Severe\nBleeding", icon: require("../assets/Reason/aid3.png") },
      { id: "aid4", label: "Burns &\nTrauma", icon: require("../assets/Reason/aid4.png") },
      { id: "aid5", label: "Stroke\nSigns", icon: require("../assets/Reason/aid5.png") },
    ],
  },

  fire: {
    id: "fire",
    title: "Fire Safety",
    hero: require("../assets/General/fire-safety.jpg"),
    description:
      "Prevent fires at home and work. Learn extinguisher basics, escape planning, and safe electrical practices.",
    reasons: [
      { id: "fire1", label: "Overloaded\nPlugs", icon: require("../assets/Reason/fire1.png") },
      { id: "fire2", label: "Cooking\nFires", icon: require("../assets/Reason/fire2.png") },
      { id: "fire3", label: "Open\nFlames", icon: require("../assets/Reason/fire3.png") },
      { id: "fire4", label: "Poor\nMaintenance", icon: require("../assets/Reason/fire4.png") },
      { id: "fire5", label: "Arson/\nNegligence", icon: require("../assets/Reason/fire5.png") },
    ],
  },

  kit: {
    id: "kit",
    title: "Emergency Kits",
    hero: require("../assets/General/emergency-kits.jpg"),
    description:
      "Build a ready kit for 3–7 days: water, food, meds, first-aid, lights, documents, and family essentials.",
    reasons: [
      { id: "kit1", label: "Water &\nFood", icon: require("../assets/Reason/kit1.png") },
      { id: "kit2", label: "Medical\nNeeds", icon: require("../assets/Reason/kit2.png") },
      { id: "kit3", label: "Light &\nPower", icon: require("../assets/Reason/kit3.png") },
      { id: "kit4", label: "Tools &\nHygiene", icon: require("../assets/Reason/kit4.png") },
      { id: "kit5", label: "Docs &\nCash", icon: require("../assets/Reason/kit5.png") },
    ],
  },

  disease: {
    id: "disease",
    title: "Disease Outbreak",
    hero: require("../assets/General/disease-outbreak.jpg"),
    description:
      "Cut transmission with hygiene, masks when advised, vaccination, and staying informed from official sources.",
    reasons: [
      { id: "disease1", label: "High\nTransmission", icon: require("../assets/Reason/disease1.png") },
      { id: "disease2", label: "Low\nImmunity", icon: require("../assets/Reason/disease2.png") },
      { id: "disease3", label: "Crowded\nSpaces", icon: require("../assets/Reason/disease3.png") },
      { id: "disease4", label: "Travel &\nImport", icon: require("../assets/Reason/disease4.png") },
      { id: "disease5", label: "Poor\nHygiene", icon: require("../assets/Reason/disease5.png") },
    ],
  },

  earthquake: {
    id: "earthquake",
    title: "Earthquake",
    hero: require("../assets/General/earthquake.jpg"),
    description:
      "Know what to do during tremors: Drop, Cover, Hold. Secure furniture and understand aftershock risks.",
    reasons: [
      { id: "earthquake1", label: "Fault\nMovement", icon: require("../assets/Reason/earthquake1.png") },
      { id: "earthquake2", label: "Plate\nBoundaries", icon: require("../assets/Reason/earthquake2.png") },
      { id: "earthquake3", label: "Shallow\nQuakes", icon: require("../assets/Reason/earthquake3.png") },
      { id: "earthquake4", label: "Soil\nAmplification", icon: require("../assets/Reason/earthquake4.png") },
      { id: "earthquake5", label: "After-\nshocks", icon: require("../assets/Reason/earthquake5.png") },
    ],
  },
};

// Helper to fetch a single guide by id
export const getGuideById = (id) => PREPAREDNESS_GUIDES[id];
