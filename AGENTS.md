# Balloro Treasure project instructions

- The persistent localhost server serves the deployed copy at `/Users/grigorydorin/Library/Application Support/Balloro Treasure`.
- Balloro Treasure uses port `8768`. Port `8767` belongs to the separate Balloro X project and must not be overwritten.
- After changing game or generator files, run `zsh sync-balloro-server.sh` with the required local permissions before handing the result back to the user.
- The sync script preserves `math/field-generator-store.json` in the deployed copy so saved generator configurations are not overwritten.
- Verify both `http://127.0.0.1:8768/index.html` and `http://127.0.0.1:8768/field-generator.html` after syncing.
- After every completed change, commit and push the verified result to `origin/main` in `Gammister/Balloro_Treasure_Demo`.
- Wait for the GitHub Pages deployment to finish, then verify `https://gammister.github.io/Balloro_Treasure_Demo/` and `https://gammister.github.io/Balloro_Treasure_Demo/field-generator.html`.
