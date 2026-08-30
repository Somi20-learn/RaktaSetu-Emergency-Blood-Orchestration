# RaktaSetu — End-to-End Test Checklist

Manual verification for the **frontend ↔ backend integration** (Member 4 / Alok).
No automated tests — this is a step-by-step script you run before the demo.

> Backend state is **in-memory**: every reserve/accept/reject mutates shared state,
> and **restarting the backend resets all stock and requests**. Restart between test
> runs to get clean numbers.

---

## 0. Prerequisites
- Node.js 18+ and npm installed (`node -v`, `npm -v`).
- **Network access** for `npm install` (the two installs below download packages).
- Two terminal tabs — one for the backend, one for the frontend.
- Repo layout after restructure:
  ```
  RaktaSetu-Emergency-Blood-Orchestration/
    Backend/     (Express API, port 5000)
    Frontend/    (React + Vite, port 5173)
    docs/
  ```

---

## 1. Start the backend
```bash
cd Backend
npm install
npm run dev
```
Expect: `Server is running on port 5000`.

Quick API smoke test (new terminal — hits the real API directly):
```bash
curl -s http://localhost:5000/api/blood-stock
```
Expect JSON with 3 banks (City Blood Bank, LifeCare Blood Bank, Red Cross Blood Bank), each with `inventory` and `lat`/`lng`.

```bash
curl -s "http://localhost:5000/api/donors?bloodGroup=A+"
```
Expect the A+ donor **plus** both O- donors (universal) — 3 donors.

---

## 2. Start the frontend
```bash
cd Frontend
npm install
npm run dev
```
Expect Vite to print a Local URL (usually `http://localhost:5173`). Open it.
The Vite dev proxy forwards `/api/*` → `http://localhost:5000`, so no CORS setup is needed.

✅ **Confirm it's the real UI**: the header reads "RaktaSetu — Real-Time Emergency Blood Orchestration Network" with the "Live AI Network Active" badge, and the right panel says **"Network Ready"** before any search.

---

## 3. Happy path — request → match → reserve → accept
1. Left form: Blood Group **O-**, Units **2**, Urgency **Critical**, submit **Broadcast SOS Request**.
2. Expect **Request Status** card: badge **Matched**, "Request #1 • 2 unit(s) of O- • Critical urgency".
3. Expect **Fastest Feasible Source** = **City Blood Bank** (score 100, 5 km, 3 units).
4. Expect **Ranked Blood Banks (3)**: `#1 City (100) ◀ current` > `#2 LifeCare (90)` > `#3 Red Cross (80)`.
5. Expect **Nearby Volunteer Donors** = 2 (both O- donors).
6. Expect the **🗺️ Live Orchestration Map**: an OpenStreetMap view with a 🏥 hospital pin, 🩸 bank pins (the current source = **green**), 🙋 donor pins, and a dashed green line from the hospital to the current source. Click any pin → popup with its details. The map auto-fits to show all markers.
7. Click **Reserve Blood** → info line "Reserved 2 unit(s) of O- at City Blood Bank — 1 left in stock." Button becomes **Reserved ✓**, badge → **Reserved**.
8. Click **Bank Accepts** → badge → **Accepted** (green), active card shows "✅ Fulfilled by City Blood Bank." Action buttons disappear.

---

## 4. Escalation path — reject → next bank → no-match
Restart the backend first (fresh stock), reload the page.
1. Submit **O- / 2 / Critical** again.
2. Click **Bank Rejects → Escalate** → badge **Escalated**, message "Escalated to the next source: LifeCare Blood Bank." Active source becomes **LifeCare**; in the ranked list `#1 City` is dimmed `(rejected)`, `#2 LifeCare ◀ current`. On the map, the **green pin + dashed route line jump to LifeCare**.
3. Reject again → escalates to **Red Cross**.
4. Reject a third time → badge **No Match**, message "All feasible banks exhausted — escalate to the volunteer donor network below." Active-source card disappears; donor panel remains as the fallback.

---

## 5. No compatible bank — donor fallback
Restart backend, reload.
1. Submit **O- / 10 / Critical** (no bank has 10 units of O-: stock is City 3, LifeCare 5, Red Cross 4).
2. Expect badge **No compatible bank**, Ranked Blood Banks (0) with "No blood bank has 10+ units of O-. Routing to the volunteer donor network below."
3. Donor panel still lists the O- volunteers — the escalation-to-donors story.

---

## 6. Reserve edge — not enough stock
1. Submit **O- / 2 / Critical**. Active source City (3 units).
2. Reserve once (→ 1 left). Restart is **not** needed; instead submit a *new* request **O- / 2** — City now shows **1 unit** and is skipped (LifeCare becomes #1). This proves the reserve actually mutated real stock.
3. Optional direct check:
   ```bash
   curl -s -X POST http://localhost:5000/api/reserve \
     -H "Content-Type: application/json" \
     -d '{"bankId":1,"bloodGroup":"O-","units":99}'
   ```
   Expect `{"message":"Not enough blood available"}` (HTTP 400) → UI shows the red error box.

---

## 7. Prove it's the API, not the old mock
1. Stop the backend. Edit `Backend/data/bloodData.js` — change City Blood Bank `"O-"` from `3` to `25`.
2. Restart backend, reload the page, submit **O- / 2**.
3. City Blood Bank should now show **25 units**. If the number changed, the UI is reading live backend data (the old build used a hardcoded `MOCK_DATA` that could never change this way).
4. Revert the edit afterward.

---

## 8. Sanity / no-regression
- Browser devtools **Console**: no red errors during the flow.
- Browser devtools **Network**: `POST /api/requests`, `GET /api/donors`, `POST /api/reserve|accept|reject` all return **200** (except the intentional 400 in step 6).
- Urgency mapping works: Critical→critical (+30), High→urgent (+20), Moderate→routine (+10) — a Critical O- match at City scores 100, a Moderate one scores 80.

---

## Known limitations (fine for the hackathon demo)
- In-memory store: restart resets everything; no database yet (Member 2's part).
- Compatibility is exact-group + O- universal for donors; full ABO/Rh cross-compatibility not yet implemented.
- Map view uses **Leaflet + OpenStreetMap** (`react-leaflet`), plotting the hospital, matched banks (green = current source, with a route line), and donors from the `lat`/`lng` in the API responses. The hospital coordinate is a fixed demo location (`Frontend/src/App.jsx` → `HOSPITAL_COORDS`) labeled with the typed location — free-text geocoding is not wired.
- "Send Alert" on a donor is a client-side `alert()` demo, not a real notification.

## Troubleshooting
- **Frontend loads but requests fail** → backend not running on 5000, or started after Vite. Start backend first, then reload.
- **`npm install` fails** → needs network; retry on a connected network.
- **Port 5000 in use** → stop the other process, or change the port in `Backend/index.js` (and the proxy target in `Frontend/vite.config.js`).
- **CORS error** → shouldn't happen (proxy + `cors()` both enabled); confirm you're opening the Vite URL (5173), not a file:// path.
