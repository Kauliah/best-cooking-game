// Copper Ladle — entry hand-in program (Node 22+, standard library only).
//
// It hands the game in: copies this repository's game/ and screenshots/
// into the output directory and writes /output/dossier.json, the summary
// the judge reads, built with the vendored make.fun library.
//
// Run it locally to check the hand-in before submitting:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
// Serve the game itself with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// Start clean so a stale file from an earlier run can never leak in.
for (const name of ['game', 'screenshots', 'dossier.json']) {
  const target = join(out, name);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps for this bounty: at most 4 screenshots of 256 KiB each,
// at most 993 files / 48 MiB under game/, game paths under 1000 bytes,
// and the dossier's text budget of 160 KiB.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Read the dossier back and confirm it parses: a hand-in the judge cannot
// read is no hand-in at all.
const written = JSON.parse(readFileSync(join(out, 'dossier.json'), 'utf8'));
if (written.schema !== 'makefun/dossier/v1') {
  throw new Error(`unexpected dossier schema: ${String(written.schema)}`);
}
console.log(`hand-in written to ${out} (${dossier.length} bytes of dossier)`);
