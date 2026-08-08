import { useShallow } from "zustand/react/shallow";

import { useMeterSettingsStore } from "@/stores/useMeterSettingsStore";
import { GoldRules } from "@/violations";

/**
 * The two gold-rule checkboxes (Settings → General), in the shape the tone
 * functions take. Components that colour by legality tone subscribe here so a
 * checkbox flip re-colours them on the next render; event-driven code reads
 * the store directly instead, through `getState()`.
 */
export default function useGoldRules(): GoldRules {
  return useMeterSettingsStore(
    useShallow((state) => ({
      perfectSummons: state.gold_perfect_summons,
      perfectOvermasteries: state.gold_perfect_overmasteries,
    }))
  );
}
