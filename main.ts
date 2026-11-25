// Absurd Micro-Startup Pitch-Off — entry program.
// Writes one sentence (169 chars) to $MAKEFUN_OUTPUT_DIR/entry.txt,
// then reads it back and verifies byte-exact equality, no trailing newline.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE =
  "An AI agent that files your expense reports in the voice of a tired accountant who has given up, $4 a month, sold to startups with 3 employees and 47 SaaS subscriptions.";

function charCount(text: string): number {
  return [...text].length;
}

function validate(line: string): void {
  const n = charCount(line);
  if (n < 1 || n > 200) {
    throw new Error(`line must be 1-200 chars, got ${n}`);
  }
  if (line !== line.trim()) {
    throw new Error("line has leading or trailing whitespace");
  }
  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("line must be a single line");
  }
  if (line.includes("  ")) {
    throw new Error("line contains a double space");
  }
  // Reject control characters (other than the newline already excluded):
  // the gate requires plain UTF-8 text, so nothing invisible may sneak in.
  for (const ch of line) {
    if (ch.codePointAt(0)! < 0x20 || ch.codePointAt(0) === 0x7f) {
      throw new Error(`line contains control character U+${ch
        .codePointAt(0)!
        .toString(16)
        .padStart(4, "0")}`);
    }
  }
  if (!/[.!?]$/.test(line)) {
    throw new Error("line must end with sentence punctuation");
  }
}

function main(): void {
  validate(LINE);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, LINE, "utf8");

  // Read back and verify: byte-exact equality, no trailing newline.
  // Compare raw bytes, not just the decoded string, so a BOM or an
  // encoding drift cannot slip past the string comparison.
  const raw = readFileSync(outPath);
  const expected = Buffer.from(LINE, "utf8");
  if (!raw.equals(expected)) {
    throw new Error("round-trip mismatch: entry.txt bytes differ from LINE");
  }
  const back = raw.toString("utf8");
  if (back.endsWith("\n")) {
    throw new Error("entry.txt must not end with a newline");
  }
  const bytes = raw.length;
  console.log(
    `wrote ${outPath}: ${charCount(LINE)} chars, ${bytes} bytes (gate 1-200 chars)`,
  );
  console.log(back);
}

main();
