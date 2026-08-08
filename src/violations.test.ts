import { describe, expect, it } from "vitest";

import ui from "../src-tauri/lang/en/ui.json";
import { LegalityRule } from "./types";
import {
  GoldRules,
  VIOLATIONS,
  Violation,
  findingsTone,
  toneOfViolations,
  violationLabel,
  violationOf,
  violationTone,
  visibleFindings,
} from "./violations";

/** Upstream's hard-coded policy: perfect summons gold, everything else a
 * cheat. The existing cases below run against it so the fork's default read
 * stays pinned to what upstream would say. */
const UPSTREAM: GoldRules = { perfectSummons: true, perfectOvermasteries: false };
/** Both checkboxes on: all-maxed overmasteries read gold too. */
const BOTH_GOLD: GoldRules = { perfectSummons: true, perfectOvermasteries: true };
/** Perfect summons off: the report is hidden upstream-style, and tones never
 * see it as luck. */
const NO_SUMMONS: GoldRules = { perfectSummons: false, perfectOvermasteries: false };

const render = (key: string): string => {
  const path = key.replace(/^ui\./, "").split(".");
  const raw = path.reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], ui.ui);
  return typeof raw === "string" ? raw : `MISSING:${key}`;
};
const t = render as never;

/** Every rule maps somewhere. A `Record` keyed by the closed union, so a rule
 * added in Rust fails `tsc` here until someone says what it is a violation of. */
