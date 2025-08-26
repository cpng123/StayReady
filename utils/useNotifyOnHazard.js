// hooks/useNotifyOnHazard.js
import { useEffect, useRef } from "react";
import { maybeNotifyFlood } from "./notify";

export default function useNotifyOnHazard(hazard) {
  const prevKindRef = useRef(hazard?.kind);
  useEffect(() => {
    const prev = prevKindRef.current;
    if (hazard?.kind === "flood" && prev !== "flood") {
      // Only notify on transition into flood to avoid spam
      maybeNotifyFlood(hazard);
    }
    prevKindRef.current = hazard?.kind;
  }, [hazard?.kind, hazard?.title, hazard?.locationName]);
}
