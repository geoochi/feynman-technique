# GitHub repository and contribution entry review

Date: 2026-10-11. Base commit: `8b5dee0f6e812d14ecc142e6e8441e55e9249739`. Review target: the final working tree for repository documentation, public GitHub navigation, contribution copy, and browser assertions.

The maintainer explicitly requested the repository rename, English-first README with Chinese/Japanese links, website GitHub links, and encouragement of experiment Issues/PRs, then explicitly approved making the repository public. Existing commit/push and Cloudflare deployment authorization applies.

Reviewed the diff, shared link configuration, both page headers, translations, homepage styles, README variants, contribution guide, templates, and related architecture/deployment/SEO records. Models, parameter schemas, runtime, routes, canonical origin, author filtering, and licenses are unchanged. No backend, Actions workflow, or second publication channel was introduced.

Validation:

- Type checking and production build pass: 24 prerendered pages, 21 sitemap URLs, verification file retained.
- Initial app/i18n/SEO browser run: 49 passed, 4 intentional mobile skips, 1 failure identifying a pre-existing mobile selector that hid the new GitHub link. Removed the selector; final SEO run: all 6 checks passed. These cover all 21 content routes without JavaScript, metadata/language navigation, contribution destinations, and all three homepages on desktop/mobile.
- Six homepage screenshots and a mobile experiment header inspected. Links and text remain visible, with no horizontal overflow.
- Local README/contribution links exist and diff whitespace checks pass.
- Scanned Git-history blobs for common token/private-key and quoted-secret patterns: no matches. This is a bounded pattern check, not a guarantee about every possible secret.
- Published the final frontend assets through Wrangler to the existing Worker, version `d95e4c0d-f7eb-49e5-bc8d-e66ef4b33dc9`, active at 100%. Matched all 24 online HTML pages after removing only the platform analytics injection; matched robots, sitemap, catalog and social images. Verified actual missing resources and contribution routes return 404; 14 apex HTTP/HTTPS path/query combinations preserve their destination with 301.

No remaining blocking issue found within the reviewed scope. The site still awaits independent teaching review and Workers Builds integration. Public source visibility does not grant an open-source license; README and CONTRIBUTING state the existing permission boundary and ask new contributors to discuss licensing. No scientific model tests were rerun because those files were unchanged.
