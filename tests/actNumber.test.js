import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { getNextActNumber, extractActNumber } from "../components/actNumber.js";

test("extractActNumber reads a number at the beginning of an act filename", () => {
  assert.equal(extractActNumber("1224 Горшков Илья.docx"), 1224);
  assert.equal(extractActNumber("акт.docx"), null);
});

test("getNextActNumber returns the number after the largest existing act", async () => {
  const directory = await mkdtemp(join(tmpdir(), "exp-acts-"));
  await writeFile(join(directory, "1223 Петров Пётр.docx"), "");
  await writeFile(join(directory, "1200 Иванов Иван.docx"), "");
  await writeFile(join(directory, "readme.txt"), "");

  assert.equal(getNextActNumber(directory), 1224);
});
