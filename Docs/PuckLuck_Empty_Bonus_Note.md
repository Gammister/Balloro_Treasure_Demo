# Puck Luck Empty Bonus Presentation

The empty full-star presentation rate is doubled relative to the original 3% presentation calibration.

- Paid bonus probability and payout math remain unchanged.
- The additional presentation can trigger only when every puck result is `0x`.
- An empty presentation collects all required stars but awards `0 USD`.
- It does not play the monetary win sound.
- The round exposes `paid_bonus_triggered` and `empty_bonus_triggered` separately for audit and monitoring.
- RTP remains 0.9745 in all 54 configurations.

The paid bonus probability remains unchanged. Only the zero-multiplier, all-stars-collected presentation receives the 2x frequency adjustment.

Observed over 100,000 seeds per 5-line profile after the adjustment:

- Empty full bonus: 2.24%–4.86% of rounds.
- All full-bonus presentations: 4.14%–5.38% of rounds.
- Paid bonus: unchanged at approximately 0.53%–1.90%, depending on risk and puck count.
