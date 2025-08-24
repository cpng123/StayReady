// utils/rewards.js
import AsyncStorage from "@react-native-async-storage/async-storage";

/** STORAGE KEYS */
const REDEEMED_TOTAL_KEY = "rewards:redeemedTotal";
const REDEEMED_HISTORY_KEY = "rewards:history";

/** Rewards dataset (now with richer longDesc + details for every item) */
export const REWARDS_DATA = [
  {
    id: "r1",
    title: "Mini First Aid Kit",
    desc: "Compact and portable. Fits into a bag for everyday readiness.",
    points: 2000,
    image: require("../assets/External/reward1.jpg"),
    longDesc:
      "Multi-award-winning Mini First Aid have produced a First Aid Kit specifically for families. It’s the perfect size to keep in a changing bag, backpack, car glovebox or at home. Inside are the core items recommended by paramedics—ready to clean, cover and secure minor wounds, soothe burns, and support small sprains until you can seek further care. A quick-reference guide helps you act confidently.",
    details: [
      "2 × Low-Adherent Wound Pads",
      "2 × Conforming Bandages",
      "1 × Pair of Shears (rounded tip, paramedic-recommended)",
      "1 × Adhesive Tape Roll",
      "2 × Burn Gel Sachets",
      "20 × Children's Washproof Plasters",
      "20 × Unprinted Washproof Plasters, 7cm × 2cm",
      "4 × Elbow / Knee Plasters",
      "4 × Non-Alcohol Wipes",
      "1 × Metal Tweezers",
      "6 × Safety Pins",
      "1 × Information Leaflet (first-aid quick guide)",
      "10 × Bravery Stickers",
      "Zipped soft case (water-resistant), 16 × 12 × 5 cm",
    ],
  },
  {
    id: "r2",
    title: "Emergency Whistle & Torch",
    desc: "120 dB electronic whistle with built-in LED torch for signalling.",
    points: 1500,
    image: require("../assets/External/reward2.jpg"),
    longDesc:
      "Be heard and be seen. This hygienic, hands-free electronic whistle reaches up to 120 dB—far louder than a typical mouth whistle—and the integrated LED torch helps you signal in low-light conditions. Great for emergencies, outdoor activities, crowd management or night walks. Rechargeable via USB and designed to be simple and reliable when you need it most.",
    details: [
      "Electronic whistle body with integrated LED torch (up to 120 dB)",
      "3 whistle tones and 3 volume levels",
      "Torch modes: High / Low / Strobe",
      "Rechargeable Li-ion battery (≈300 mAh), 1.5–2 h full charge",
      "Runtime: up to ~2 h siren use / ~3–4 h torch (mode-dependent)",
      "USB charging cable",
      "Wrist lanyard and belt/clip pouch",
      "IPX4 splash-resistant housing",
      "Weight ≈ 60 g; compact 13 × 3 × 3 cm",
      "User quick-start guide",
    ],
  },
  {
    id: "r3",
    title: "Reusable Face Masks",
    desc: "Washable adult mask with PM2.5 filters and adjustable fit.",
    points: 600,
    image: require("../assets/External/reward3.jpg"),
    longDesc:
      "A comfortable, reusable mask suitable for everyday use during haze, flu season or when travelling. The soft-touch fabric is gentle on skin, and a mouldable nose bridge plus adjustable ear loops help reduce fogging and improve fit. PM2.5 activated-carbon filters add an extra layer for dusty commutes or crowded spaces.",
    details: [
      "1 × Reusable adult mask (3-layer cotton/poly blend)",
      "2 × PM2.5 activated-carbon filters (insertable)",
      "Adjustable ear loops for comfort",
      "Mouldable nose wire to improve seal & reduce glasses fog",
      "Washable; recommended to remove filter before washing",
      "Typical filter replacement: every 3–7 days of use (conditions vary)",
      "Resealable storage pouch for hygiene on the go",
      "One size fits most (unisex)",
    ],
  },
  {
    id: "r4",
    title: "Emergency Water Pouches",
    desc: "UHT-sterilized drinking water in foil pouches. 5-year shelf life.",
    points: 2500,
    image: require("../assets/External/reward4.jpg"),
    longDesc:
      "Clean drinking water is the #1 priority after a disaster. These individually sealed foil pouches are easy to ration, quick to hand out, and protected from light and contaminants. They store compactly in homes, cars or offices and help you maintain a basic emergency supply with minimal fuss.",
    details: [
      "62 × 125 ml foil pouches (total ≈ 7.75 L)",
      "Ultra-high temperature (UHT) sterilized water",
      "5-year shelf life (store in a cool, dry place)",
      "Heat-sealed, easy-tear pouches; no bottle opener required",
      "Compact for go-bags or car kits; portion-controlled to reduce waste",
      "Lot/expiry printed on outer pack",
      "Complies with common emergency-relief packaging standards",
      "Intended for emergency use and short-term hydration",
    ],
  },
  {
    id: "r5",
    title: "Survival Blanket",
    desc: "Reflective thermal blanket to retain body heat in cold, wind or rain.",
    points: 1200,
    image: require("../assets/External/reward5.jpg"),
    longDesc:
      "A lightweight mylar emergency blanket that reflects up to 90% of body heat to help prevent hypothermia. Use it as a wrap, improvised shelter, ground sheet, rain cover or signalling device. Packs tiny—ideal for hiking kits, vehicles and home emergency drawers.",
    details: [
      "1 × Thermal emergency blanket (approx. 210 × 130 cm)",
      "Reflective mylar surface—retains up to 90% body heat",
      "Waterproof and windproof; blocks rain and spray",
      "High-visibility reflective finish for signalling",
      "Reusable if handled gently; tear-resistant film",
      "Packed size ≈ 12 × 8 × 2 cm; weight ≈ 55 g",
      "Multi-use: wrap, shelter roof, ground sheet, poncho or signal panel",
    ],
  },

  // $1 donations (100 pts)
  {
    id: "don-src-1",
    title: "$1 Donation to Red Cross",
    desc: "Support emergency relief efforts.",
    points: 100,
    image: require("../assets/External/EX-SRC.jpg"),
    longDesc:
      "Exchange your points for a small charitable contribution. Your $1 equivalent helps fund disaster relief, first-aid training, blood services and community programmes. This is a demo for a school project—no real money is transferred.",
    details: [
      "No physical item will be shipped",
      "In-app confirmation of your support (demo only)",
      "Not tax-deductible; for demonstration/education",
      "Helps illustrate how points could translate into real-world impact",
    ],
  },
  {
    id: "don-scdf-1",
    title: "$1 Donation to SCDF Community Program",
    desc: "Supports local emergency preparedness programs.",
    points: 100,
    image: require("../assets/External/EX-SCDF.jpg"),
    longDesc:
      "Direct your points toward community readiness—CPR/AED awareness, CERT outreach and public education about emergency response. This is a demonstration only; no funds are actually transferred in this project build.",
    details: [
      "No physical item will be shipped",
      "In-app confirmation of your support (demo only)",
      "Not tax-deductible; for demonstration/education",
      "Encourages a culture of preparedness and volunteerism",
    ],
  },

  // $5 donations (500 pts)
  {
    id: "don-src-5",
    title: "$5 Donation to Red Cross",
    desc: "Support emergency relief efforts.",
    points: 500,
    image: require("../assets/External/EX-SRC.jpg"),
    longDesc:
      "Make a bigger impact by converting more points into a $5 equivalent donation. In a real deployment this would help sustain relief supplies, volunteer training and recovery programmes. This school project mimics the flow only—no real transaction occurs.",
    details: [
      "No physical item will be shipped",
      "In-app confirmation of your support (demo only)",
      "Not tax-deductible; for demonstration/education",
      "Shows how higher tiers could create greater impact",
    ],
  },
  {
    id: "don-scdf-5",
    title: "$5 Donation to SCDF Community Program",
    desc: "Supports local emergency preparedness programs.",
    points: 500,
    image: require("../assets/External/EX-SCDF.jpg"),
    longDesc:
      "Convert your points into a larger symbolic contribution supporting community preparedness and resilience. As this is a school project, the flow is simulated and no funds are moved.",
    details: [
      "No physical item will be shipped",
      "In-app confirmation of your support (demo only)",
      "Not tax-deductible; for demonstration/education",
      "Highlights how loyalty points could fuel preparedness initiatives",
    ],
  },
];

