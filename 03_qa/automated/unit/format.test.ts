import assert from "node:assert/strict";
import test from "node:test";
import { scaleMarkerPercent } from "../../../02_source/lib/format";

test("scaleMarkerPercent menjaga penanda di dalam skala", () => {
  assert.equal(scaleMarkerPercent(0), 0);
  assert.equal(scaleMarkerPercent(215), 21.5);
  assert.equal(scaleMarkerPercent(500), 50);
  assert.equal(scaleMarkerPercent(1000), 100);
  assert.equal(scaleMarkerPercent(-20), 0);
  assert.equal(scaleMarkerPercent(1200), 100);
});
