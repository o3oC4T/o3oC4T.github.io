# Design and renderer attribution

The archive-box design, WebGL scene, interaction choreography, and retained
layout styles originate from [Mridul Narnaulia’s portfolio](https://mridul.design/),
selected through [Wall of Portfolios](https://www.wallofportfolios.in/portfolios/mridul-narnaulia/).
The public browser-delivered snapshot was retrieved on 2026-09-21.

The deployed adaptation uses Yeong Choi’s supplied profile, research, competition
records, education, and contact information. The reference author’s identity,
project media, résumé, social links, and music player are not part of the
personalized application. New UI code and structured content live separately
from the retained renderer.

The renderer has been adapted for the name engraving, card icons, pastel-pink
lighting, holographic card materials, and pastel accent palette. Its original
camera, geometry, and animation timings are retained. Unused image and font
references have been removed from retained layout CSS.

The user-supplied pastel holographic image is used only as a color/style reference,
not as a redistributed texture. Card surfaces are generated procedurally by
`docs/assets/pastel-surface.js`; the source image is not served by the site.

The card-caption matrix-text animation is adapted from the reference's
text component into `docs/caption-scramble.js`, retaining its glyph cadence,
letter-by-letter reveal, and reduced-motion behavior.

The six detail pages take visual cues from [Serg Zorin’s portfolio](https://sergzorin.com/),
selected through [Wall of Portfolios](https://www.wallofportfolios.in/portfolios/sergey-zorin/):
the terminal prompt, character-art heading, numbered selected-work entries, and
compact experience rows. Their rendering code and bitmap title alphabet are new;
his biography, portrait, project descriptions, scripts, and interactive games are
not included. The English introductions translate Yeong Choi’s existing page
subtitles and descriptions rather than adding new career claims.

The heading treatment also follows the reference’s shaded, halftone, rounded,
punctuation and ANSI styles, click-to-remix glitch, and pointer-responsive
ambient ASCII field. The glyph atlas, six title compositions, rendering,
animation and cleanup logic are newly implemented. Individual glyphs use fixed
SVG cells to retain the character-art appearance without platform font drift.
Existing per-card pastel colors are preserved rather than using its palettes.

JetBrains Mono is self-hosted under the SIL Open Font License 1.1. Its license is
included at `docs/fonts/JetBrainsMono-OFL.txt`.

No ownership of the original design or renderer is claimed. Public availability
does not itself establish a reuse license; this repository does not grant a new
license to those materials. The original author’s rights and all third-party
dependency licenses remain with their respective owners. Search indexing stays
disabled for the draft.
