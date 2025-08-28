// utils/useNotifyOnHazard.js
import { useEffect, useRef } from "react";
import { maybeNotifyHazard } from "./notify";

/**
 * Fires a local notification when the top hazard KIND changes
 * (e.g., none -> flood, haze -> wind, etc). Works for all hazards.
 */
export default function useNotifyOnHazard(hazard) {
  const prevKindRef = useRef(hazard?.kind);

  useEffect(() => {
    const prev = prevKindRef.current;
    const kind = hazard?.kind;

    // Only notify on transition into a real hazard (not "none")
    // to avoid spamming while values update
    const REAL_KINDS = new Set(["flood", "haze", "dengue", "wind", "heat"]);
    if (REAL_KINDS.has(kind) && prev !== kind) {
      maybeNotifyHazard(hazard);
    }

    prevKindRef.current = kind;
  }, [hazard?.kind, hazard?.severity, hazard?.locationName, hazard?.title]);
}
