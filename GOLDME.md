# GOLDME — the gold-rules fork, as a project

This document is the fork's own manual: what it changes, how it is versioned,
how releases are cut, and how it tracks upstream. For the sales pitch, see
[README.md](./README.md); for the maintainer handover (in Chinese), see
[HANDGOLD.md](./HANDGOLD.md).

## What the fork changes

Exactly one thing: **which long-odds legality reports read as gold is a user
setting.** Two checkboxes under Settings → General:

| Setting | Default | On | Off |
| --- | --- | --- | --- |
| Show perfect summons as gold (`gold_perfect_summons`) | **On** | Reported as the gold "Blessed by RNG" luck marker | Hidden entirely (upstream 1.12.10 behaviour) |
| Show perfect overmasteries as gold (`gold_perfect_overmasteries`) | **Off** | Gold luck marker | Red cheat read (upstream behaviour) |

Everything else is byte-for-byte upstream plus branding (the app calls itself
Relink Logs GOLD / GBFR Logs GOLD).

The audit backend still records the perfect-summon report no matter what the
checkboxes say (the fork reinstated it at `RULES_VERSION 10`); the settings
only decide what the UI shows, so toggling never needs a rescan.

## Versioning

Fork versions are upstream's base version plus a **numeric prerelease from
the 9000 series**: `1.12.10-9000`, `1.12.10-9001`, …, and `1.12.11-9000`
after merging upstream 1.12.11.

Why not a literal `-gold` suffix: WiX maps the semver prerelease onto the MSI
ProductVersion's fourth field and rejects anything non-numeric, so
`1.12.10-gold` fails the Windows bundle. The 9000 series is numeric
(MSI-safe), monotonic (updater-safe), and never collides with upstream's own
RC tags (`-1`, `-2`, …).

The version lives in four files that must always agree: `package.json`,
`src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `Cargo.lock`.

## Releasing

Releases are manual: **Actions → Gold Release → Run workflow** from `dev`.
The workflow (`.github/workflows/gold-release.yaml`) builds hook.dll, the
Windows MSI and the Linux AppImage, minisigns the updater artifacts, and
publishes a GitHub Release tagged with the version from the files. It refuses
to tag a version that already exists — bump the four version files first.

Requirements (one-time setup, already done on this repo):

- Secret `TAURI_PRIVATE_KEY`: the fork's own minisign private key. Losing it
  means never being able to sign updates again — keep a backup.
- Upstream's `release.yaml` workflow is kept in the tree (merge cleanliness)
  but must stay **disabled** in the Actions settings; it needs secrets this
  repo does not have and would fail on every push to `dev`.

Builds are **unsigned** (no Authenticode): expect SmartScreen /
"unknown publisher" warnings on Windows. The in-app updater is unaffected —
it checks the minisign signature, not Authenticode.

## Update isolation

The updater endpoint and pubkey in `src-tauri/tauri.conf.json` point at THIS
repository. Fork installs never update into upstream builds (which would
silently drop the gold settings), and upstream installs never update into the
fork. The same version number on both sides is not a conflict: each side only
trusts its own minisign key.

## Tracking upstream

The fork's `dev` is upstream `dev` plus the gold commits. When upstream
releases:

1. `git fetch origin` (origin = villith/relink-logs)
2. `git merge origin/dev` into the fork branch
3. Resolve conflicts keeping two invariants:
   - `src-tauri/src/legality/mod.rs`: keep `RULES_VERSION` at the fork's
     higher value and the perfect-summon report un-withheld
   - `src/violations.ts`: keep the `GoldRules` policy parameterisation
4. Run the checks (`npx vitest run`, `npx tsc --noEmit`)
5. Bump the version files to the new base + `-9000`, push, and dispatch
   Gold Release.

The structural divergence from upstream is deliberately tiny — the two points
above plus additive-only files (settings keys, i18n strings, the workflow) —
so merges stay boring.