export function getRewards() {
  return REWARDS_DATA.slice();
}

/** Redemption helpers */
export async function getRedeemedTotal() {
  try {
    const raw = await AsyncStorage.getItem(REDEEMED_TOTAL_KEY);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

/** Convenience: compute available balance from earned - redeemed */
export function computeAvailablePoints(earned, redeemedTotal) {
  return Math.max(0, (Number(earned) || 0) - (Number(redeemedTotal) || 0));
}

/**
 * Redeem an item. This **does not** recalc your earned XP; it only
 * increments the “redeemed” total and stores a small history entry.
 * Returns { ok, redeemedTotal }.
 */
export async function redeemItem(item) {
  const pts = Number(item?.points) || 0;
  if (pts <= 0) return { ok: false, redeemedTotal: await getRedeemedTotal() };

  const redeemedTotal = (await getRedeemedTotal()) + pts;

  try {
    await AsyncStorage.setItem(REDEEMED_TOTAL_KEY, String(redeemedTotal));

    // store small history record
    const raw = await AsyncStorage.getItem(REDEEMED_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.unshift({
      id: item.id,
      title: item.title,
      points: pts,
      ts: Date.now(),
    });
    await AsyncStorage.setItem(REDEEMED_HISTORY_KEY, JSON.stringify(history));

    return { ok: true, redeemedTotal };
  } catch {
    return { ok: false, redeemedTotal: await getRedeemedTotal() };
  }
}
