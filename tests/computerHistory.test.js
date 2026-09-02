import test from "node:test";
import assert from "node:assert/strict";

import {
  HISTORY_HEADERS,
  buildHistoryRow,
} from "../components/computerHistory.js";

test("builds an issue history row with a real Date value", () => {
  const row = buildHistoryRow({
    operation: "issue",
    actNumber: 6756,
    pcModel: "HP EliteBook 840 G11",
    pcSerial: "5CG5113Q1Z",
    pgAssetPc: "PG20200487110",
    sapAssetNumberPc: 320000467590,
    assetType: "Laptop",
    location: "P&G Novomoskovsk Plant (LE 614)",
    intranetName: "ageeva.a",
    userName: "Агеева Арина",
    performedBy: "Горшков Илья",
    date: new Date(2026, 8, 2),
  });

  assert.equal(row.length, HISTORY_HEADERS.length);
  assert.equal(row[0], "6756");
  assert.equal(row[7], "On stock");
  assert.equal(row[8], "In use");
  assert.equal(row[10], "ageeva.a");
  assert.ok(row[9] instanceof Date);
});

test("builds a surrender row with the _1 act suffix", () => {
  const row = buildHistoryRow({
    operation: "surrender",
    actNumber: 6612,
    pcModel: "HP EliteBook 840 G11",
    pcSerial: "5CG5113QH1",
    pgAssetPc: "PG20200487114",
    sapAssetNumberPc: 320000467594,
    assetType: "Laptop",
    location: "P&G Novomoskovsk Plant (LE 614)",
    userName: "Трунова Елена",
    performedBy: "Чечин Денис",
    broken: true,
    date: new Date(2026, 7, 31),
  });

  assert.equal(row[0], "6612_1");
  assert.equal(row[7], "In use");
  assert.equal(row[8], "Broken");
  assert.equal(row[10], "IT Stock");
});
