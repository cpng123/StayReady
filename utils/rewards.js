// utils/rewards.js
// Single source of truth for rewards + any future helpers.

export const REWARDS_DATA = [
  {
    id: "r1",
    title: "Mini First Aid Kit",
    desc: "Compact and portable. Fits into a bag for everyday readiness.",
    points: 2000,
    image: require("../assets/External/reward1.jpg"),
  },
  {
    id: "r2",
    title: "Emergency Whistle & Torch",
    desc: "Helps attract attention during emergencies, even in the dark.",
    points: 1500,
    image: require("../assets/External/reward2.jpg"),
  },
  {
    id: "r3",
    title: "Reusable Face Masks",
    desc: "Useful during haze (PM2.5), disease outbreaks, or polluted conditions.",
    points: 600,
    image: require("../assets/External/reward3.jpg"),
  },
  {
    id: "r4",
    title: "Emergency Water Pouches",
    desc: "Shelf-stable water. 5-year shelf life. Example: 4 × 4.22 oz packets.",
    points: 2500,
    image: require("../assets/External/reward4.jpg"),
  },
  {
    id: "r5",
    title: "Survival Blanket",
    desc: "Heat retention, wind & water resistant; useful for storms & cold nights.",
    points: 1200,
    image: require("../assets/External/reward5.jpg"),
  },

  // $1 donations (100 pts)
  {
    id: "don-src-1",
    title: "$1 Donation to Red Cross",
    desc: "Support emergency relief efforts.",
    points: 100,
    image: require("../assets/External/EX-SRC.jpg"),
  },
  {
    id: "don-scdf-1",
    title: "$1 Donation to SCDF Community Program",
    desc: "Supports local emergency preparedness programs.",
    points: 100,
    image: require("../assets/External/EX-SCDF.jpg"),
  },

  // $5 donations (500 pts)
  {
    id: "don-src-5",
    title: "$5 Donation to Red Cross",
    desc: "Support emergency relief efforts.",
    points: 500,
    image: require("../assets/External/EX-SRC.jpg"),
  },
  {
    id: "don-scdf-5",
    title: "$5 Donation to SCDF Community Program",
    desc: "Supports local emergency preparedness programs.",
    points: 500,
    image: require("../assets/External/EX-SCDF.jpg"),
  },
];

// If you ever fetch/transform later, keep this function signature.
export function getRewards() {
  return REWARDS_DATA.slice();
}