const EXPECTED: Record<LegalityRule, Violation> = {
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

describe("violationOf", () => {
  /** A reader thinks in equipment, not in rules. Four separate sigil rules are
   * one thing to them — "this person's sigil could not exist" — and listing all
   * four spends four chips saying it. */
  it.each(Object.entries(EXPECTED))("files %s under its equipment", (rule, violation) => {
    expect(violationOf(rule as LegalityRule)).toBe(violation);
  });

  it("collapses the four sigil rules into one violation", () => {
    const sigilRules: LegalityRule[] = [
      "sigilTraitLevel",
      "sigilLockedPair",
      "sigilQuestLockedTrait",
      "sigilSingleTraitOnly",
    ];
    expect(new Set(sigilRules.map(violationOf)).size).toBe(1);
  });

  /** Proof and long odds are different claims about the same equipment and must
   * never collapse: "impossible summon" is a mod, "perfect summons" is luck. */
  it("keeps proof and long odds apart on the same equipment", () => {
    expect(violationOf("summonBonusMagnitude")).not.toBe(violationOf("summonPerfectCount"));
    expect(violationOf("overmasteryValue")).not.toBe(violationOf("overmasteryAllMaxed"));
  });
});

describe("violationLabel", () => {
  it.each(VIOLATIONS)("names %s", (violation) => {
    const label = violationLabel(t, violation);
    expect(label).not.toMatch(/^MISSING:/);
    expect(label.trim()).not.toBe("");
  });

  it("names them the way the reader would say them", () => {
    expect(violationLabel(t, "impossibleSigil")).toBe("Impossible Sigil");
    expect(violationLabel(t, "masterTraits")).toBe("Master Traits");
  });

  /** Not "Perfect Summons": that name filed a farmer's luck under cheating,
   * which is the complaint that renamed it. The label is a compliment. */
  it("names perfect summons as luck, not as a cheat", () => {
    expect(violationLabel(t, "perfectSummons")).toBe("Blessed by RNG");
  });
});

describe("violationTone", () => {
  it("reads perfect summons as luck under the upstream policy", () => {
    expect(violationTone("perfectSummons", UPSTREAM)).toBe("lucky");
  });

  /** Everything else stays a cheat read — including perfect overmasteries,
   * whose ladder a few rerolls can walk. */
  it("reads every other violation as cheating under the upstream policy", () => {
    for (const violation of VIOLATIONS.filter((v) => v !== "perfectSummons")) {
      expect(violationTone(violation, UPSTREAM)).toBe("cheat");
    }
  });

  it("reads perfect overmasteries as luck only when its checkbox is on", () => {
    expect(violationTone("perfectOvermasteries", BOTH_GOLD)).toBe("lucky");
    expect(violationTone("perfectOvermasteries", NO_SUMMONS)).toBe("cheat");
  });

  /** With the summons checkbox off the report is hidden before tones are ever
   * computed; if one slips through anyway it must NOT read as luck. */
  it("never reads perfect summons as luck when its checkbox is off", () => {
    expect(violationTone("perfectSummons", NO_SUMMONS)).toBe("cheat");
  });
});

describe("toneOfViolations", () => {
  it("is lucky only when luck is ALL there is", () => {
    expect(toneOfViolations(["perfectSummons"], UPSTREAM)).toBe("lucky");
    expect(toneOfViolations(["perfectOvermasteries"], BOTH_GOLD)).toBe("lucky");
    expect(toneOfViolations(["perfectSummons", "perfectOvermasteries"], BOTH_GOLD)).toBe("lucky");
  });

  /** One real breach turns the whole set red: luck does not launder a modded
   * sigil. */
  it("is a cheat as soon as anything else joins", () => {
    expect(toneOfViolations(["impossibleSigil", "perfectSummons"], UPSTREAM)).toBe("cheat");
    expect(toneOfViolations(["impossibleSigil", "perfectOvermasteries"], BOTH_GOLD)).toBe("cheat");
  });

  it("reads perfect overmasteries as a cheat under the upstream policy", () => {
    expect(toneOfViolations(["perfectOvermasteries"], UPSTREAM)).toBe("cheat");
  });

  /** An empty set is "not judged", which has no colour — never "clean", and
   * never lucky. */
  it("has no tone for an empty set", () => {
    expect(toneOfViolations([], UPSTREAM)).toBeUndefined();
  });
});

describe("findingsTone", () => {
  it("reads tone through the rules that computed the findings", () => {
    expect(findingsTone([{ rule: "summonPerfectCount" }], UPSTREAM)).toBe("lucky");
    expect(findingsTone([{ rule: "summonPerfectCount" }, { rule: "sigilTraitLevel" }], UPSTREAM)).toBe("cheat");
    expect(findingsTone([{ rule: "overmasteryAllMaxed" }], BOTH_GOLD)).toBe("lucky");
    expect(findingsTone([], UPSTREAM)).toBeUndefined();
  });
});

describe("visibleFindings", () => {
  const findings: { rule: LegalityRule }[] = [
    { rule: "summonPerfectCount" },
    { rule: "overmasteryAllMaxed" },
    { rule: "sigilTraitLevel" },
  ];

  it("hides only the perfect-summon report when its checkbox is off", () => {
    expect(visibleFindings(findings, NO_SUMMONS)).toEqual([
      { rule: "overmasteryAllMaxed" },
      { rule: "sigilTraitLevel" },
    ]);
  });

  /** Perfect overmasteries are always SHOWN — their checkbox picks a colour,
   * never visibility. */
  it("never hides perfect overmasteries", () => {
    expect(visibleFindings(findings, UPSTREAM)).toEqual(findings);
    expect(visibleFindings(findings, BOTH_GOLD)).toEqual(findings);
  });
});

describe("VIOLATIONS", () => {
  /** The order chips appear in, so two players carrying the same violations
   * read as the same shape rather than as two arbitrary orderings. */
  it("lists every violation exactly once", () => {
    expect(new Set(VIOLATIONS).size).toBe(VIOLATIONS.length);
    expect(new Set(Object.values(EXPECTED))).toEqual(new Set(VIOLATIONS));
  });

  it("puts proof before long odds", () => {
    const proof = VIOLATIONS.filter((v) => v.startsWith("impossible"));
    const odds = VIOLATIONS.filter((v) => !v.startsWith("impossible"));
    const lastProof = Math.max(...proof.map((v) => VIOLATIONS.indexOf(v)));
    const firstOdds = Math.min(...odds.map((v) => VIOLATIONS.indexOf(v)));
    expect(lastProof).toBeLessThan(firstOdds);
  });
});
