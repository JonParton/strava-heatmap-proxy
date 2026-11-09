# strava-heatmap-proxy

This is a simple [Cloudflare Worker](https://workers.dev) allowing
unauthenticated access to personal and global Strava heatmaps. If you want to
use your personal Strava heatmap in Gaia or Locus, this will give you a URL that
you can use for that.

Note: you **will** need to be a Strava premium subscriber to use the personal
heatmap, while the global heatmaps are available to all Strava accounts.
Personal use only, please. Strava will ratelimit you.

# Usage

If you want to use these heatmaps as a tile layer in another app, here are the
template URLs to use:

- Personal: `https://strava-heatmap-proxy.YOUR_NAMESPACE.workers.dev/PROXY_TOKEN/personal/orange/all/{zoom}/{x}/{y}@2x.png`
- Global: `https://strava-heatmap-proxy.YOUR_NAMESPACE.workers.dev/PROXY_TOKEN/global/orange/all/{zoom}/{x}/{y}@2x.png`

Every request must carry the `PROXY_TOKEN` secret as its first path segment.
Anything else, including `/`, returns 404.

- Sizes: `{y}@small.png` (256px, global only), `{y}.png` (512px), `{y}@2x.png` (1024px)
- Colors: `mobileblue` (global only), `orange`, `hot`, `blue`, `bluered`, `purple`, `gray`
- Activities: `all`, `ride`, `winter`, `run`, `water`, or a single sport such as
  `sport_MountainBikeRide`, `sport_AlpineSki`, `sport_BackcountrySki`,
  `sport_NordicSki`, `sport_Hike`, `sport_TrailRun`

# Deploying the proxy

Requirements:

- [wrangler](https://github.com/cloudflare/wrangler) to manage Worker
  deployments

### Strava Credentials

Strava's API doesn't support heatmap access directly, so we'll need to
grab a session cookie from the browser for authentication.

1. Open https://strava.com/maps in your browser
2. Using devtools, find the `_strava4_session` cookie for `strava.com`

We also need your account id. You can find this by clicking on "My Profile"
on the Strava website and taking note of the URL:
`https://www.strava.com/athletes/{strava_id}`.

### Secrets

```bash
wrangler login

# The worker uses a KV namespace to cache CloudFront cookies and keep them up to
# date.
#
# Make sure to update wrangler.toml with the ID you get back.
wrangler kv namespace create STRAVA_HEATMAP_PROXY_COOKIES

echo "1234" | wrangler secret put STRAVA_ID
echo "abc123..." | wrangler secret put STRAVA_SESSION

# A long random string that gates the proxy. Keep it out of the repository.
openssl rand -hex 32 | wrangler secret put PROXY_TOKEN
```

The worker will automatically exchange your session cookie for CloudFront
credentials and refresh them as they expire.

### Rotating `STRAVA_SESSION`

The session cookie does expire eventually (and immediately if you log out of
Strava in that browser). When it does, tiles fail with a 500 saying
`Failed to obtain CloudFront cookies from Strava — session may be invalid`.
To fix it:

1. Log in at https://strava.com/maps and copy the new `_strava4_session`
   cookie value from devtools.
2. Run `wrangler secret put STRAVA_SESSION` and paste the value at the prompt.
   The secret takes effect straight away; no redeploy is needed.

Tiles already in Cloudflare's cache keep being served for up to
`TILE_CACHE_SECS` in the meantime.

### Verify

Check that everything's working by running `wrangler dev --remote`, which
uses the secrets and KV namespace set above.

Here's an example tile URL with some data:
`http://127.0.0.1:8787/PROXY_TOKEN/global/mobileblue/all/11/351/817@2x.png`
(Downtown Los Angeles)

When you're all set, use `wrangler deploy` to bring the site live on
`strava-heatmap-proxy.YOUR-NAMESPACE.workers.dev`

## Notes for this fork

This fork is deployed by hand with wrangler, on workers.dev, not by the GitHub
Action below.

```bash
npm install
npx wrangler dev --remote   # test against the real secrets and KV namespace
npx wrangler deploy
npx wrangler tail           # live logs when tiles start failing
```

Where things are kept:

- `PROXY_TOKEN`: 1Password, vault "Agents Shared", item "Strava heatmap proxy".
- `STRAVA_ID` and `STRAVA_SESSION`: Jon's own Strava item in 1Password. Enter
  them with `wrangler secret put`; never put them in a file.
- `LAYERS.md` (gitignored): the finished tile URLs for Gaia GPS, token
  included. Each one is
  `https://<worker hostname>/<PROXY_TOKEN>/<kind>/<color>/<activity>/{z}/{x}/{y}@2x.png`
  with max zoom 15. Changing the color, activity or size is only a URL change;
  nothing needs redeploying.
- `.dev.vars` (gitignored): `PROXY_TOKEN=...` for `wrangler dev`.

To rotate `PROXY_TOKEN`: `openssl rand -hex 32 | npx wrangler secret put PROXY_TOKEN`,
then update the 1Password item, `LAYERS.md`, `.dev.vars` and every map source
in Gaia. The old URLs stop working at once, though tiles already cached under
the old token can be served for up to `TILE_CACHE_SECS`.

## (optional) GitHub Actions

Start by forking this repository and setting up some GitHub secrets
(`github.com/you/strava-heatmap-proxy/settings/secrets/actions`).

- [`CF_ACCOUNT_ID`](https://developers.cloudflare.com/fundamentals/get-started/basic-tasks/find-account-and-zone-ids/)
- [`CF_API_TOKEN`](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- `KV_NAMESPACE_ID`: ID of the `STRAVA_HEATMAP_PROXY_COOKIES` KV store (see above)

These secrets will be used by GitHub Actions:

1. [deploy.yml](.github/workflows/deploy.yml): Deploy to Cloudflare on every
   commit to `main`.

Trigger the action for your first deploy, and you should be good to
go. Your site should now be live on
`strava-heatmap-proxy.YOUR-NAMESPACE.workers.dev`.
