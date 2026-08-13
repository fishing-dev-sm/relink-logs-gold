# relink-logs-gold (gold-rules fork)

[![GitHub License](https://img.shields.io/github/license/fishing-dev-sm/relink-logs-gold)](./LICENSE)

# Windows Defender / Virus

**There is no virus**, it is an issue with some of the modules used for Linux support that were incorrectly included in the Windows bundle

If Windows Defender is flagging relink-logs as a virus, you likely are running version 1.12.12. Updating to version 1.12.13 should solve your issue

## Description

Overlay DPS parser/meter for Granblue Fantasy: Relink.

**This repository is a fork of [villith/relink-logs](https://github.com/villith/relink-logs).** It tracks upstream's `dev` branch and adds exactly one divergence: user-configurable "gold rules" for the legality audit (see below). Everything else — features, fixes, releases — comes from upstream. The fork's own manual (versioning, releasing, upstream-tracking) lives in [GOLDME.md](./GOLDME.md). Relink Logs itself was built upon [false-spring/gbfr-logs](https://github.com/false-spring/gbfr-logs), which is no longer maintained, and on the reverse engineering from [nyaoouo/GBFR-ACT](https://github.com/nyaoouo/GBFR-ACT).

## Why this fork exists: the gold rules

The built-in legality audit flags builds that **cannot exist** — impossible sigils, wrightstones, summons — in red. Two findings are different in kind:

- a **full set of perfect summons** (every bonus at the top of its roll window)
- **all-maxed overmasteries** (every overmastery line at its maximum)

These are not impossible — and the game's own drop tables put a price on exactly how not-impossible they are. A fair price has to account for farming, though: nobody rolls exactly once. So each report is priced twice — per single draw, and per realistic grind:

| Report | Per single draw | Per realistic grind |
| --- | --- | --- |
| A single perfect summon | 1 in 49 to 1 in 407 | ordinary — 42 of 72 players in a production census owned at least one, so the audit does not even report it |
| A full set of four perfect summons | 1 in 400 million at the reading most generous to the player (1 in 27.5 billion at the strictest) | ~1,600 boss runs on average, 99.8% after 5,000 — reachable by a dedicated farmer within a season or two |
| Three maxed stun overmasteries | 1 in 442.75 million | the real wall — the three stun ids exist only in the Lv1 meditation pool, prediction buys no shortcut, and a million meditations still only buy 1 in 443 |
| **Both on one build** | **1 in 176 quintillion to 1 in 12 sextillion** | ≈ your Lv1 meditation count, out of 442.75 million — the summons grind out near-certainly, so the overmasteries decide |

(The full derivation — per-family drop-table numbers and the binomial farming model — lives in [docs/perfect-odds.html](./docs/perfect-odds.html).)

The per-draw column makes even four summons sound like a lottery jackpot, but that is the price of rolling exactly once — it says nothing about a farmer who rolls hundreds of times and equips the best. Priced per grind, the two reports differ in kind: perfect summons are the achievable half (the census watches real players get there), while the overmastery set stays out of reach at any realistic meditation volume. A build carrying both is roughly one-in-(your Lv1 meditation count, over 442.75 million) — rare even among the hardest farmers, but not a miracle. And that is exactly why the information matters. A player whose build is *only* flagged this way is either an uncommonly lucky farmer, or not farming at all. Upstream has swung between the two extremes: 1.12.9 marked perfect summons gold ("Blessed by RNG"), 1.12.10 stopped reporting them entirely.

This fork's position: **the mark is necessary, but the verdict is yours.** Gold states a fact — "this outcome is statistically near-impossible" — it does not accuse. Whether perfect summons deserve to be shown at all, and whether all-maxed overmasteries deserve the same gold, are judgment calls that reasonable players disagree on. So they are settings, not policy:

| Setting (Settings → General) | Default | On | Off |
| --- | --- | --- | --- |
| Show perfect summons as gold | **On** | Reported as the gold "Blessed by RNG" luck marker | Hidden entirely (upstream 1.12.10 behaviour) |
| Show perfect overmasteries as gold | **Off** | Gold luck marker | Red cheat read (upstream behaviour) |

Both defaults deliberately match upstream's current read of the world, with the one exception this fork exists for: the perfect-summon report stays available, and stays gold, unless you say otherwise.

## What's new in Relink Logs

On top of the original gbfr-logs feature set, the upstream project adds:

- **Game v2.0.2 / expansion support** — updated hooks and game data for the expansion (new characters, quests, and items), plus correct player attribution and stun tracking in online multiplayer.
- **Damage cap tracking** — per-skill capped-hit counts and an exact overcap % column in the skill breakdown, read from the game's own damage-cap computation.
- **Expanded equipment tracking** — full loadouts for players and AI companions: weapons with uncap, awakening, wrightstones, and transcendence, innate weapon skills, sigils, overmasteries, master traits (skill board), and character stats.
- **Build checklist** — a Builds tab that checks each player's gear against a trait checklist (e.g. Damage Cap, Supplementary Damage), editable in Settings.
- **Conflux (Endless mode) support** — a dedicated Conflux tab that groups runs into rooms with per-room meters.
- **Toolbox: Synthesis Helper** — searches your sigil box for pairs that will synthesize into a target trait combination, using the game's actual synthesis logic.

## Installation

This fork publishes its own builds (Windows MSI and Linux AppImage), unsigned — expect a SmartScreen/AV prompt on first run (upstream pays for a code-signing certificate; this fork does not). In-app updates work between fork releases only: fork builds never update into upstream builds and vice versa, by design.

### Windows

1. Go to [Releases](https://github.com/fishing-dev-sm/relink-logs-gold/releases)
2. Download the latest .msi installer and run it.
3. Open GBFR Logs
4. Launch the game (interchangeable with previous step)

## Linux (Proton)

Relink Logs runs natively on Linux and meters the Windows game running under
Steam's Proton. Steam Deck gaming mode is **not** supported (an external
overlay cannot draw over gamescope).

1. Go to [Releases](https://github.com/fishing-dev-sm/relink-logs-gold/releases)
2. Download the latest AppImage from the releases page
3. Make it executable (`chmod +x`), and run it
4. Launch Relink Logs, open **Settings → Linux setup**, and click **Install hook** if it isn't already green.
5. One-time: in Steam → Granblue Fantasy: Relink → Properties → Launch Options, paste: `WINEDLLOVERRIDES="dinput8=n,b" %command%`
   * For those using Reloaded II for mods, you may have already modified the Launch Options. The full Launch Options should now look like:
`WINEDLLOVERRIDES="winmm=n,b;dinput8=n,b" %command%`
6. Launch the game.

Notes:

- The overlay uses X11 (via XWayland on Wayland desktops). Always-on-top and
  clickthrough behavior can vary by compositor; X11 sessions are the most
  reliable. If the overlay hides behind the game, see the FAQ entry
- The hook file installed into the game folder is the `hook.dll` bundled with the AppImage, renamed to `dinput8.dll`. It is a Proton-specific build: it carries the `DirectInput8Create` proxy export and the localhost socket that Wine needs, neither of which ships in the Windows build (unsigned in this fork's builds — see Installation).
  - Use **Remove hook** in Settings to delete it

## Found a translation problem or a bug?

- For anything about the app itself, report it [upstream](https://github.com/villith/relink-logs/issues) — this fork changes nothing but the gold rules.
- For the gold rules themselves (behaviour, wording, defaults), [open an issue on this fork](https://github.com/fishing-dev-sm/relink-logs-gold/issues).

Note: item / weapon / skill names come from the game's own data files and can't be hand-edited — only the app's interface text can be changed.

## Frequently Asked Questions

> Q: I closed the meter, but it's still running?

When you close the windows, Relink Logs continues to run in your task tray in the bottom right of your desktop.

This task tray functionality is meant to give you more options for customizing:

- This lets you close the logs window, but be able to reopen it again later.
- You can toggle clickthrough of the overlay as well.

> Q: The meter isn't updating or displaying anything.

Try running the program after the game has been launched. Be sure to run the program as admin.

> Q: The application is not working / launching.

Relink Logs uses your built-in Microsoft Edge Webview2 Runtime to run the application. This keeps the app relatively small as we don't have to package in a browser.

However, you may have an out-of-date or missing "Webview2 Runtime":

- Install the latest one from Microsoft: <https://developer.microsoft.com/en-us/microsoft-edge/webview2/?form=MA13LH#download> (Evergreen Bootstrapper should work here)

> Q: Is this safe? My antivirus is marking the installation as a virus / malware.

As always, this is up to you to trust Relink Logs. The program can trigger false positive flags. There are reasons why it can give such alerts:

- Relink Logs does code DLL injection into the running game process which can look like a virus-like program.
- Relink Logs reads game memory and modifies game code at runtime in order to receive parser data.
- I recommend adding an exception / whitelisting for the installation folder so that your anti-virus does not delete it while your game is running, but you may not need to do so if you haven't ran into this issue.

See [how to add an exclusion to Windows Defender](https://support.microsoft.com/en-us/windows/add-an-exclusion-to-windows-security-811816c0-4dfd-af4a-47e4-c301afe13b26).

> Q: How do I update?

Launching the application will automatically check for new updates!

Same as with installing, you can download the [latest release](https://github.com/fishing-dev-sm/relink-logs-gold/releases) and run the installer again and it will update over your old installation.

> Q: How do I uninstall?

You can uninstall Relink Logs the normal way through the Control Panel or by running the uninstall script in the folder where you installed it to. You may also want to remove these folders.

- `%AppData%\gbfr-logs`

> Q: (Linux) The overlay hides behind the game instead of staying on top.

On Windows an app can keep its own window on top. On Linux it can only *ask* — your desktop environment decides, and each one behaves differently. Try these in order:

1. **Run the game in borderless or windowed mode**, not exclusive fullscreen. Most window managers stack fullscreen windows above everything, including "always on top" windows.
2. **Add a "keep above" rule for the Meter window in your desktop settings.** For example, on KDE Plasma: System Settings → Window Management → Window Rules → Add New, match the window title `Meter`, and set "Keep above other windows" to Force / Yes. Other desktops have equivalents (on Hyprland a `windowrule`; on an X11 session, `wmctrl -r Meter -b add,above` also works).
3. **Prefer an X11 session** if your desktop offers the choice at the login screen — X11 honors the app's own always-on-top request far more reliably than Wayland, which ignores it by design.

Steam Deck gaming mode (gamescope) cannot show external overlays at all — this is not fixable with settings.

> Q: How do I add/edit my language?

Read [src-tauri/lang/README.md](./src-tauri/lang/README.md) for more information on how to add/edit language support!

> Q: My issue isn't listed here, or I have a suggestion.

Feel free to create a [new GitHub issue](https://github.com/villith/relink-logs/issues).

## For Developers

- Install nightly Rust ([rustup.rs](https://rustup.rs/)) + [Node.js](https://nodejs.org/en/download).
- Install NPM dependencies with `npm install`
- `npm run tauri dev`

## Under the hood

This project is split up into a few subprojects:

- `src-hook/` - Library that is injected into the game that broadcasts essential damage events.
- `src-tauri/` - The Tauri Rust backend that communicates with the hooked process and does parsing.
- `protocol/` - Defines the message protocol used by hook + back-end.
- `src/` - The JS front-end used by the Tauri web app

## Credits

This project would not have been possible without the following folks:

- [villith/relink-logs](https://github.com/villith/relink-logs) — the upstream project this fork tracks.
- [false-spring/gbfr-logs](https://github.com/false-spring/gbfr-logs) — the original project this one was built upon.
- [nyaoouo/GBFR-ACT](https://github.com/nyaoouo/GBFR-ACT) for the original reverse engineering work.
- [Harkain](https://github.com/Harkains) for their work on formatting and translating skills to friendly English names.

## Disclaimer

Please keep in mind that this tool is meant to improve the experience that Cygames has provided us and is not meant to cause them or anyone other players damage. Relink Logs modifies your running game client and is not guaranteed to work after game patches, in which case you may experience instability or crashes.
