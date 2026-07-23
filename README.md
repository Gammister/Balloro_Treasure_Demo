# Balloro Treasure

Balloro Treasure is a browser-based risk game built around a diamond-shaped field of hidden cells and precomputed ball trajectories. A paid shot starts a round; every later shot in the same round is free. After a safe result, the player can cash out or continue risking the accumulated multiplier.

This repository contains the playable client, the field-layout editor, the deterministic trajectory library, and the math verification tools. It is a client prototype: production wallet, authentication, certified RNG, event storage, and remote game-server integration are not included.

## Run locally

Requirements:

- Python 3.9 or newer
- Node.js 18 or newer for tests and math tools

Start the local server from the repository root:

```sh
python3 field-generator-server.py --port 8767
```

Open:

- Game: `http://127.0.0.1:8767/index.html`
- Field generator: `http://127.0.0.1:8767/field-generator.html`

The Python server is preferred over a generic static server because it also provides the local API used to save field-generator configurations.

On the original macOS development machine, this command updates and restarts the persistent local copy:

```sh
zsh sync-balloro-server.sh
```

The sync keeps `math/field-generator-store.json` intact and deploys only runtime files. Developer reports, tests, Git data, and legacy experiments are excluded from the served copy.

## Game flow

1. The player chooses the total stake, number of balls, and 5–10 field lines.
2. The first shot is paid and creates a shuffled hidden board.
3. A safe landing may reveal an empty cell, a multiplier, a diamond, or the blue bonus pocket.
4. Every collected multiplier is applied sequentially to the current cashout value. For example, `300 × 1.20 × 1.50 = 540`.
5. After a safe shot, the player can cash out or launch another shot for free without resetting the board.
6. A red pocket ends the round and removes the cashout.
7. Three collected diamonds activate x10 BOOST. Multipliers already credited before activation are unchanged; multipliers under cells and multipliers collected from the activating shot onward use their boosted values.
8. The blue pocket captures a ball and releases three balls after its preparation animation.

The theoretical target RTP is `97.45%` for every line count. The maximum stake is `100 USD`, and the highest multiplier shown in one boosted cell is `100x`.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Main game markup and localized UI containers |
| `script.js` | Game state, rendering, audio, animation, input, and round orchestration |
| `style.css` | Main responsive UI |
| `assets/` | Optimized audio and image assets |
| `math/balloro-treasure-math.js` | Hidden-board creation, selection weights, multiplicative cashout, and RTP normalization |
| `math/trajectory-library-standard.js` | Browser-ready library of 71,000 precomputed trajectories |
| `math/trajectory-planner.js` | Trajectory hydration, validation, and selection helpers |
| `math/field-configuration-*.js` | Saved field layouts for each configuration |
| `field-generator.*` | Field editor UI |
| `field-generator-model.js` | Field editor data model |
| `field-generator-server.py` | Static server and local configuration-store API |
| `MathOutput/` | Generated math summaries and audit output |
| `Docs/` | Design and math audit notes |

## Audio and size policy

Background music is stored as Opus audio in an OGG container at 96 kbit/s. The former MP3 and the duplicate 46 MB JSON trajectory export are intentionally not kept in the repository. The browser loads `math/trajectory-library-standard.js`; Node tools load the same source through `math/load-trajectory-library.js`.

`math/build-trajectories.js` updates the browser library and its compact statistics file. A full debug JSON copy is generated only when explicitly requested:

```sh
PUCK_LUCK_WRITE_DEBUG_JSON=1 node math/build-trajectories.js
```

That JSON is ignored by Git.

## Verification

Run the focused checks after gameplay, field, or math changes:

```sh
node math/test-balloro-treasure.js
node math/test-trajectories.js
node math/test-field-generator.js
node math/test-math.js
node math/test-math-v2.js
```

The full 10-million-bet-per-line Monte Carlo check is:

```sh
node math/simulate-balloro-treasure-rtp.js
```

Before handing off a build:

1. Run the focused checks.
2. Run `zsh sync-balloro-server.sh`.
3. Verify both local URLs respond.
4. Test one paid shot, a free continuation, cashout, a red-pocket loss, a diamond pickup, and the blue-pocket release.
5. Confirm the browser console has no uncaught errors or missing assets.

## Math and trajectory workflow

- Do not edit the generated trajectory library by hand.
- Regenerate trajectories with `node math/build-trajectories.js`, then run `node math/test-trajectories.js`.
- Keep displayed multipliers and the authoritative values in `math/balloro-treasure-math.js` synchronized.
- Any change to board contents, selection weights, multiplier values, x10 behavior, or red-pocket frequency requires both unit tests and a new RTP simulation.
- Visual-only changes must not alter field coordinates, target cells, collision geometry, or trajectory descriptors.
- The local generator store is developer state. Do not overwrite it during deployment.

## Production integration

Before a regulated release, replace the local prototype layer with:

- server-authoritative bets and payouts;
- certified RNG and signed round results;
- idempotent wallet debit/credit operations;
- jurisdiction-specific limits, responsible-gaming controls, and audit logs;
- asset hashing, immutable release builds, and a production web server with Brotli or gzip compression;
- automated browser coverage for all supported devices and languages.

Never trust a cashout amount calculated only in the browser in a real-money environment.
