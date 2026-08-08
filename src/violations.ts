/**
 * What a finding is a violation OF, in the reader's terms.
 *
 * The twelve rules are how the audit is computed; they are not how anyone
 * thinks about it. A reader looks at a person and asks "what about their build
 * could not exist?", and the answer is a piece of equipment — a sigil, a
 * wrightstone, a summon — not `sigilQuestLockedTrait`. Four sigil rules are one
 * thing to them, and listing all four spends four chips saying it once.
 *
 * Proof and long odds never collapse even on the same equipment: "impossible
 * summon" is a mod, "perfect summons" is a farmer's luck, and merging them
 * would turn a report into an accusation.
 *
 * That distinction has a colour. Perfect summons and perfect overmasteries are
 * the violations whose most likely explanation is a farmer who got there, so
 * they CAN read gold — a compliment, "Blessed by RNG" — and a player they are
 * the ONLY thing against reads gold everywhere their name is marked. Which of
 * the two actually reads gold is a user setting in this fork (see `GoldRules`);
 * one real breach turns them red either way: luck does not launder a modded
 * sigil.
 */

import { TFunction } from "i18next";

import { LegalityRule } from "./types";

export type Violation =
  | "impossibleSigil"
  | "impossibleWrightstone"
  | "impossibleSummon"
  | "impossibleOvermastery"
  | "perfectSummons"
  | "perfectOvermasteries"
  | "masterTraits";

/** Display order: proof first, then the long-odds reports. A person's chips
 * read the same way every time, so two people carrying the same violations look
 * alike instead of looking like two different problems. */
export const VIOLATIONS: Violation[] = [
  "impossibleSigil",
  "impossibleWrightstone",
  "impossibleSummon",
  "impossibleOvermastery",
  "perfectSummons",
  "perfectOvermasteries",
  "masterTraits",
];

const BY_RULE: Record<LegalityRule, Violation> = {
  wrightstoneTraitLevel: "impossibleWrightstone",
  wrightstoneTrait: "impossibleWrightstone",
  sigilTraitLevel: "impossibleSigil",
  sigilLockedPair: "impossibleSigil",
  sigilQuestLockedTrait: "impossibleSigil",
  sigilSingleTraitOnly: "impossibleSigil",
  overmasteryValue: "impossibleOvermastery",
  overmasteryAllMaxed: "perfectOvermasteries",
  summonTrait: "impossibleSummon",
  summonBonusSource: "impossibleSummon",
  summonBonusMagnitude: "impossibleSummon",
  summonPerfectCount: "perfectSummons",
  masterTraitCount: "masterTraits",
};

export const violationOf = (rule: LegalityRule): Violation => BY_RULE[rule];

export const violationLabel = (t: TFunction, violation: Violation): string => t(`ui.legality.violation.${violation}`);

/**
 * How a violation reads: as cheating, or as luck.
 *
 * LOCAL FORK POLICY (differs from upstream): which long-odds reports read as
 * luck is a USER SETTING here, not a constant — `GoldRules` carries the two
 * checkboxes (Settings → General). Upstream has no such choice: it reads only
 * perfect summons as luck (its reasoning: OM rolls come from a bounded ladder
 * a few rerolls can walk), and since 1.12.10 it does not report perfect
 * summons at all. `gold_perfect_summons: false` reproduces exactly that by
 * hiding the report (see `visibleFindings`); `gold_perfect_overmasteries:
 * true` goes the other way and marks all-maxed OMs gold, remarkable enough to
 * praise rather than accuse.
 */
export type LegalityTone = "cheat" | "lucky";

/** The two gold-rule checkboxes, as the tone functions take them. Mirrors
 * `gold_perfect_summons` / `gold_perfect_overmasteries` in the meter settings
 * store; components read them through `useGoldRules`. */
export interface GoldRules {
  perfectSummons: boolean;
  perfectOvermasteries: boolean;
}

export const violationTone = (violation: Violation, gold: GoldRules): LegalityTone => {
  if (violation === "perfectSummons") return gold.perfectSummons ? "lucky" : "cheat";
  if (violation === "perfectOvermasteries") return gold.perfectOvermasteries ? "lucky" : "cheat";
  return "cheat";
};

/** The tone of a whole set: lucky only when EVERYTHING against it is luck.
 * Undefined on an empty set — "not judged" has no colour. */
export const toneOfViolations = (violations: Violation[], gold: GoldRules): LegalityTone | undefined => {
  if (violations.length === 0) return undefined;
  return violations.every((violation) => violationTone(violation, gold) === "lucky") ? "lucky" : "cheat";
};

export const findingsTone = (findings: { rule: LegalityRule }[], gold: GoldRules): LegalityTone | undefined =>
  toneOfViolations(
    findings.map((finding) => violationOf(finding.rule)),
    gold
  );

/** The findings a surface should show under the current gold rules. Only one
 * rule is ever hidden: with "perfect summons as gold" off, the perfect-summon
 * report disappears entirely (upstream 1.12.10 behaviour — it is luck or it
 * is nothing, never an accusation). Perfect overmasteries are always SHOWN;
 * their checkbox only picks the colour. */
export const visibleFindings = <F extends { rule: LegalityRule }>(findings: F[], gold: GoldRules): F[] =>
  gold.perfectSummons ? findings : findings.filter((finding) => finding.rule !== "summonPerfectCount");

/** The Mantine colour each tone marks in, so every surface resolves the same
 * pair and none can invent a third. Yellow is Mantine's gold. */
export const TONE_COLOR: Record<LegalityTone, "red" | "yellow"> = { cheat: "red", lucky: "yellow" };
