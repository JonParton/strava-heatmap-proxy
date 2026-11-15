const test = require("node:test");
const assert = require("node:assert");
const { isKnownActivity } = require("./activities");

test("accepts the groups and sports used by the map layers", () => {
  for (const name of [
    "all",
    "run",
    "sport_Run",
    "sport_TrailRun",
    "sport_Hike",
    "sport_Walk",
    "sport_MountainBikeRide",
    "sport_AlpineSki",
    "sport_BackcountrySki",
    "sport_NordicSki",
  ]) {
    assert.ok(isKnownActivity(name), name);
  }
});

test("rejects typos, wrong case and names Strava does not know", () => {
  for (const name of [
    "hike",
    "foot",
    "sport_hike",
    "Sport_Hike",
    "sport_Bogus",
    "Hike",
    "",
    "constructor",
  ]) {
    assert.ok(!isKnownActivity(name), name);
  }
});
