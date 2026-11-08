// Run from the repository root: node docs/qa/verify-preservation.cjs <base-ref>
const ts = require('typescript');
const fs = require('fs');
const cp = require('child_process');
const printer = ts.createPrinter({ removeComments: true });
const base = process.argv[2] || 'origin/main';
const files = [
  'components/planner.tsx',
  'components/history-panel.tsx',
  'components/vault.tsx',
  'components/simulator.tsx',
  'components/mock-interview.tsx',
  'components/ec-rater.tsx',
  'components/analytics-dashboard.tsx',
  'components/auth-form.tsx',
];
function extract(text, path) {
  const src = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found = {};
  let hook = 0;
  const visit = (node) => {
    if (
      ts.isFunctionDeclaration(node) &&
      node.name &&
      !node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    )
      found['function:' + node.name.text] = printer
        .printNode(ts.EmitHint.Unspecified, node, src)
        .replace(/\s+/g, '');
    if (
      ts.isCallExpression(node) &&
      ['useEffect', 'useMemo'].includes(node.expression.getText(src))
    )
      found['hook:' + hook++] = printer
        .printNode(ts.EmitHint.Unspecified, node, src)
        .replace(/\s+/g, '');
    if (
      ts.isVariableDeclaration(node) &&
      [
        'update',
        'blank',
        'PROGRAM_OPTIONS',
        'CHECKLIST',
        'FORMATS',
        'DRAFT_KEY',
        'MAX_WORDS',
        'MAX_CHARS',
        'MAX_ECS',
        'toAttempt',
      ].includes(node.name.getText(src))
    )
      found['value:' + node.name.getText(src)] = printer
        .printNode(ts.EmitHint.Unspecified, node, src)
        .replace(/\s+/g, '');
    ts.forEachChild(node, visit);
  };
  visit(src);
  return found;
}
let checked = 0,
  failures = [];
for (const path of files) {
  const before = extract(
      cp.execFileSync('git', ['show', base + ':' + path], { encoding: 'utf8' }),
      path,
    ),
    after = extract(fs.readFileSync(path, 'utf8'), path);
  for (const [key, value] of Object.entries(before)) {
    checked++;
    if (after[key] !== value) failures.push(path + ' ' + key);
  }
}
const protectedDiff = cp
  .execFileSync(
    'git',
    [
      'diff',
      '--name-only',
      base,
      '--',
      'app/api',
      'lib',
      'supabase',
      'public/history.json',
      'components/auth-provider.tsx',
      'package.json',
      'package-lock.json',
      'next.config.mjs',
      'postcss.config.mjs',
      'tsconfig.json',
      '.env.example',
      'AGENTS.md',
    ],
    { encoding: 'utf8' },
  )
  .trim();
if (protectedDiff) failures.push('Protected files changed: ' + protectedDiff);
console.log(
  JSON.stringify(
    { checked, protectedFilesUnchanged: !protectedDiff, failures },
    null,
    2,
  ),
);
process.exit(failures.length ? 1 : 0);
