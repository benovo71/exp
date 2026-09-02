import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeText,
  sanitizeFileName,
  sanitizePersonName,
  validateFormData,
} from "../components/validation.js";

test("validateFormData trims fields and preserves optional checklist data", () => {
  assert.deepEqual(
    validateFormData({
      userName: "  Иванов И.И. ",
      pgNumber: " PG0066889 ",
      issuedBy: " Петров П.П. ",
      performedBy: " Сидоров С.С. ",
      ticket: " INC-12345 ",
      intranetName: " ivanov.ii ",
      adviros: true,
      surrender: false,
    }),
    {
      userName: "Иванов И.И.",
      pgNumber: "PG0066889",
      issuedBy: "Петров П.П.",
      performedBy: "Сидоров С.С.",
      ticket: "INC-12345",
      intranetName: "ivanov.ii",
      adviros: true,
      surrender: false,
    },
  );
});

test("validateFormData rejects a missing PG number", () => {
  assert.throws(
    () => validateFormData({ userName: "Иванов И.И." }),
    /Не указан PG номер/,
  );
});

test("validateFormData uses PG number for surrender", () => {
  assert.deepEqual(
    validateFormData({
      userName: "Горшков Илья",
      surrender: true,
      pgNumber: "PG0801813",
    }),
    {
      userName: "Горшков Илья",
      pgNumber: "PG0801813",
      issuedBy: "",
      performedBy: "",
      ticket: "",
      intranetName: "",
      adviros: false,
      surrender: true,
    },
  );
});

test("normalizeText removes line breaks and surrounding spaces", () => {
  assert.equal(normalizeText("  310000\r\n203629  "), "310000 203629");
});

test("sanitizeFileName creates a safe readable name", () => {
  assert.equal(sanitizeFileName("Иванов И.И."), "Иванов_И_И");
});

test("sanitizePersonName keeps the requested surname-name format", () => {
  assert.equal(sanitizePersonName("Горшков Илья"), "Горшков Илья");
});
