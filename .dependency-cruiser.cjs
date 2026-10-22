// Mimari kapı. Katmanlar gerçek import grafiğinden (2026-10-22) ve README "Layout" bölümünden türetildi:
// src: core <- world <- agents <- game <- ui <- main.js (alt katman üst katmanı import etmez).
// server: lib <- harnesses <- scan/api/serve; adaptörlere yalnız harnesses/index.mjs üzerinden erişilir.
// Bilinen ihlal baseline'ı .dependency-cruiser-known-violations.json (2026-10-22'de boş: []); check --ignore-known ile okur.
// Her src katmanı, kendisinden üstteki katmanları import edemez.
const SRC_LAYERS_ABOVE = {
  core: '^src/(world|agents|game|ui|audio)/|^src/main[.]js$',
  world: '^src/(agents|game|ui)/|^src/main[.]js$',
  agents: '^src/(game|ui)/|^src/main[.]js$',
  game: '^src/ui/|^src/main[.]js$',
  ui: '^src/main[.]js$',
};

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'error',
      from: { orphan: true },
      to: {},
    },
    {
      name: 'not-to-unresolvable',
      comment: 'An unresolved import escapes every path rule; fix the specifier.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    ...Object.entries(SRC_LAYERS_ABOVE).map(([layer, above]) => ({
      name: `src-${layer}-not-to-upper-layer`,
      comment: `src/${layer} is below these layers and must not import them.`,
      severity: 'error',
      from: { path: `^src/${layer}/` },
      to: { path: above },
    })),
    {
      name: 'browser-not-to-node',
      comment: 'src/ runs in the browser (Vite): no server/, tools/, test/ or node core modules.',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^(server|tools|test)/' },
    },
    {
      name: 'browser-not-to-node-core',
      severity: 'error',
      from: { path: '^src/' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'server-not-to-src',
      severity: 'error',
      from: { path: '^server/' },
      to: { path: '^(src|tools)/' },
    },
    {
      name: 'harness-only-via-registry',
      comment: 'Outside server/harnesses only index.mjs (the registry) may be imported (README "Adding one").',
      severity: 'error',
      from: { path: '^(server|src|tools)/|^vite[.]config[.]js$', pathNot: '^server/harnesses/' },
      to: { path: '^server/harnesses/', pathNot: '^server/harnesses/index[.]mjs$' },
    },
    {
      name: 'harness-adapter-only-to-lib',
      comment: 'An adapter is one file: it may use server/lib, never another adapter, the registry or the scanner.',
      severity: 'error',
      from: { path: '^server/harnesses/', pathNot: '^server/harnesses/index[.]mjs$' },
      to: { path: '^server/', pathNot: '^server/lib/' },
    },
    {
      name: 'server-lib-is-leaf',
      severity: 'error',
      from: { path: '^server/lib/' },
      to: { path: '^server/', pathNot: '^server/lib/' },
    },
  ],
  options: {
    doNotFollow: { path: ['node_modules'] },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.js', '.mjs'],
    },
  },
};
