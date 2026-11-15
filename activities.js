// Activity names the proxy passes on to Strava. Anything else gets a 400.
//
// Strava's global heatmap rejects an unknown name itself, but the personal
// heatmap answers 200 with a blank tile, which would then sit in the cache for
// TILE_CACHE_SECS. Checking here makes a typo in a map source fail loudly.
//
// The list is every name the global heatmap answered 200 for on 2026-11-15.
// To add a sport, check it against a global tile first, then add it here.

// Groups of sports. `run` is every on-foot sport (run, trail run, walk, hike)
// on the global heatmap; on the personal heatmap it is runs only.
const GROUPS = ["all", "ride", "run", "water", "winter"];

const SPORTS = [
  "AlpineSki",
  "BackcountrySki",
  "Badminton",
  "Canoeing",
  "EBikeRide",
  "EMountainBikeRide",
  "Golf",
  "GravelRide",
  "HighIntensityIntervalTraining",
  "Hike",
  "IceSkate",
  "InlineSkate",
  "Kayaking",
  "Kitesurf",
  "MountainBikeRide",
  "NordicSki",
  "Pickleball",
  "Ride",
  "RockClimbing",
  "RollerSki",
  "Rowing",
  "Run",
  "Sail",
  "Skateboard",
  "Snowboard",
  "Snowshoe",
  "Soccer",
  "StandUpPaddling",
  "Surfing",
  "Swim",
  "Tennis",
  "TrailRun",
  "VirtualRide",
  "Walk",
  "WeightTraining",
  "Windsurf",
  "Workout",
];

const ACTIVITIES = new Set([...GROUPS, ...SPORTS.map((s) => `sport_${s}`)]);

const isKnownActivity = (activity) => ACTIVITIES.has(activity);

module.exports = { ACTIVITIES, isKnownActivity };
