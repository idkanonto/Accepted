# Bundled fonts

These are the Latin, normal-style, variable-weight Google Fonts used by the
application: Fraunces (100–900), Inter (100–900), and JetBrains Mono (100–800).
Only the weight axis varies, matching the previous `next/font/google` imports;
the other axes retain their defaults. The existing CSS variables and
`font-display: swap` are preserved by `next/font/local` in `app/layout.tsx`.
Fonts are bundled at build time and served by Next.js; builds need no access
to Google Fonts and no font package is a runtime dependency.

The unmodified WOFF2 assets and accompanying SIL Open Font License notices were
obtained from the npm registry's Fontsource variable packages, version **5.3.0**:

| File | Package | Google Fonts version |
| --- | --- | --- |
| `fraunces-latin-wght-normal.woff2` | `@fontsource-variable/fraunces` | v38 |
| `inter-latin-wght-normal.woff2` | `@fontsource-variable/inter` | v20 |
| `jetbrains-mono-latin-wght-normal.woff2` | `@fontsource-variable/jetbrains-mono` | v24 |

Upstream: <https://github.com/google/fonts>, distributed by
<https://github.com/fontsource/font-files>. Each downloaded package was verified
against the registry's SHA-512 integrity value before extracting the font and
license. Retain the corresponding `*-OFL.txt` notices when redistributing.
