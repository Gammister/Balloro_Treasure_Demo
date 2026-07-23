# Balloro X3000 project instructions

- The persistent localhost server serves the deployed copy at `/Users/grigorydorin/Library/Application Support/Balloro X3000`.
- After changing game or generator files, run `zsh sync-balloro-server.sh` with the required local permissions before handing the result back to the user.
- The sync script preserves `math/field-generator-store.json` in the deployed copy so saved generator configurations are not overwritten.
- Verify both `http://127.0.0.1:8767/index.html` and `http://127.0.0.1:8767/field-generator.html` after syncing.
