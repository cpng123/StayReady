/**
 * File: hooks/useNotifyOnHazard.js
 * Purpose: Watch the current top hazard and trigger a local notification
 *          when the hazard KIND changes (e.g., none→flood, haze→wind) or
 *          when severity escalates to "danger".
 *
 * Responsibilities:
 *  - Keep refs of the previous {kind, severity} across renders.
 *  - On each change, decide whether to notify (kind change into a real hazard,
 *    or severity escalation to danger).
 *  - Delegate actual scheduling + rate-limiting to utils/notify.maybeNotifyHazard.
 *
 * Notes:
 *  - “Real hazards” considered: flood, haze, dengue, wind, heat.
 *  - Rate limiting (e.g., one per kind per 60s) and user prefs (Danger-only vs All)
 *    are handled inside maybeNotifyHazard().
 *  - Pass the same `hazard` shape returned by your classifiers/useHazards.
 */

import { useEffect, useRef } from "react";
import { maybeNotifyHazard } from "../utils/notify";

export default function useNotifyOnHazard(hazard) {
  // Track previous state across renders to detect transitions
  const prevKindRef = useRef(hazard?.kind);
  const prevSevRef = useRef(hazard?.severity);

  useEffect(() => {
    const prevKind = prevKindRef.current;
    const kind = hazard?.kind;

    const prevSev = prevSevRef.current;
    const sev = hazard?.severity;

    // Only consider real hazard kinds (ignore "none")
    const REAL_KINDS = new Set(["flood", "haze", "dengue", "wind", "heat"]);

    // Notify if: kind changes into a real hazard
    const kindChanged = REAL_KINDS.has(kind) && prevKind !== kind;

    // Or: severity escalates to "danger" (from "safe" or "warning")
    const escalated =
      REAL_KINDS.has(kind) &&
      (prevSev === "warning" || prevSev === "safe") &&
      sev === "danger";

    if (kindChanged || escalated) {
      // Safe to call: internal function handles cooldown + user settings
      maybeNotifyHazard(hazard);
    }

    // Update refs for next render
    prevKindRef.current = kind;
    prevSevRef.current = sev;
  }, [hazard?.kind, hazard?.severity, hazard?.locationName, hazard?.title]);
}
