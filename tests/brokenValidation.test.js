import test from "node:test";
import assert from "node:assert/strict";

import { validateFormData } from "../components/validation.js";

test("validateFormData requires a broken description when broken is selected", () => {
  assert.throws(
    () =>
      validateFormData({
        userName: "Иванов И.И.",
        pgNumber: "PG0066889",
        surrender: true,
        broken: true,
      }),
    /Не указано описание неисправности/,
  );
});

test("validateFormData keeps the broken description", () => {
  const data = validateFormData({
    userName: "Иванов И.И.",
    pgNumber: "PG0066889",
    surrender: true,
    broken: true,
    brokenDescription: "Не включается",
  });

  assert.equal(data.broken, true);
  assert.equal(data.brokenDescription, "Не включается");
});
