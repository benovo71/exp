import test from "node:test";
import assert from "node:assert/strict";

import {
  isLaptop,
  selectComputersForTransfer,
} from "../components/ownershipTransfer.js";

test("recognizes laptop and lэptop asset types case-insensitively", () => {
  assert.equal(isLaptop("Laptop"), true);
  assert.equal(isLaptop("Лэптоп"), true);
  assert.equal(isLaptop("Desktop PC"), false);
});

test("excludes a laptop from ownership transfer", () => {
  const computers = [
    { pgAssetPc: "PG1", assetType: "Desktop" },
    { pgAssetPc: "PG2", assetType: "Laptop" },
  ];

  const result = selectComputersForTransfer(computers);

  assert.deepEqual(result.computers, [computers[0]]);
  assert.equal(result.laptopCount, 1);
});

test("excludes all laptops and reports their count", () => {
  const computers = [
    { pgAssetPc: "PG1", assetType: "Laptop" },
    { pgAssetPc: "PG2", assetType: "Ноутбук" },
    { pgAssetPc: "PG3", assetType: "Desktop" },
  ];

  const result = selectComputersForTransfer(computers);

  assert.deepEqual(result.computers, [computers[2]]);
  assert.deepEqual(result.laptops, [computers[0], computers[1]]);
  assert.equal(result.laptopCount, 2);
});
