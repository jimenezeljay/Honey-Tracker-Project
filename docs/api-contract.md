# Honey Tracker: Frontend API Contract

**For:** Anastasia, Thomas and Adrian (backend and database)
**From:** the frontend (Seamus and Eljay)
**Status:** draft, matches the site on `main` as of Nov 6, 2026

The website runs on mock data in `public/js/data.js` today. Every page gets its data from **seven helper functions** in that file. When the backend is ready, each helper's body becomes one `fetch()` call to the endpoint below, and the pages keep working unchanged.

So the job for the backend is: **build these endpoints and return JSON in these shapes.** Field names are camelCase. If a name has to change, tell us and we'll change it in one place.

---

## How the switch works

At the top of `data.js`:

```js
const API_BASE = '';   // '' = the API is on the same server as the site (/api/...)
```

On Mr. Gallic's server, the site and API will most likely share one domain, so `API_BASE` stays `''` and the endpoints live under `/api`. If the API runs on its own address, only that one line changes.

Each helper then becomes:

```js
async function getListings() {
  const res = await fetch(`${API_BASE}/api/listings`);
  return res.json();
}
```

---

## Endpoint summary

| Helper in data.js | Endpoint | Used by | Sign-in needed |
|---|---|---|---|
| `getListings()` | `GET /api/listings` | Marketplace | No |
| `getListing(id)` | `GET /api/listings/:id` | Product page, Cart | No |
| `getTrace(batchId)` | `GET /api/batches/:id/trace` | Product page from a QR label | No |
| `getFarms()` | `GET /api/farms` | Homepage map, Map page | No |
| `getFarm(id)` | `GET /api/farms/:id` | (reserved: map popups) | No |
| `getKeeperDashboard()` | `GET /api/keeper/dashboard` | Beekeeper Dashboard | **Yes, approved keeper** |
| `getKeeperApplication()` | `GET /api/keeper/application` | Keeper pending page | **Yes** |

**Not found:** return HTTP `404` (the helper turns that into `null`, and the page shows the bee-pun not-found page).

---

## Shared objects

These appear inside several responses.

### Keeper (public view)

```json
{
  "id": 1,
  "displayName": "Ruth Hollis",
  "photo": null,
  "bio": "Third-generation keeper on the Ohio River hills.",
  "applicationStatus": "approved",
  "certification": "certified",
  "shipping": { "ships": true, "cost": 6, "turnaround": "2–3 days" },
  "pickup": true,
  "shopUrl": "https://example.com/sunrise-farm"
}
```

| Field | Type | Notes |
|---|---|---|
| `photo` | string URL or null | |
| `applicationStatus` | `submitted` / `under-review` / `approved` | |
| `certification` | `certified` / `pending` / `suspended` | |
| `shipping.ships` | boolean | false = pickup only |
| `shipping.cost` | number (USD) or null | Flat per order from this keeper |
| `shipping.turnaround` | string or null | Free text, shown as is |
| `pickup` | boolean | |
| `shopUrl` | string URL or null | Shown for honey not sold on Honey Tracker |

> **Never send** a keeper's address, email or phone to public endpoints. The pages don't need them.

### Farm

```json
{
  "id": 1, "keeperId": 1, "name": "Sunrise Farm",
  "description": "Hillside hives above the Ohio River.", "photo": null,
  "county": "Jefferson", "state": "OH",
  "lat": 40.36, "lng": -80.65,
  "precision": "exact",
  "verification": "volunteer",
  "certified": true
}
```

| Field | Type | Notes |
|---|---|---|
| `precision` | `exact` / `approximate` | The keeper's privacy choice |
| `lat`, `lng` | number | **For `approximate` farms, round these** (about 2 decimal places, roughly 1 km) |
| `verification` | `volunteer` / `self-reported` | Volunteer = checked in person by a surveyor |
| `state` | 2-letter code | |

### Hive

```json
{ "id": 1, "farmId": 1, "label": "H1", "lat": 40.362, "lng": -80.652, "forageRadiusMi": 2, "beeType": "Italian" }
```

