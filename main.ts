// The Houseplant Out-of-Office — entry program.
//
// Writes exactly one out-of-office auto-reply (one line, <= 120
// characters) to /output/entry.txt, with a runtime guard mirroring
// the gate: UTF-8 text, 1..120 characters (code points), a single
// line, not only whitespace. The file is written byte-for-byte
// identical to the in-memory line and verified by a round-trip read
// before exit.
//
// Guard additions (revisi): the entry is built as exactly two
// sentences — the setup sentence plus the twist sentence — so the
// guard also requires exactly two terminal periods and no other
// sentence-ending punctuation, locking the two-beat structure the
// QA picked. Internal double spaces and tabs are rejected too (the
// previous guard only caught leading/trailing whitespace).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Final line chosen after QA dua lapis over the FULL Mistral panel
// (37/39 chat-capable models) + my own candidates. Winner: glm-5-latest.
// Why it wins against the judge brief (in the brief's own order):
// (1) unmistakably a houseplant's OOO — "Out of office:" framing,
// patio, birds; (2) a fresh, surprising joke — the plant may not
// come back because the birds won; (3) the plant's own life drives
// it — first day on the patio since 2022, i.e. ignored indoors for
// years, now outside at the birds' mercy; (4) tight: 107 chars,
// every word earning its place; (5) original, no office cliches.
// Rejected in QA: the lizard twist (zai-glm-5-3, 116 chars) and the
// plastic-plant twist (mistral-large-4, 119 chars) — both funnier
// on a first read, but the narrator explicitly stops being a
// houseplant, and criterion 1 of the brief says anything else loses
// to any auto-reply on the subject. Runner-up: mistral-large-latest
// "OOO: off photosynthesizing. Urgent? Ask the fern—he still
// remembers you overwatered him in March. —Ficus" (104 chars) —
// great specific grudge, but its punch ("he still remembers") is
// softer than "assume the birds won". My own candidates all ran
// over the 120-character cap and were discarded.
const LINE =
  "Out of office: enjoying my first day on the patio since 2022. If I'm not back Monday, assume the birds won.";

function main(): void {
  const chars = [...LINE];
  if (chars.length < 1 || chars.length > 120) {
    throw new Error(`entry must be 1..120 characters, got ${chars.length}`);
  }
  if (LINE.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  if (LINE !== LINE.trim()) {
    throw new Error("entry must not start or end with whitespace");
  }
  if (LINE.includes("\n") || LINE.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  if (LINE.includes("  ") || LINE.includes("\t")) {
    throw new Error("entry must not contain double spaces or tabs");
  }
  // Exactly two sentences: the setup + the twist. Two terminal
  // periods, no other sentence-ending punctuation anywhere.
  const periods = (LINE.match(/\./g) ?? []).length;
  if (periods !== 2) {
    throw new Error(`entry must be exactly two sentences, got ${periods} periods`);
  }
  // Split check: the two periods must actually separate two
  // non-empty sentences (catches ".." or a period inside a word).
  const sentences = LINE.split(". ");
  if (sentences.length !== 2 || sentences.some((s) => s.trim().length === 0)) {
    throw new Error("entry must split into exactly two non-empty sentences");
  }
  if (LINE.includes("!") || LINE.includes("?")) {
    throw new Error("entry must end its sentences with periods only");
  }

  const outDir = process.env.OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, LINE, "utf8");

  // Round-trip check: what landed on disk must be byte-for-byte the line.
  const back = readFileSync(outPath, "utf8");
  if (back !== LINE) {
    throw new Error("round-trip check failed: entry.txt differs from the line");
  }
}

main();
