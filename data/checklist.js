// data/checklist.js

// --- Tabs order (Safety first, then First Aid) ---
export const CHECKLIST_FILTERS = [
  { id: "safety",   label: "Safety" },
  { id: "firstaid", label: "First Aid" },
  { id: "home",     label: "Home" },
  { id: "supplies", label: "Supplies" },
  { id: "recovery", label: "Recovery" },
];

/** Color palette applied per tab in order of categories.
 * 1st category is BLUE (#3B82F6), 2nd AMBER, then PURPLE, CYAN, RED, GREEN (repeats as needed).
 */
const PALETTE = ["#3B82F6", "#F59E0B", "#A855F7", "#06B6D4", "#EF4444", "#22C55E"];

const colorize = (sections) =>
  (sections || []).map((s, i) => ({ ...s, color: s.color || PALETTE[i % PALETTE.length] }));

/** Sections per tab. Keep item IDs globally unique. */
const RAW_SECTIONS = {
  // ---------------- SAFETY (now first tab) ----------------
  safety: [
    {
      id: "safe-evac",
      title: "Evacuation Plan",
      items: [
        { id: "safe-1",  text: "Identify route to higher ground", done: false },
        { id: "safe-2",  text: "Know nearest shelter/community centre", done: false },
        { id: "safe-3",  text: "Keep go-bag by the door", done: false },
        { id: "safe-4",  text: "Plan for pets (carrier/food/docs)", done: false },
      ],
    },
    {
      id: "safe-comm",
      title: "Communication Plan",
      items: [
        { id: "safe-5",  text: "Agree on family meetup point", done: false },
        { id: "safe-6",  text: "List out-of-area contact", done: false },
        { id: "safe-7",  text: "Save hotlines: PUB, SCDF (995), Police (999)", done: false },
        { id: "safe-8",  text: "Enable emergency alerts on your phone", done: false },
      ],
    },
    {
      id: "safe-shelter",
      title: "Shelter-in-Place",
      items: [
        { id: "safe-9",   text: "Secure windows/doors; close curtains", done: false },
        { id: "safe-10",  text: "Prepare ventilation (avoid fumes/CO)", done: false },
        { id: "safe-11",  text: "Keep radio/phone for official updates", done: false },
      ],
    },
    {
      id: "safe-fire",
      title: "Fire Safety & Hazards",
      items: [
        { id: "safe-12", text: "Check smoke alarm works; spare batteries", done: false },
        { id: "safe-13", text: "Know extinguisher location & PASS steps", done: false },
        { id: "safe-14", text: "Keep escape paths clear (no blocked doors)", done: false },
        { id: "safe-15", text: "Never overload power strips or sockets", done: false },
      ],
    },
    {
      id: "safe-utilities",
      title: "Utilities & Electrical Safety",
      items: [
        { id: "safe-16", text: "Know where to shut off main power/water/gas", done: false },
        { id: "safe-17", text: "Unplug appliances if water is rising", done: false },
        { id: "safe-18", text: "Keep extension cords off the floor", done: false },
      ],
    },
  ],

  // ---------------- FIRST AID (now second tab) ----------------
  firstaid: [
    {
      id: "fa-kit-min",
      title: "First Aid Kit — Essentials",
      items: [
        { id: "fae-1",  text: "Assorted adhesive plasters/band-aids", done: false },
        { id: "fae-2",  text: "Sterile gauze pads & roller bandage", done: false },
        { id: "fae-3",  text: "Medical tape (adhesive)", done: false },
        { id: "fae-4",  text: "Antiseptic wipes / alcohol swabs", done: false },
        { id: "fae-5",  text: "Antibiotic ointment (topical)", done: false },
        { id: "fae-6",  text: "Scissors (blunt tip) & tweezers", done: false },
        { id: "fae-7",  text: "Disposable gloves (nitrile), 4–6 pcs", done: false },
        { id: "fae-8",  text: "CPR face shield (one-way valve)", done: false },
        { id: "fae-9",  text: "Instant cold pack", done: false },
        { id: "fae-10", text: "Triangular bandage / sling", done: false },
      ],
    },
    {
      id: "fa-meds",
      title: "Medications & Special Items",
      items: [
        { id: "fam-1", text: "Personal prescriptions (3–7 days)", done: false },
        { id: "fam-2", text: "Pain reliever (e.g., paracetamol/ibuprofen)", done: false },
        { id: "fam-3", text: "Antihistamine (allergy), e.g., loratadine", done: false },
        { id: "fam-4", text: "Oral rehydration salts", done: false },
        { id: "fam-5", text: "Spare inhaler / EpiPen if prescribed", done: false },
        { id: "fam-6", text: "Burn gel / hydrogel dressing", done: false },
        { id: "fam-7", text: "Digital thermometer & spare battery", done: false },
      ],
    },
    {
      id: "fa-skills",
      title: "Skills & Reference",
      items: [
        { id: "fas-1", text: "Know CPR steps (adult/child)", done: false },
        { id: "fas-2", text: "Learn bleeding control & shock signs", done: false },
        { id: "fas-3", text: "Pack a compact first aid handbook/app", done: false },
        { id: "fas-4", text: "Emergency contacts & GP clinic list", done: false },
      ],
    },
    {
      id: "fa-hygiene",
      title: "Hygiene & Infection Control",
      items: [
        { id: "fah-1", text: "Hand sanitizer, soap, masks", done: false },
        { id: "fah-2", text: "Waste bags for biohazards/sharps", done: false },
        { id: "fah-3", text: "Wound cleaning (saline/water)", done: false },
      ],
    },
  ],

  // ---------------- HOME ----------------
  home: [
    {
      id: "home-prep",
      title: "Home Preparation",
      items: [
        { id: "home-1", text: "Move important documents to higher shelves", done: false },
        { id: "home-2", text: "Move electronics and valuables to higher shelves", done: false },
        { id: "home-3", text: "Check and clear floor drains/balconies", done: false },
        { id: "home-4", text: "Secure loose items near windows", done: false },
      ],
    },
    {
      id: "home-electrical",
      title: "Electrical Safety",
      items: [
        { id: "elec-1", text: "Unplug appliances if water is rising", done: false },
        { id: "elec-2", text: "Know the main power switch location", done: false },
        { id: "elec-3", text: "Switch off main power if advised/unsafe", done: false },
        { id: "elec-4", text: "Keep extension cords off the floor", done: false },
      ],
    },
    {
      id: "home-property",
      title: "Property Protection",
      items: [
        { id: "prop-1", text: "Elevate furniture or place on blocks", done: false },
        { id: "prop-2", text: "Use door/window barriers if available", done: false },
        { id: "prop-3", text: "Photograph valuables for records", done: false },
        { id: "prop-4", text: "Review insurance coverage details", done: false },
      ],
    },
    {
      id: "home-sanitation",
      title: "Sanitation & Cleanliness",
      items: [
        { id: "san-1", text: "Bag & secure rubbish; avoid clogs", done: false },
        { id: "san-2", text: "Stock trash bags & disinfectant", done: false },
        { id: "san-3", text: "Keep wet/dry wipes accessible", done: false },
        { id: "san-4", text: "Separate clean vs. contaminated items", done: false },
      ],
    },
  ],

  // ---------------- SUPPLIES ----------------
  supplies: [
    {
      id: "sup-bag",
      title: "Emergency Bag Essentials",
      items: [
        { id: "sup-1", text: "Pack bottled water (2L per person/day)", done: false },
        { id: "sup-2", text: "Pack torchlight & spare batteries", done: false },
        { id: "sup-3", text: "Pack non-perishable food (3 days)", done: false },
        { id: "sup-4", text: "Include first aid kit", done: false },
      ],
    },
    {
      id: "sup-docs",
      title: "Documents & Cash",
      items: [
        { id: "sup-5", text: "IDs, insurance, medical info (copies)", done: false },
        { id: "sup-6", text: "Small cash & stored value cards", done: false },
        { id: "sup-7", text: "Emergency contacts list", done: false },
      ],
    },
    {
      id: "sup-tools",
      title: "Tools & Equipment",
      items: [
        { id: "sup-8",  text: "Multi-tool & duct tape", done: false },
        { id: "sup-9",  text: "Portable phone charger/power bank", done: false },
        { id: "sup-10", text: "Rain gear & ponchos", done: false },
      ],
    },
    {
      id: "sup-hygiene",
      title: "Water, Hygiene & Food Safety",
      items: [
        { id: "sup-11", text: "Water purification tablets/filter", done: false },
        { id: "sup-12", text: "Soap, sanitizer, masks, gloves", done: false },
        { id: "sup-13", text: "Manual can opener & utensils", done: false },
      ],
    },
  ],

  // ---------------- RECOVERY ----------------
  recovery: [
    {
      id: "rec-assess",
      title: "Damage Assessment",
      items: [
        { id: "rec-1", text: "Wait for official all-clear", done: false },
        { id: "rec-2", text: "Document damage with photos/videos", done: false },
        { id: "rec-3", text: "Avoid energized/wet electrical areas", done: false },
      ],
    },
    {
      id: "rec-insurance",
      title: "Insurance & Assistance",
      items: [
        { id: "rec-4", text: "Contact insurer & file claim", done: false },
        { id: "rec-5", text: "Track expenses/receipts", done: false },
        { id: "rec-6", text: "Check relief/assistance schemes", done: false },
      ],
    },
    {
      id: "rec-clean",
      title: "Cleaning & Disinfection",
      items: [
        { id: "rec-7", text: "Wear gloves/boots; ventilate area", done: false },
        { id: "rec-8", text: "Discard contaminated porous items", done: false },
        { id: "rec-9", text: "Disinfect hard surfaces thoroughly", done: false },
      ],
    },
  ],
};

// translated filters (keeps IDs stable) 
export const getChecklistFilters = (t) => [
  { id: "safety",   label: t("filters.safety",   "Safety") },
  { id: "firstaid", label: t("filters.firstaid", "First Aid") },
  { id: "home",     label: t("filters.home",     "Home") },
  { id: "supplies", label: t("filters.supplies", "Supplies") },
  { id: "recovery", label: t("filters.recovery", "Recovery") },
];

export const getSectionsByFilterI18n = (filterId, t) => {
  const base = RAW_SECTIONS[filterId] || [];
  const localized = base.map((sec) => ({
    ...sec,
    // NOTE: no "checklist." prefix here
    title: t(`titles.${sec.id}`, sec.title),
    items: (sec.items || []).map((it) => ({
      ...it,
      text: t(`items.${it.id}`, it.text),
    })),
  }));
  return colorize(localized);
};

// Keep this convenience alias
export const getSectionsByFilter = (filterId, t) =>
  getSectionsByFilterI18n(filterId, t);