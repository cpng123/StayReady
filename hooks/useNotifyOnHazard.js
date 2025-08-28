// hooks/useNotifyOnHazard.js
import { useEffect, useRef } from "react";
import { maybeNotifyHazard } from "../utils/notify";

/**
 * Fires a local notification when the top hazard KIND changes
 * (e.g., none -> flood, haze -> wind, etc). Works for all hazards.
 */
export default function useNotifyOnHazard(hazard) {
  const prevKindRef = useRef(hazard?.kind);
  const prevSevRef = useRef(hazard?.severity);

  useEffect(() => {
    const prev = prevKindRef.current;
    const kind = hazard?.kind;
    const prevSev = prevSevRef.current;
    const sev = hazard?.severity;

    // Only notify on transition into a real hazard (not "none")
    // to avoid spamming while values update
    const REAL_KINDS = new Set(["flood", "haze", "dengue", "wind", "heat"]);
    const kindChanged = REAL_KINDS.has(kind) && prev !== kind;
    const escalated =
      REAL_KINDS.has(kind) &&
      (prevSev === "warning" || prevSev === "safe") &&
      sev === "danger";
    if (kindChanged || escalated) {
      maybeNotifyHazard(hazard);
    }

    prevKindRef.current = kind;
    prevSevRef.current = sev;
  }, [hazard?.kind, hazard?.severity, hazard?.locationName, hazard?.title]);
}
