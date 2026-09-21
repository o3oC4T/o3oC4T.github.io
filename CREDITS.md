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

No ownership of the original design or renderer is claimed. Public availability
does not itself establish a reuse license; this repository does not grant a new
license to those materials. The original author’s rights and all third-party
dependency licenses remain with their respective owners. Search indexing stays
disabled for the draft.