> **Privacy rule:** for a farm with `precision: "approximate"`, the API must **not** send real hive coordinates. Send `lat`/`lng` as `null` (or the farm's rounded point). The maps only draw an area for these farms, but the browser can still see whatever the API sends.

### Batch (one harvest)

```json
{
  "id": 1, "batchNumber": "0001", "hiveIds": [1, 2, 3],
  "harvestDate": "2026-06-14", "season": "Spring 2026", "quantityLb": 40,
  "honeyType": "Wildflower", "texture": "liquid",
  "flowerTypes": ["Clover", "Aster"], "flags": [], "notes": "",
  "traceUrl": "product.html?batch=1"
}
```

| Field | Type | Notes |
|---|---|---|
| `harvestDate` | `YYYY-MM-DD` | |
| `texture` | `liquid` / `crystallized` / `creamed` | |
| `flags` | array of `creamed`, `single-hive` | |
| `traceUrl` | string | What the QR label on the jar points to |

### Other pieces

| Object | Shape |
|---|---|
| Practices | `{ "farmId": 1, "feedingNotes": "...", "pestNotes": "..." }` or `null` |
| Nearby flowers | `{ "farmId": 1, "flowers": ["Clover", "..."], "pesticideNotes": "..." }` or `null` |
| Pollen (list) | `[{ "batchId": 1, "flower": "Clover", "percent": 45 }, ...]`, percents add to 100 |
| Timeline (list) | `[{ "batchId": 1, "date": "2026-04-20", "stage": "bloom", "location": "Jefferson County, OH" }, ...]`, where `stage` is `bloom` / `harvest` / `jarred` |
| Badges | array of `certified`, `raw`, `pure`, `creamed`, `single-hive`, `volunteer-verified` |

---

## Public endpoints

### `GET /api/listings` (Marketplace)

Returns an **array** of flat listing cards:

```json
[{
  "id": 1, "batchId": 1, "title": "Wildflower Honey", "photo": null,
  "price": 14, "jarOz": 12, "stock": 24,
  "badges": ["certified", "raw", "volunteer-verified"],
  "farmId": 1, "farmName": "Sunrise Farm", "state": "OH", "lat": 40.36, "lng": -80.65,
  "honeyType": "Wildflower", "texture": "liquid", "season": "Spring 2026",
  "harvestDate": "2026-06-14", "flags": []
}]
```

- `price` is USD and `jarOz` is ounces. `stock: 0` shows "Sold out".
- Filtering and sorting happen in the browser for now. Later the page can send them as query parameters: `?type=&badges=&state=&min=&max=&season=&sort=`.

### `GET /api/listings/:id` (Product page, Cart)

Returns everything in the listing card above, **plus**:

```json
{
  "...all listing card fields...": "",
  "batch":  { "...Batch..." },
  "hives":  [ { "...Hive..." } ],
  "farm":   { "...Farm..." },
  "keeper": { "...Keeper (public)..." },
  "practices": { "...or null" },
  "nearbyFlowers": { "...or null" },
  "pollen":   [ ],
  "timeline": [ ],
  "listing": true
}
```

The Cart calls this once per item to get the current price, stock and the keeper's shipping and pickup options.

### `GET /api/batches/:id/trace` (QR labels)

This is what a jar's QR code opens (`product.html?batch=11`).

- **If the batch is listed for sale:** return the same response as `GET /api/listings/:id` for that listing.
- **If it isn't** (for example, a farmers-market jar): return the same shape **without** price, stock and jar size, with `"listing": false`, and with `title` and `badges` filled in from the batch and farm:

```json
{
  "title": "Goldenrod Honey", "listing": false,
  "farmId": 1, "farmName": "Sunrise Farm", "state": "OH",
  "season": "Fall 2026", "harvestDate": "2026-09-20",
  "badges": ["certified", "single-hive", "volunteer-verified"],
  "batch": { }, "hives": [ ], "farm": { }, "keeper": { },
  "practices": { }, "nearbyFlowers": { }, "pollen": [ ], "timeline": [ ]
}
```

### `GET /api/farms` (maps)

Returns an **array** of farms, each with its keeper, hives and listings:

```json
[{
  "...Farm fields...": "",
  "keeper":   { "...Keeper (public)..." },
  "hives":    [ { "...Hive (respect the privacy rule)..." } ],
  "listings": [ { "...listing card..." } ]
}]
```

The maps cluster farms and draw each hive's forage circle from `forageRadiusMi`. This is the endpoint where the **approximate-farm privacy rule matters most**.

### `GET /api/farms/:id`

One farm with `keeper` and `hives`. No page calls this yet; it's reserved for map popups.

---

## Signed-in endpoints (beekeepers)

These need a working login (HC-113). The rules that matter:

1. **Work out who the keeper is from the session (cookie or token), never from the URL.** A request like `/api/keeper/dashboard?keeperId=2` must not show keeper 2's data.
2. **Check on the server.** The frontend hides beekeeper pages from shoppers, but that isn't security. The API has to refuse.
3. Not signed in → `401`. Signed in but not an approved keeper → `403`.

### `GET /api/keeper/dashboard`

Only the signed-in keeper's own records:

```json
{
  "keeper":   { "...Keeper..." },
  "farms":    [ { "...Farm (exact coordinates are fine here, they're the keeper's own)..." } ],
  "hives":    [ ],
  "batches":  [ ],
  "listings": [ { "id": 1, "batchId": 1, "title": "...", "price": 14, "jarOz": 12, "stock": 24, "badges": [] } ]
}
```

A brand-new keeper gets empty arrays. A suspended keeper gets `keeper.certification: "suspended"`.

### `GET /api/keeper/application`

```json
{ "status": "under-review" }
```

`status` is `submitted` / `under-review` / `approved`.

---

## Keeper saves (built on the frontend, using browser storage for now)

`saveFarm()` and `saveHarvest()` in `data.js` keep new records in the browser's `localStorage` until these endpoints exist. Both need an approved keeper, worked out from the session as above. The server sets `id`, `keeperId`, `verification` (`self-reported`), `certified` (`false`), `batchNumber` and `traceUrl`.

### `POST /api/farms`, then `POST /api/farms/:id/hives` (Add farm wizard, HC-68)

```json
{
  "farm": { "name": "Sunrise Farm", "description": "...", "county": "Jefferson", "state": "OH", "precision": "exact" },
  "hives": [ { "label": "H1", "lat": 40.362, "lng": -80.652, "forageRadiusMi": 2, "beeType": "Italian" } ],
  "practices": { "feedingNotes": "...", "pestNotes": "..." },
  "nearbyFlowers": { "flowers": ["Clover"], "pesticideNotes": "..." }
}
```

The server works out the farm's `lat` and `lng` from its hives. For `precision: "approximate"`, public responses must follow the privacy rule above. The browser version keeps only the rounded point. The wizard previews a farm photo but doesn't send it yet.

### `POST /api/batches` (Log harvest, HC-69)

```json
{
  "hiveIds": [1, 2], "harvestDate": "2026-06-14", "season": "Summer 2026", "quantityLb": 40,
  "honeyType": "Wildflower", "texture": "liquid", "flowerTypes": ["Clover"], "flags": [], "notes": ""
}
```

The server must check that every hive belongs to the signed-in keeper, and should add a `harvest` timeline event. The new batch has no pollen profile until one is added.

---

## Coming next (not built on the frontend yet)

These pages will need endpoints that **write** data. We'll add shapes here as each page is built.

| Feature | Likely endpoint | Ticket |
|---|---|---|
| Checkout / place an order | `POST /api/orders` (with Stripe or Square) | HC-63, HC-109, HC-119 |
| Sign up, sign in, sign out, reset password | `POST /api/auth/...` | HC-113 |
| Beekeeper application | `POST /api/keeper/application` | |
| Edit my application | `PUT /api/keeper/application` | HC-124 |
| Profile | `GET` / `PUT /api/me` | HC-125 |
| QR label | uses the batch's `traceUrl` | HC-70 |

**The cart** lives in the shopper's browser for now (saved locally, not on the server). It only needs the server at checkout, when the order is sent and the server **re-checks every price and stock level**. Never trust prices sent from the browser.

---

## Questions for the backend team

1. Will the API live on the same server and domain as the site (`/api/...`)? That's the simplest setup and avoids CORS.
2. Are you OK with camelCase JSON field names, or do you want snake_case to match PostgreSQL? Either works; we just need to pick one.
3. Who rounds approximate-farm coordinates: the database view or the API code?
4. How will photos be stored and served (a URL per farm, keeper and listing)?
