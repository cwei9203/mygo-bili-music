# Live API evidence — 2026-10-27

No account login or existing user cookies were used. Only homepage and public SPI-issued guest cookies were kept in memory. Tokens, cookies, signed media URLs and raw account responses are not stored here.

Initial observations before subsequent request compatibility changes:

| Flow | Outcome |
|---|---|
| Uploader search | 20 results |
| All-category video search | 18 valid video results after normalization; upstream continuation true |
| Video details | 131 independent parts for the sampled search result |
| Playurl and bounded media container probe | Passed; independent audio selected |
| UP collection listing | 20 entries |
| First sampled collection | 3 videos |
| UP submissions | HTTP 412 before SPI; code -352 after SPI, still inaccessible |

At that initial checkpoint the full opt-in suite failed on submissions; the subset excluding submissions passed. Later observations below supersede the initial availability assessment.

Final non-smoke app UI check: searched 纯音乐, expanded a one-part video, resolved a mixed stream, observed elapsed time advance to 00:14, sought to approximately 24:34, observed it advance to 24:45, then paused. No tracks were saved in the production library. This verifies one real online media sample, not all codecs or accounts.

Later on 2026-10-27, the same uploader endpoint returned Aki惊蛰 (UID 15319615) pages 1 and 2 with 30 videos each, both with and without environment proxy variables. The native app initially returned 412 and succeeded after one manual retry. Uploader keyword search for 夜鹿 subsequently returned 12 results with no further page. These samples demonstrate intermittent availability, not guaranteed access. The latest UI automatically retries read queries up to three total requests; this policy was verified with controlled browser failures, without assuming a permanent fix to upstream risk controls.
