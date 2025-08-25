// data/preparednessGuides.js
export const PREPAREDNESS_GUIDES = {
  flood: {
    id: "flood",
    title: "Flash Flood",
    hero: require("../assets/General/flash-flood.jpg"),
    description:
      "Learn how to stay safe during a flash flood, protect your property from damage, and take the right steps to recover quickly once the water recedes.",
    reasons: [
      {
        id: "flood1",
        label: "Heavy Rainfall",
        icon: require("../assets/Reason/flood1.png"),
        text: "Intense, short-duration downpours overwhelm drains and waterways, causing water levels to rise rapidly.",
      },
      {
        id: "flood2",
        label: "Blocked Drains",
        icon: require("../assets/Reason/flood2.png"),
        text: "Leaves, litter, and silt clog drains and culverts, trapping runoff and backing water onto streets and homes.",
      },
      {
        id: "flood3",
        label: "Deforestation",
        icon: require("../assets/Reason/flood3.png"),
        text: "Loss of trees and ground cover reduces infiltration and soil stability, speeding runoff and sending debris into waterways.",
      },
      {
        id: "flood4",
        label: "Urbanization",
        icon: require("../assets/Reason/flood4.png"),
        text: "Concrete and asphalt limit absorption, channeling large volumes of rain into drainage systems that can overflow.",
      },
      {
        id: "flood5",
        label: "Low-Lying Terrain",
        icon: require("../assets/Reason/flood5.png"),
        text: "Areas near rivers, canals, or below surrounding land collect runoff and are more prone to rapid inundation.",
      },
    ],
    sections: [
      {
        key: "prepareBefore",
        title: "Prepare Before",
        items: [
          {
            id: "floodPB1",
            img: require("../assets/General/flood1.jpg"),
            text: "Always stay informed by news or alerts on your phone.",
          },
          {
            id: "floodPB2",
            img: require("../assets/General/flood2.jpg"),
            text: "Organize an emergency bag with essentials & first-aid.",
          },
          {
            id: "floodPB3",
            img: require("../assets/General/flood3.jpg"),
            text: "Know your evacuation plan & safe alternate routes.",
          },
          {
            id: "floodPB4",
            img: require("../assets/General/flood4.jpg"),
            text: "Follow instructions & leave before flooding starts.",
          },
        ],
      },
      {
        key: "surviveDuring",
        title: "Survive During",
        items: [
          {
            id: "floodSD1",
            img: require("../assets/General/flood5.jpg"),
            text: "Do NOT walk or drive in flood water.",
          },
          {
            id: "floodSD2",
            img: require("../assets/General/flood6.jpg"),
            text: "Get to higher ground as soon as possible.",
          },
          {
            id: "floodSD3",
            img: require("../assets/General/flood7.jpg"),
            text: "Follow all evacuation instructions and orders.",
          },
          {
            id: "floodSD4",
            img: require("../assets/General/flood8.jpg"),
            text: "Disconnect electricity and gas.",
          },
        ],
      },
      {
        key: "recoverAfter",
        title: "Recover After",
        items: [
          {
            id: "floodRA1",
            img: require("../assets/General/flood9.jpg"),
            text: "Avoid contact with flood water.",
          },
          {
            id: "floodRA2",
            img: require("../assets/General/flood10.jpg"),
            text: "Stay away from fallen power lines.",
          },
          {
            id: "floodRA3",
            img: require("../assets/General/flood11.jpg"),
            text: "Do NOT return home or to disaster areas until they are declared safe.",
          },
          {
            id: "floodRA4",
            img: require("../assets/General/flood12.jpg"),
            text: "When back home, clean and disinfect surfaces and items.",
          },
        ],
      },
    ],
    externalResources: [
      {
        id: "pub",
        title: "PUB Flood Advisory",
        desc: "Stay informed on how PUB mitigates flood risks in Singapore and follow their essential flood safety tips.",
        url: "https://www.pub.gov.sg/Public/KeyInitiatives/Get-Flood-Wise/Flood-Safety-Tips",
        logo: require("../assets/External/EX-PUB.jpg"),
      },
      {
        id: "st",
        title: "Monsoon Road Safety",
        desc: "Tips for motorists to navigate safely during heavy rain and monsoon surges, reducing accident risks.",
        url: "https://www.straitstimes.com/singapore/askst-how-can-motorists-stay-safe-on-the-road-during-a-monsoon-surge",
        logo: require("../assets/External/EX-ST.jpg"),
      },
      {
        id: "hch",
        title: "Post-Flood Cleanup Tips",
        desc: "Get practical guidance on cleaning and restoring your home after a flash flood.",
        url: "https://hchcleaning.com.sg/5-tips-for-cleaning-up-after-a-flash-flood-in-singapore/",
        logo: require("../assets/External/EX-hCH.jpg"),
      },
      {
        id: "laminar",
        title: "Flood Barrier Solutions",
        desc: "Explore practical flood protection products and solutions designed for Singapore’s environment.",
        url: "https://laminar.com.sg/flood-solutions/flood-barriers/",
        logo: require("../assets/External/EX-Laminar.jpg"),
      },
    ],
  },

  haze: {
    id: "haze",
    title: "Haze (PM2.5)",
    hero: require("../assets/General/pm-haze.jpg"),
    description:
      "Learn how to protect yourself and your family during haze episodes. Understand the health risks of PM2.5, take preventive measures, and know how to deal with haze events.",
    reasons: [
      {
        id: "haze1",
        label: "Forest Fires",
        icon: require("../assets/Reason/haze1.png"),
        text: "Regional biomass burning emits smoke and fine particles that travel long distances.",
      },
      {
        id: "haze2",
        label: "Transboundary Pollution",
        icon: require("../assets/Reason/haze2.png"),
        text: "Winds transport pollutants from neighboring regions into local airspace.",
      },
      {
        id: "haze3",
        label: "Dry Weather",
        icon: require("../assets/Reason/haze3.png"),
        text: "Dry spells allow smoke to persist and reduce natural particulate wash-out by rain.",
      },
      {
        id: "haze4",
        label: "Urbanization",
        icon: require("../assets/Reason/haze4.png"),
        text: "Vehicle and industrial emissions add to background PM2.5 during haze periods.",
      },
      {
        id: "haze5",
        label: "Stagnant Air",
        icon: require("../assets/Reason/haze5.png"),
        text: "Weak winds and temperature inversions trap pollutants near the ground.",
      },
    ],
    sections: [
      {
        id: "prepareBefore",
        title: "Prepare Before",
        items: [
          {
            id: "haze-01",
            img: require("../assets/General/haze1.jpg"),
            text: "Monitor haze forecasts and PSI/PM2.5 readings daily.",
          },
          {
            id: "haze-02",
            img: require("../assets/General/haze2.jpg"),
            text: "Stock up on N95 masks and store them in a clean, dry place.",
          },
          {
            id: "haze-03",
            img: require("../assets/General/haze3.jpg"),
            text: "Purchase and maintain air purifiers with HEPA filters.",
          },
          {
            id: "haze-04",
            img: require("../assets/General/haze4.jpg"),
            text: "Seal gaps in doors and windows to reduce indoor smoke entry.",
          },
        ],
      },
      {
        id: "protectDuring",
        title: "Protect Yourself During",
        items: [
          {
            id: "haze-05",
            img: require("../assets/General/haze5.jpg"),
            text: "Limit outdoor activities, especially for those with health issues.",
          },
          {
            id: "haze-06",
            img: require("../assets/General/haze6.jpg"),
            text: "Wear a properly fitted N95 mask when outdoors.",
          },
          {
            id: "haze-07",
            img: require("../assets/General/haze7.jpg"),
            text: "Stay hydrated and avoid strenuous outdoor exercise.",
          },
          {
            id: "haze-08",
            img: require("../assets/General/haze8.jpg"),
            text: "Use eye drops and nasal saline spray to ease irritation.",
          },
        ],
      },
      {
        id: "recoverAfter",
        title: "Recover After",
        items: [
          {
            id: "haze-09",
            img: require("../assets/General/haze9.jpg"),
            text: "Open windows and doors to air out your home when air quality improves.",
          },
          {
            id: "haze-10",
            img: require("../assets/General/haze10.jpg"),
            text: "Clean floors and surfaces to remove deposited dust particles.",
          },
          {
            id: "haze-11",
            img: require("../assets/General/haze11.jpg"),
            text: "Replace or clean air purifier filters after the haze episode.",
          },
          {
            id: "haze-12",
            img: require("../assets/General/haze12.jpg"),
            text: "Follow up with a doctor if symptoms persist.",
          },
        ],
      },
    ],
    externalResources: [
      {
        id: "nea",
        title: "Managing Haze in Singapore",
        desc: "Learn how Singapore monitors air quality, manages transboundary haze, and implements measures to reduce exposure.",
        url: "https://www.nea.gov.sg/our-services/pollution-control/air-pollution/managing-haze",
        logo: require("../assets/External/EX-NEA.jpg"),
      },
      {
        id: "healthhub",
        title: "Protect Yourself Against Haze",
        desc: "Practical steps to safeguard your health during haze periods, including mask usage and home air quality tips.",
        url: "https://www.healthhub.sg/live-healthy/how-to-protect-yourself-against-haze",
        logo: require("../assets/External/EX-Health.jpg"),
      },
      {
        id: "mom",
        title: "Workplace Safety During Haze",
        desc: "Guidelines for employers and workers to stay safe, from adjusting outdoor work to providing protective equipment.",
        url: "https://www.mom.gov.sg/haze",
        logo: require("../assets/External/EX-MOM.jpg"),
      },
      {
        id: "st",
        title: "5 Ways to Protect Yourself",
        desc: "Quick lifestyle tips to reduce haze health risks, from staying indoors to boosting indoor air quality.",
        url: "https://www.straitstimes.com/life/the-life-list-five-ways-to-protect-yourself-when-the-haze-hits",
        logo: require("../assets/External/EX-ST.jpg"),
      },
      {
        id: "mounte",
        title: "Facts About Haze",
        desc: "Understand the causes, effects, and prevention of haze, and learn how to manage related health issues.",
        url: "https://www.mountelizabeth.com.sg/health-plus/article/facts-about-haze",
        logo: require("../assets/External/EX-ME.jpg"),
      },
    ],
  },

  dengue: {
    id: "dengue",
    title: "Dengue Prevention",
    hero: require("../assets/General/dengue-cluster.jpg"),
    description:
      "Learn how to protect yourself and your community from dengue fever, a mosquito-borne disease. Understand its causes, recognise symptoms early, and take proactive measures to prevent outbreaks.",
    reasons: [
      {
        id: "dengue1",
        label: "Stagnant Water",
        icon: require("../assets/Reason/dengue1.png"),
        text: "Aedes mosquitoes breed in small pools—flower pots, pails, roof gutters, tray dishes.",
      },
      {
        id: "dengue2",
        label: "Humid Climate",
        icon: require("../assets/Reason/dengue2.png"),
        text: "Warm, humid conditions speed up mosquito life cycles and virus replication.",
      },
      {
        id: "dengue3",
        label: "Poor Waste Mgmt.",
        icon: require("../assets/Reason/dengue3.png"),
        text: "Discarded containers and clutter collect rainwater, creating breeding sites.",
      },
      {
        id: "dengue4",
        label: "Urban Density",
        icon: require("../assets/Reason/dengue4.png"),
        text: "Close living quarters increase bite exposure and speed cluster spread.",
      },
      {
        id: "dengue5",
        label: "Infected Travellers",
        icon: require("../assets/Reason/dengue5.png"),
        text: "Imported cases can seed local transmission when bitten by Aedes mosquitoes.",
      },
    ],
    sections: [
      {
        id: "Prevention",
        title: "Prevention",
        items: [
          {
            id: "dengue-01",
            img: require("../assets/General/dengue1.jpg"),
            text: "Remove stagnant water from flower pots, buckets, and trays.",
          },
          {
            id: "dengue-02",
            img: require("../assets/General/dengue2.jpg"),
            text: "Clear roof gutters and always ensure proper drainage.",
          },
          {
            id: "dengue-03",
            img: require("../assets/General/dengue3.jpg"),
            text: "Change water in vases, bowls, and birdbaths every 2 days.",
          },
          {
            id: "dengue-04",
            img: require("../assets/General/dengue4.jpg"),
            text: "Install window and door screens to block mosquitoes.",
          },
        ],
      },
      {
        id: "RecognisingSymptoms",
        title: "Recognising Symptoms",
        items: [
          {
            id: "dengue-05",
            img: require("../assets/General/dengue5.jpg"),
            text: "Sudden high fever lasting 2 to 7 days.",
          },
          {
            id: "dengue-06",
            img: require("../assets/General/dengue6.jpg"),
            text: "Severe headache, especially behind eyes.",
          },
          {
            id: "dengue-07",
            img: require("../assets/General/dengue7.jpg"),
            text: "Body muscle and joint pains.",
          },
          {
            id: "dengue-08",
            img: require("../assets/General/dengue8.jpg"),
            text: "Nausea, vomiting, or loss of appetite.",
          },
          {
            id: "dengue-09",
            img: require("../assets/General/dengue9.jpg"),
            text: "Skin rash appearing a few days after fever starts.",
          },
          {
            id: "dengue-10",
            img: require("../assets/General/dengue10.jpg"),
            text: "Bleeding gums, persistent vomiting, abdominal pain.",
          },
        ],
      },
      {
        id: "Treatment&Care",
        title: "Treatment & Care",
        items: [
          {
            id: "dengue-11",
            img: require("../assets/General/dengue11.jpg"),
            text: "Seek medical attention immediately if dengue is suspected.",
          },
          {
            id: "dengue-12",
            img: require("../assets/General/dengue12.jpg"),
            text: "Remember to drink plenty of fluids to prevent dehydration.",
          },
          {
            id: "dengue-13",
            img: require("../assets/General/dengue13.jpg"),
            text: "Rest well and avoid physical exertion until full recovery.",
          },
          {
            id: "dengue-14",
            img: require("../assets/General/dengue14.jpg"),
            text: "Take doctor approved medicines (avoid aspirin/ibuprofen).",
          },
          {
            id: "dengue-15",
            img: require("../assets/General/dengue15.jpg"),
            text: "Use mosquito nets or repellents to avoid infecting others.",
          },
          {
            id: "dengue-16",
            img: require("../assets/General/dengue16.jpg"),
            text: "Follow up with healthcare providers for monitoring.",
          },
        ],
      },
    ],
    externalResources: [
      {
        id: "cgs",
        title: "Block Dengue Campaign",
        desc: "Get weekly tips from the Block Dengue campaign on how to keep your home and neighbourhood mosquito-free.",
        url: "https://www.cgs.gov.sg/blockdengue/home/",
        logo: require("../assets/External/EX-CGS.jpg"),
      },
      {
        id: "singhealth",
        title: "Dengue Symptoms & Treatment",
        desc: "Understand the common signs of dengue and learn when and how medical care is required for safe recovery.",
        url: "https://www.singhealth.com.sg/symptoms-treatments/dengue-fever",
        logo: require("../assets/External/EX-Singhealth.jpg"),
      },
      {
        id: "raffles",
        title: "Dengue Fever Insights",
        desc: "Learn how dengue spreads through Aedes mosquitoes, recognize its symptoms and stay informed to take early action.",
        url: "https://www.rafflesmedicalgroup.com/health-resources/health-articles/what-you-need-to-know-about-dengue-fever/",
        logo: require("../assets/External/EX-Raffles.jpg"),
      },
    ],
  },

  storm: {
    id: "storm",
    title: "Thunderstorm",
    hero: require("../assets/General/thunder-storm.jpg"),
    description:
      "Thunderstorms in Singapore can bring heavy rain, strong winds, lightning strikes, and flash floods. Learn how to protect yourself and reduce risks from lightning and wind damage.",
    reasons: [
      {
        id: "storm1",
        label: "Rising Warm Air",
        icon: require("../assets/Reason/storm1.png"),
        text: "Heated surface air rises rapidly, forming towering cumulonimbus clouds.",
      },
      {
        id: "storm2",
        label: "High Moisture",
        icon: require("../assets/Reason/storm2.png"),
        text: "Abundant humidity fuels cloud growth and intense rainfall.",
      },
      {
        id: "storm3",
        label: "Converging Winds",
        icon: require("../assets/Reason/storm3.png"),
        text: "Sea breeze and monsoon flows collide, triggering strong updrafts.",
      },
      {
        id: "storm4",
        label: "Monsoon Seasons",
        icon: require("../assets/Reason/storm4.png"),
        text: "Seasonal wind patterns enhance storm frequency and severity.",
      },
      {
        id: "storm5",
        label: "Temperature Differences",
        icon: require("../assets/Reason/storm5.png"),
        text: "Sharp contrasts between air masses destabilize the atmosphere.",
      },
    ],
    sections: [
      {
        id: "prepareBefore",
        title: "Prepare Before",
        items: [
          {
            id: "storm-01",
            img: require("../assets/General/storm1.jpg"),
            text: "Monitor weather forecasts and NEA lightning alerts.",
          },
          {
            id: "storm-02",
            img: require("../assets/General/storm2.jpg"),
            text: "Secure loose items outdoors (plants, furniture, tools).",
          },
          {
            id: "storm-03",
            img: require("../assets/General/storm3.jpg"),
            text: "Check drainage around your home to reduce flood risk.",
          },
          {
            id: "storm-04",
            img: require("../assets/General/storm4.jpg"),
            text: "Avoid scheduling outdoor events during storm warnings.",
          },
        ],
      },
      {
        id: "protectDuring",
        title: "Protect Yourself During",
        items: [
          {
            id: "storm-05",
            img: require("../assets/General/storm5.jpg"),
            text: "Seek shelter indoors immediately.",
          },
          {
            id: "storm-06",
            img: require("../assets/General/storm6.jpg"),
            text: "Stay away from open fields, tall trees, and metal poles.",
          },
          {
            id: "storm-07",
            img: require("../assets/General/storm7.jpg"),
            text: "Avoid swimming pools, beaches, or any open water.",
          },
          {
            id: "storm-08",
            img: require("../assets/General/storm8.jpg"),
            text: "Unplug electronics to prevent lightning damage.",
          },
        ],
      },
      {
        id: "recoverAfter",
        title: "Recover After",
        items: [
          {
            id: "storm-09",
            img: require("../assets/General/storm9.jpg"),
            text: "Check for and report fallen trees, damaged power lines, or flooding.",
          },
          {
            id: "storm-10",
            img: require("../assets/General/storm10.jpg"),
            text: "Avoid touching electrical equipment until safe.",
          },
        ],
      },
    ],
    externalResources: [
      {
        id: "cdc",
        title: "Lightning Safety Guidelines",
        desc: "Learn essential lightning safety measures, including first-aid steps to help someone struck by lightning.",
        url: "https://www.cdc.gov/lightning/safety/index.html",
        logo: require("../assets/External/EX-CDC.jpg"),
      },
      {
        id: "mom",
        title: "Adverse Weather Response",
        desc: "Singapore's official WSH guidelines for managing risks during adverse weather; designed for safe workplace practices.",
        url: "https://www.mom.gov.sg/newsroom/press-releases/2025/0404-wsh-guidelines-on-preparing-for-adverse-weather",
        logo: require("../assets/External/EX-MOM.jpg"),
      },
      {
        id: "hyme",
        title: "Lightning Risk Assessment",
        desc: "Insight into how Singapore's built environments can be safeguarded from lightning.",
        url: "https://hy-me.com.sg/lightning-risk-assessment-protection/",
        logo: require("../assets/External/EX-HY.jpg"),
      },
    ],
  },

  wind: {
    id: "wind",
    title: "Strong Wind",
    hero: require("../assets/General/strong-wind.jpg"),
    description:
      "Learn how to stay safe, protect your surroundings, and reduce risks during periods of strong winds and gusty weather in Singapore.",
    reasons: [
      {
        id: "wind1",
        label: "Sumatra Squalls",
        icon: require("../assets/Reason/wind1.png"),
        text: "Fast-moving storm lines from Sumatra can produce sudden, powerful gusts.",
      },
      {
        id: "wind2",
        label: "Monsoon Surges",
        icon: require("../assets/Reason/wind2.png"),
        text: "Cool surges in the Northeast Monsoon bring sustained strong winds.",
      },
      {
        id: "wind3",
        label: "Tropical Storms",
        icon: require("../assets/Reason/wind3.png"),
        text: "Regional cyclones influence pressure gradients and wind strength.",
      },
      {
        id: "wind4",
        label: "Downdraft Bursts",
        icon: require("../assets/Reason/wind4.png"),
        text: "Thunderstorm downdrafts can create brief but damaging outflow winds.",
      },
      {
        id: "wind5",
        label: "Building Channeling",
        icon: require("../assets/Reason/wind5.png"),
        text: "Urban canyons funnel airflow, locally amplifying wind speeds.",
      },
    ],
    sections: [
      {
        id: "wind-prep",
        title: "Prepare Before",
        items: [
          {
            id: "wind1",
            img: require("../assets/General/wind1.jpg"),
            text: "Park vehicles away from trees, lamp posts, and unstable structures.",
          },
          {
            id: "wind2",
            img: require("../assets/General/wind2.jpg"),
            text: "Secure loose outdoor items like plant pots, laundry poles, and signage.",
          },
          {
            id: "wind3",
            img: require("../assets/General/wind3.jpg"),
            text: "Close and lock windows and balcony doors.",
          },
          {
            id: "wind4",
            img: require("../assets/General/wind4.jpg"),
            text: "Avoid scheduling outdoor activities in exposed areas.",
          },
        ],
      },
      {
        id: "wind-during",
        title: "Protect Yourself During",
        items: [
          {
            id: "wind5",
            img: require("../assets/General/wind5.jpg"),
            text: "Stay indoors and away from windows.",
          },
          {
            id: "wind6",
            img: require("../assets/General/wind6.jpg"),
            text: "If outside, seek shelter in a sturdy building.",
          },
          {
            id: "wind7",
            img: require("../assets/General/wind7.jpg"),
            text: "Avoid walking under large trees, power lines, or temp. structures.",
          },
          {
            id: "wind8",
            img: require("../assets/General/wind8.jpg"),
            text: "Be alert for flying debris and the falling branches.",
          },
        ],
      },
      {
        id: "wind-after",
        title: "Recover After",
        items: [
          {
            id: "wind9",
            img: require("../assets/General/wind9.jpg"),
            text: "Clear debris safely—wear gloves and avoid sharp objects.",
          },
          {
            id: "wind10",
            img: require("../assets/General/wind10.jpg"),
            text: "Inspect your property for damage & hazards like loose roof tiles.",
          },
        ],
      },
    ],
    externalResources: [
      {
        id: "met",
        title: "Staying Safe in Strong Wind",
        desc: "Practical guidance from the Met Office on protecting your home, safe travel, and staying secure during high wind events.",
        url: "https://weather.metoffice.gov.uk/warnings-and-advice/seasonal-advice/stay-safe-in-strong-wind",
        logo: require("../assets/External/EX-Met.jpg"),
      },
      {
        id: "mss",
        title: "Learn Weather Phenomena",
        desc: "Explore Singapore’s common weather hazards and understand how they form and affect daily life.",
        url: "https://www.weather.gov.sg/learn_phenomena/",
        logo: require("../assets/External/EX-MSS.jpg"),
      },
    ],
  },

  fire: {
    id: "fire",
    title: "Fire Safety",
    hero: require("../assets/General/fire-safety.jpg"),
    description:
      "Learn how to prevent fires, respond effectively in an emergency, and protect lives and property. Fires can start unexpectedly, but being prepared greatly reduces risks and saves lives.",
    reasons: [
      {
        id: "fire1",
        label: "Unattended Cooking",
        icon: require("../assets/Reason/fire1.png"),
        text: "Grease and oil ignite quickly when left heating without supervision.",
      },
      {
        id: "fire2",
        label: "Overloaded Sockets",
        icon: require("../assets/Reason/fire2.png"),
        text: "Too many devices on a power strip can overheat wiring and outlets.",
      },
      {
        id: "fire3",
        label: "Faulty Wiring",
        icon: require("../assets/Reason/fire3.png"),
        text: "Damaged cables or loose connections can arc and start a blaze.",
      },
      {
        id: "fire4",
        label: "Open Flames",
        icon: require("../assets/Reason/fire4.png"),
        text: "Candles, incense, or lighters near flammables cause accidental ignition.",
      },
      {
        id: "fire5",
        label: "Flammable Storage",
        icon: require("../assets/Reason/fire5.png"),
        text: "Improperly stored solvents or aerosols increase fire intensity.",
      },
    ],
    sections: [
      {
        id: "fire-prevent",
        title: "Fire Prevention Tips",
        items: [
          {
            id: "fire1",
            img: require("../assets/General/fire1.jpg"),
            text: "Install and maintain smoke detectors in key areas of your home.",
          },
          {
            id: "fire2",
            img: require("../assets/General/fire2.jpg"),
            text: "Keep fire extinguishers accessible and know how to use them.",
          },
          {
            id: "fire3",
            img: require("../assets/General/fire3.jpg"),
            text: "Avoid overloading power points and use certified electrical products.",
          },
          {
            id: "fire4",
            img: require("../assets/General/fire4.jpg"),
            text: "Store flammable items in cool, ventilated spaces away from heat.",
          },
        ],
      },
      {
        id: "fire-during",
        title: "During a Fire",
        items: [
          {
            id: "fire5",
            img: require("../assets/General/fire5.jpg"),
            text: "Stay Calm – Alert others and call 995 immediately.",
          },
          {
            id: "fire6",
            img: require("../assets/General/fire6.jpg"),
            text: "If smoke is present, stay low to avoid inhaling toxic fumes.",
          },
          {
            id: "fire7",
            img: require("../assets/General/fire7.jpg"),
            text: "Use a wet cloth to cover your nose and mouth.",
          },
          {
            id: "fire8",
            img: require("../assets/General/fire8.jpg"),
            text: "Evacuate using stairs, never lifts.",
          },
        ],
      },
      {
        id: "fire-after",
        title: "After a Fire",
        items: [
          {
            id: "fire9",
            img: require("../assets/General/fire9.jpg"),
            text: "Wait for SCDF clearance before re-entering premises.",
          },
          {
            id: "fire10",
            img: require("../assets/General/fire10.jpg"),
            text: "Arrange professional inspection of wiring and gas systems.",
          },
        ],
      },
    ],
    externalResources: [
      {
        id: "scdf",
        title: "Fire Safety & Service Directory",
        desc: "Access Singapore's official Fire Safety services, including guides, and downloadable emergency resources etc.",
        url: "https://www.scdf.gov.sg/fire-safety-services-listing",
        logo: require("../assets/External/EX-SCDF.jpg"),
      },
      {
        id: "fss",
        title: "Fire Protection Consultation",
        desc: "Explore local providers offering fire alarms, suppression systems, safety inspections, and consultancy services.",
        url: "https://firesafetysingapore.com/",
        logo: require("../assets/External/EX-Fire.jpg"),
      },
    ],
  },

  aid: {
    id: "aid",
    title: "CPR & First Aid",
    hero: require("../assets/General/first-aid.jpg"),
    description:
      "This guide teaches you how to respond in the first critical minutes of an emergency. Recognize emergencies, when to call 995, hands-only CPR, how to use an AED, and basics.",
    reasons: [
      {
        id: "aid1",
        label: "Life-Saving Skill",
        icon: require("../assets/Reason/aid1.png"),
        text: "Immediate CPR can double or triple survival in cardiac arrest.",
      },
      {
        id: "aid2",
        label: "Stabilize Condition",
        icon: require("../assets/Reason/aid2.png"),
        text: "Basic care limits bleeding, shock, and deterioration before help arrives.",
      },
      {
        id: "aid3",
        label: "Quick Response",
        icon: require("../assets/Reason/aid3.png"),
        text: "Knowing what to do reduces hesitation during critical minutes.",
      },
      {
        id: "aid4",
        label: "Public Safety",
        icon: require("../assets/Reason/aid4.png"),
        text: "More trained bystanders means faster help in crowded places.",
      },
      {
        id: "aid5",
        label: "Emergency Confidence",
        icon: require("../assets/Reason/aid5.png"),
        text: "Practice builds calm decision-making under pressure.",
      },
    ],
    sections: [
      {
        id: "aid-before",
        title: "Before an Emergency",
        items: [
          {
            id: "aid1",
            img: require("../assets/General/aid1.jpg"),
            text: "Enrol in CPR and First Aid courses from recognised providers.",
          },
          {
            id: "aid2",
            img: require("../assets/General/aid2.jpg"),
            text: "Stock with bandages, antiseptic wipes, gloves, and CPR mask.",
          },
          {
            id: "aid3",
            img: require("../assets/General/aid3.jpg"),
            text: "Save SCDF (995) and ambulance contacts in your phone.",
          },
          {
            id: "aid4",
            img: require("../assets/General/aid4.jpg"),
            text: "Learn where Automated External Defibrillators are in your area.",
          },
        ],
      },
      {
        id: "aid-during",
        title: "During an Emergency",
        items: [
          {
            id: "aid5",
            img: require("../assets/General/aid5.jpg"),
            text: "Check for dangers before approaching.",
          },
          {
            id: "aid6",
            img: require("../assets/General/aid6.jpg"),
            text: "Dial emergency services without delay.",
          },
          {
            id: "aid7",
            img: require("../assets/General/aid7.jpg"),
            text: "30 chest compressions + 2 rescue breaths, or hands-only CPR if untrained.",
          },
          {
            id: "aid8",
            img: require("../assets/General/aid8.jpg"),
            text: "Follow AED voice prompts until help arrives.",
          },
        ],
      },
      {
        id: "aid-after",
        title: "After the Emergency",
        items: [
          {
            id: "aid9",
            img: require("../assets/General/aid9.jpg"),
            text: "Continue care until professionals take over.",
          },
          {
            id: "aid10",
            img: require("../assets/General/aid10.jpg"),
            text: "Tell responders what you did and any observations.",
          },
          {
            id: "aid11",
            img: require("../assets/General/aid11.jpg"),
            text: "Restock your first aid kit immediately.",
          },
          {
            id: "aid12",
            img: require("../assets/General/aid12.jpg"),
            text: "Reflect on what went well and what to improve.",
          },
        ],
      },
    ],
    externalResources: [
      {
        id: "vwh",
        title: "First Aid Tips",
        desc: "Explore trusted, step-by-step first-aid procedures for common emergencies—bleeding, choking, burns, fractures.",
        url: "https://www.verywellhealth.com/basic-first-aid-procedures-1298578",
        logo: require("../assets/External/EX-VWH.jpg"),
      },
      {
        id: "src1",
        title: "Disaster Safety Education",
        desc: "Access the Singapore Red Cross's official guide to first-aid principles, universal precautions, and the role of a res-ponder.",
        url: "https://www.preventionweb.net/files/8082_DSEQIKitFirstAidManual.pdf",
        logo: require("../assets/External/EX-SRC.jpg"),
      },
      {
        id: "src2",
        title: "Singapore Guidelines",
        desc: "Delve into the updated local first-aid protocols, including basic cardiac life support and recommendations",
        url: "https://redcross.sg/images/pdfs/SFA-Manual-Rev-1-2020_final.pdf",
        logo: require("../assets/External/EX-SRC.jpg"),
      },
      {
        id: "sfatc",
        title: "Emergency Steps",
        desc: "Learn the simple DRSABCD action plan—Check, Call, Care—forming the foundation of effective emergency response.",
        url: "https://www.firstaidtraining.com.sg/",
        logo: require("../assets/External/EX-SFATC.jpg"),
      },
    ],
  },

  kit: {
    id: "kit",
    title: "Emergency Kits",
    hero: require("../assets/General/emergency-kits.jpg"),
    description:
      "A collection of essential supplies and equipment prepared in advance to support individuals and families during unexpected crises such as natural disasters, accidents, or power outages.",
    reasons: [
      {
        id: "kit1",
        label: "Life-Saving Supplies",
        icon: require("../assets/Reason/kit1.png"),
        text: "Water, food, and first aid keep you safe until help is available.",
      },
      {
        id: "kit2",
        label: "Basic Needs",
        icon: require("../assets/Reason/kit2.png"),
        text: "Lighting, tools, and hygiene items maintain daily function.",
      },
      {
        id: "kit3",
        label: "Reduces Panic",
        icon: require("../assets/Reason/kit3.png"),
        text: "Prepared items provide reassurance and structure during crises.",
      },
      {
        id: "kit4",
        label: "Supports Evacuation",
        icon: require("../assets/Reason/kit4.png"),
        text: "Grab-and-go bags speed safe movement if you must leave quickly.",
      },
      {
        id: "kit5",
        label: "Self-Reliance",
        icon: require("../assets/Reason/kit5.png"),
        text: "Supplies help you manage when services are disrupted.",
      },
    ],
    sections: [
      {
        id: "kit-basics",
        title: "Basic Survival Essentials",
        items: [
          {
            id: "kit1",
            img: require("../assets/General/kit1.jpg"),
            text: "Minimum 4 litres of water per person per day (for drinking & hygiene).",
          },
          {
            id: "kit2",
            img: require("../assets/General/kit2.jpg"),
            text: "Canned goods, energy bars, dried fruits, ready-to-eat meals.",
          },
          {
            id: "kit3",
            img: require("../assets/General/kit3.jpg"),
            text: "Ensure first aid kit is well prepared and not expired.",
          },
          {
            id: "kit4",
            img: require("../assets/General/kit4.jpg"),
            text: "At least 7 days' supply, plus copies of prescriptions.",
          },
        ],
      },
      {
        id: "kit-tools",
        title: "Communication & Safety Tools",
        items: [
          {
            id: "kit5",
            img: require("../assets/General/kit5.jpg"),
            text: "Battery-powered or hand-crank radio (for local emergency alerts).",
          },
          {
            id: "kit6",
            img: require("../assets/General/kit6.jpg"),
            text: "Flashlights & extra batteries (preferably LED).",
          },
          {
            id: "kit7",
            img: require("../assets/General/kit7.jpg"),
            text: "Whistle - essential for signalling help.",
          },
          {
            id: "kit8",
            img: require("../assets/General/kit8.jpg"),
            text: "Fully charged power banks (for mobile devices).",
          },
          {
            id: "kit9",
            img: require("../assets/General/kit9.jpg"),
            text: "Multi-tool or Swiss Army knife - for cutting, repairs, or opening cans.",
          },
          {
            id: "kit10",
            img: require("../assets/General/kit10.jpg"),
            text: "Fire extinguisher - small ABC-rated.",
          },
        ],
      },
      {
        id: "kit-comfort",
        title: "Comfort, Protection & Important Documents",
        items: [
          {
            id: "kit11",
            img: require("../assets/General/kit11.jpg"),
            text: "Warm clothing & blankets - thermal layers, poncho, socks.",
          },
          {
            id: "kit12",
            img: require("../assets/General/kit12.jpg"),
            text: "Dust masks / N95 respirators - for poor air quality or smoke.",
          },
          {
            id: "kit13",
            img: require("../assets/General/kit13.jpg"),
            text: "Plastic sheeting & duct tape - temporary shelter or sealing openings.",
          },
          {
            id: "kit14",
            img: require("../assets/General/kit14.jpg"),
            text: "Personal hygiene items - toothbrush, toothpaste, soap, hand sanitiser, etc.",
          },
        ],
      },
    ],
    externalResources: [
      {
        id: "singhealth",
        title: "Home Emergency Kit",
        desc: "Find recommended items every household should pack—from water and food to first-aid supplies.",
        url: "https://www.healthxchange.sg/how-to-manage/home-safety/home-emergency-kit-every-home-should-have",
        logo: require("../assets/External/EX-Singhealth.jpg"),
      },
      {
        id: "health",
        title: "Every Home Safety",
        desc: "An expert-backed list of essential first-aid supplies and their purposes, including wound care, burns, and basic medications.",
        url: "https://www.healthhub.sg/live-healthy/first-aid-for-every-home",
        logo: require("../assets/External/EX-Health.jpg"),
      },
      {
        id: "scdf",
        title: "Civil Defence Resource Pack",
        desc: "An expert-backed list of essential first-aid supplies and their purposes, including wound care, burns, and basic medications.",
        url: "https://www.scdf.gov.sg/docs/default-source/comm.---volunteers-(docs)/civil-defence-resource-pack.pdf?sfvrsn=26a302c7_1",
        logo: require("../assets/External/EX-SCDF.jpg"),
      },
    ],
  },

  disease: {
    id: "disease",
    title: "Disease Outbreak",
    hero: require("../assets/General/disease-outbreak.jpg"),
    description:
      "Learn how to prevent infection, respond effectively during a disease outbreak, and support recovery efforts. Staying informed and prepared can greatly reduce your risk and help control the spread.",
    reasons: [
      {
        id: "disease1",
        label: "Crowded Spaces",
        icon: require("../assets/Reason/disease1.png"),
        text: "Close contact increases transmission through droplets and aerosols.",
      },
      {
        id: "disease2",
        label: "Poor Hygiene",
        icon: require("../assets/Reason/disease2.png"),
        text: "Infrequent handwashing and surface cleaning allow pathogens to linger.",
      },
      {
        id: "disease3",
        label: "Global Travel",
        icon: require("../assets/Reason/disease3.png"),
        text: "Rapid movement introduces new variants and seeds local chains.",
      },
      {
        id: "disease4",
        label: "Contaminated Sources",
        icon: require("../assets/Reason/disease4.png"),
        text: "Unsafe water or food can spread gastrointestinal infections.",
      },
      {
        id: "disease5",
        label: "Pathogen Mutation",
        icon: require("../assets/Reason/disease5.png"),
        text: "Variants can become more transmissible or immune-evasive.",
      },
    ],
    sections: [
      {
        id: "disease-prevent",
        title: "Prevent Before an Outbreak",
        items: [
          {
            id: "disease1",
            img: require("../assets/General/disease1.jpg"),
            text: "Keep vaccinations up to date (e.g., influenza, COVID-19, Hepatitis).",
          },
          {
            id: "disease2",
            img: require("../assets/General/disease2.jpg"),
            text: "Maintain good personal hygiene—wash hands frequently with soap.",
          },
          {
            id: "disease3",
            img: require("../assets/General/disease3.jpg"),
            text: "Strengthen immunity through healthy diet, exercise, and rest.",
          },
          {
            id: "disease4",
            img: require("../assets/General/disease4.jpg"),
            text: "Stock basic health supplies—masks, thermometer, hand sanitiser.",
          },
        ],
      },
      {
        id: "disease-during",
        title: "Protect During an Outbreak",
        items: [
          {
            id: "disease5",
            img: require("../assets/General/disease5.jpg"),
            text: "Wear masks in crowded or high-risk settings.",
          },
          {
            id: "disease6",
            img: require("../assets/General/disease6.jpg"),
            text: "Practise safe distancing where possible.",
          },
          {
            id: "disease7",
            img: require("../assets/General/disease7.jpg"),
            text: "Disinfect frequently touched surfaces at home and work.",
          },
          {
            id: "disease8",
            img: require("../assets/General/disease8.jpg"),
            text: "Avoid sharing personal items like utensils or towels.",
          },
        ],
      },
      {
        id: "disease-after",
        title: "Recover & Support After an Outbreak",
        items: [
          {
            id: "disease9",
            img: require("../assets/General/disease9.jpg"),
            text: "Continue practising good hygiene to prevent resurgence.",
          },
          {
            id: "disease10",
            img: require("../assets/General/disease10.jpg"),
            text: "Attend follow-up health checks if recommended.",
          },
          {
            id: "disease11",
            img: require("../assets/General/disease11.jpg"),
            text: "Support community vaccination and awareness programmes.",
          },
          {
            id: "disease12",
            img: require("../assets/General/disease12.jpg"),
            text: "Stay updated on post-outbreak public health guidance.",
          },
        ],
      },
    ],
    externalResources: [
      {
        id: "ncis",
        title: "Ongoing Outbreaks",
        desc: "Stay informed with current infectious disease outbreaks in Singapore. Includes updates on active cases, and alerts etc.",
        url: "https://www.ncid.sg/For-General-Public/ongoing-outbreaks/Pages/default.aspx",
        logo: require("../assets/External/EX-NCIS.jpg"),
      },
      {
        id: "cdas",
        title: "Infectious Disease Bulletin",
        desc: "Access the latest official disease surveillance data from weekly bulletins released by the CDA.",
        url: "https://www.cda.gov.sg/resources/weekly-infectious-diseases-bulletin-2025",
        logo: require("../assets/External/EX-CDAS.jpg"),
      },
      {
        id: "ncis2",
        title: "Pandemic Framework",
        desc: "Learn about Singapore's strategic pandemic preparedness framework—how our systems detect, respond to, and recover from large-scale disease threats.",
        url: "https://www.ncid.sg/News-Events/News/Pages/Singapore-public-hospitals-in-%E2%80%98outbreak-response-mode'.aspx",
        logo: require("../assets/External/EX-NCIS.jpg"),
      },
      {
        id: "cdas2",
        title: "Hospital Outbreak Response",
        desc: "Understand how public hospitals activate outbreak response mode—including infection control and scaling operations to manage disease surges.",
        url: "https://www.cda.gov.sg/public/pandemic-preparedness",
        logo: require("../assets/External/EX-CDAS.jpg"),
      },
    ],
  },

  earthquake: {
    id: "earthquake",
    title: "Earthquake",
    hero: require("../assets/General/earthquake.jpg"),
    description:
      "Even though Singapore is not located on a major fault line, tremors from regional earthquakes can still be felt. Being prepared helps you stay calm and act quickly when the ground shakes.",
    reasons: [
      {
        id: "earthquake1",
        label: "Tectonic Plate",
        icon: require("../assets/Reason/earthquake1.png"),
        text: "Stress accumulates along plate boundaries until it releases suddenly.",
      },
      {
        id: "earthquake2",
        label: "Subduction Zones",
        icon: require("../assets/Reason/earthquake2.png"),
        text: "One plate dives beneath another, generating powerful quakes.",
      },
      {
        id: "earthquake3",
        label: "Volcanic Activity",
        icon: require("../assets/Reason/earthquake3.png"),
        text: "Magma movement and eruptions can trigger seismic shaking.",
      },
      {
        id: "earthquake4",
        label: "Fault Slippage",
        icon: require("../assets/Reason/earthquake4.png"),
        text: "Sudden movement along faults releases energy as seismic waves.",
      },
      {
        id: "earthquake5",
        label: "Aftershocks",
        icon: require("../assets/Reason/earthquake5.png"),
        text: "Smaller quakes follow as the crust readjusts after a main event.",
      },
    ],
    sections: [
      {
        id: "eq-indoors",
        title: "If Tremors are Felt Indoors",
        items: [
          {
            id: "earthquake1",
            img: require("../assets/General/earthquake1.jpg"),
            text: "Drop, Cover, Hold On - Get under sturdy furniture and protect your head.",
          },
          {
            id: "earthquake2",
            img: require("../assets/General/earthquake2.jpg"),
            text: "Stay Away from Glass - Keep clear of windows and mirrors.",
          },
          {
            id: "earthquake3",
            img: require("../assets/General/earthquake3.jpg"),
            text: "Do Not Use Lifts - Use stairs only after shaking stops.",
          },
          {
            id: "earthquake4",
            img: require("../assets/General/earthquake4.jpg"),
            text: "Stay Indoors Until Safe - Avoid rushing outside during shaking.",
          },
          {
            id: "earthquake5",
            img: require("../assets/General/earthquake5.jpg"),
            text: "Turn Off Utilities - If possible, shut off gas and electricity.",
          },
          {
            id: "earthquake6",
            img: require("../assets/General/earthquake6.jpg"),
            text: "Remain Calm - Reassure those around you, especially children.",
          },
        ],
      },
      {
        id: "eq-outdoors",
        title: "If Tremors are Felt Outdoors",
        items: [
          {
            id: "earthquake7",
            img: require("../assets/General/earthquake7.jpg"),
            text: "Move to Open Space - Away from buildings, trees, and power lines.",
          },
          {
            id: "earthquake8",
            img: require("../assets/General/earthquake8.jpg"),
            text: "Avoid Bridges & Overpasses - They may be unstable.",
          },
          {
            id: "earthquake9",
            img: require("../assets/General/earthquake9.jpg"),
            text: "Stay Low - Drop to the ground to avoid being knocked over.",
          },
          {
            id: "earthquake10",
            img: require("../assets/General/earthquake10.jpg"),
            text: "Follow Official Guidance - Listen to emergency broadcasts.",
          },
        ],
      },
      {
        id: "eq-after",
        title: "After the Tremor",
        items: [
          {
            id: "earthquake11",
            img: require("../assets/General/earthquake11.jpg"),
            text: "Check for injuries - Provide first aid if needed.",
          },
          {
            id: "earthquake12",
            img: require("../assets/General/earthquake12.jpg"),
            text: "Inspect for hazards - Watch for gas leaks or electrical damage.",
          },
          {
            id: "earthquake13",
            img: require("../assets/General/earthquake13.jpg"),
            text: "Be alert for aftershocks - They can be as dangerous.",
          },
          {
            id: "earthquake14",
            img: require("../assets/General/earthquake14.jpg"),
            text: "Report structural damage - Notify relevant authorities.",
          },
        ],
      },
    ],
    externalResources: [
      {
        id: "nlb",
        title: "Earthquake Awareness Feature",
        desc: "Explore Earthquake-focused books and resources to deepen your understanding of seismic safety and preparedness.",
        url: "https://www.nlb.gov.sg/main/article-detail?cmsuuid=faae6249-89e7-4903-af54-809278f37345 ",
        logo: require("../assets/External/EX-NLB.jpg"),
      },
      {
        id: "aa",
        title: "Infectious Disease Bulletin",
        desc: "Practice and learn about the basic guide on steps to take if you are caught in one even you are in a “safe” place for now.",
        url: "https://aa-highway.com.sg/its-an-earthquake/",
        logo: require("../assets/External/EX-AA.jpg"),
      },
    ],
  },
};

// Helper to fetch a single guide by id
export const getGuideById = (id) => PREPAREDNESS_GUIDES[id];
