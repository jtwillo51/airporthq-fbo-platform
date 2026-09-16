"""
Generate the complete synthetic dataset behind the AirportHQ demo.

ALL DATA PRODUCED HERE IS FABRICATED. This is a portfolio piece; no real
customer, aircraft owner, or financial record appears in it. The operator
(Ridgeline Aviation, KXRG) is fictional.

Range: Aug 2025 - Feb 2027 (19 months). Data is generated across the full
range so forecasts have held-out ground truth to be scored against; the app
clamps all display to <= today (see airporthq-platform/src/lib/clock.ts).

Business rules baked in here:
  - Landing / ramp fees split 80/20 AFTER 5% state sales tax and a 3.5% card
    processing fee: the FBO keeps 80%, the airport authority receives 20%.
  - Hangar rent on transient stays is split with the third-party hangar
    owner, who receives 70% of net rent.
  - Fuel margin is retail minus wholesale cost, both of which are generated.

Deliberate anomalies are injected at known months so the anomaly-detection
feature has genuine signal to find rather than noise (see ANOMALIES).

Deterministic: seeded RNG, so re-running produces identical output.
"""
import json
import random
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "shared-data"
OUT.mkdir(parents=True, exist_ok=True)

START = date(2025, 8, 1)
END = date(2027, 2, 1)

rng = random.Random(20260819)

# The cash box is one continuous ledger across the entire range - its running
# total must never restart at a month boundary.
CASH = {"balance": 325.35}

# --- deliberate, documented anomalies -------------------------------------
# These are real *operational* events a working FBO would want flagged, not
# fabricated spreadsheet defects.
ANOMALIES = {
    "2026-03": "jet_a_leak",       # tank losses breach the leak-check threshold
    "2026-01": "margin_squeeze",   # wholesale spikes, posted retail lags behind
    "2025-11": "shop_overhaul",    # one large engine overhaul distorts parts spend
}

SEASON = {1: 0.55, 2: 0.60, 3: 0.72, 4: 0.85, 5: 1.00, 6: 1.20,
          7: 1.35, 8: 1.30, 9: 1.05, 10: 0.88, 11: 0.68, 12: 0.58}

# Aircraft registrations and owner names are GENERATED, not transcribed.
# An earlier revision of this file seeded these lists from the real operator's
# customer book, which meant fabricated financial transactions were being
# attributed to real aircraft and real people - the exact thing the rest of
# this script exists to avoid. They are now produced from a dedicated seeded
# RNG so they are reproducible without being anyone's actual data.
_id_rng = random.Random(7731)
_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"   # FAA registrations omit I and O


def _make_tails(n):
    out = set()
    while len(out) < n:
        out.add(f"N{_id_rng.randint(100, 999)}{_id_rng.choice(_LETTERS)}{_id_rng.choice(_LETTERS)}")
    return sorted(out)


_all_tails = _make_tails(35)
JET_TAILS = _all_tails[:24]
PISTON_TAILS = _all_tails[24:]
BASED_TAILS = PISTON_TAILS[:4]
OVERHAUL_TAIL = BASED_TAILS[3]      # the aircraft in the injected overhaul month
CREW = ["Kaleb", "Tyler", "Dan"]
VENDORS = ["AMAZON", "ACE HARDWARE", "AIRCRAFT SPRUCE", "AVIAT AIRCRAFT",
           "CARQUEST", "SINCLAIR", "SMOKING AIRPLANES", "OUTLAW TEES"]
OWNERS = [
    ("Granite Air Holdings", "Mara Vance"),
    ("Salt River Charter", "Dell Krantz"),
    ("Bridger Flight Group", "Ivy Sandoval"),
    ("Cache Peak Aviation", "Ron Whitlock"),
    ("Snake River Jet", "Peter Amell"),
    ("Greys River Air", "Lucy Brenner"),
    ("Cedar Ridge Aviation", "Nina Halvorsen"),
    ("Palisades Flight Services", "Owen Marsh"),
]

# Daily fuel volume targets - a peak summer month lands near 20,000 gal Jet A
# and 4,400 gal 100LL, which is the scale a single-truck mountain FBO runs at.
JETA_GAL_PER_DAY = 541.0
AVGAS_GAL_PER_DAY = 117.0

LEAK_RATE_PER_GAL = 0.01     # allowable loss as a fraction of throughput
LEAK_ALLOWANCE_GAL = 130.0   # flat allowance on top


def months_between(a, b):
    out, cur = [], a
    while cur <= b:
        out.append(cur)
        cur = date(cur.year + (cur.month == 12), (cur.month % 12) + 1, 1)
    return out


def mkey(d):
    return f"{d.year}-{d.month:02d}"


def days_in(d):
    nxt = date(d.year + (d.month == 12), (d.month % 12) + 1, 1)
    return (nxt - d).days


def label_for(m):
    y, mo = m.split("-")
    return date(int(y), int(mo), 1).strftime("%B %Y")


def jeta_cost(d):
    t = (d.year - 2025) * 12 + d.month
    base = 3.55 + 0.021 * (t - 8) + 0.30 * SEASON[d.month]
    if ANOMALIES.get(mkey(d)) == "margin_squeeze":
        base += 0.85           # supply shock
    return round(base + rng.uniform(-0.09, 0.09), 2)


def r2(x):
    return round(x, 2)


def gen_month(d):
    key, n = mkey(d), days_in(d)
    s = SEASON[d.month]
    anomaly = ANOMALIES.get(key)

    jc = jeta_cost(d)
    ac = round(jc + 1.05 + rng.uniform(-0.06, 0.06), 2)
    # Posted retail follows cost, but lags during a squeeze - margin compresses.
    jet_retail = round(jc + (1.35 if anomaly == "margin_squeeze" else 2.55) - 0.25 * (s - 1), 2)
    avgas_retail = round(ac + (0.85 if anomaly == "margin_squeeze" else 1.60), 2)

    truck_tx, landing, shop, fbo_card, hangars, timesheet = [], [], [], [], [], []
    tank = {"100LL": [], "jetA": []}
    tie_down, shop_storage, cash = [], [], []
    inv = {"100LL": 7200.0, "jetA": 8400.0}
    cum = {"100LL": 0, "jetA": 0}


    for i in range(n):
        day = d + timedelta(days=i)
        iso = day.isoformat()
        wd = day.weekday()
        busy = s * (0.55 if wd >= 5 else 1.0) * rng.uniform(0.6, 1.45)

        # --- fuel dispensed --------------------------------------------------
        jet_gal = 0.0
        for _ in range(max(0, int(round(JETA_GAL_PER_DAY * busy / 420.0 + rng.gauss(0, 0.6))))):
            g = round(rng.uniform(60, 780), 1)
            jet_gal += g
            truck_tx.append({"date": iso, "tailNumberOrNote": rng.choice(JET_TAILS),
                             "gallons": g, "truck": "Truck #3",
                             "fuelType": "Jet A", "synthetic": True})
        av_gal = 0.0
        for _ in range(max(0, int(round(AVGAS_GAL_PER_DAY * busy / 65.0 + rng.gauss(0, 0.5))))):
            g = round(rng.uniform(20, 110), 1)
            av_gal += g
            truck_tx.append({"date": iso, "tailNumberOrNote": rng.choice(PISTON_TAILS),
                             "gallons": g, "truck": "Truck #4",
                             "fuelType": "100LL", "synthetic": True})

        # --- tank reconciliation ----------------------------------------------
        for tk, pumped in (("jetA", jet_gal), ("100LL", av_gal)):
            start = inv[tk]
            delivered = 0.0
            if start - pumped < (2500 if tk == "jetA" else 1500):
                delivered = float(rng.choice([5000, 7500, 8000] if tk == "jetA" else [2000, 3000]))
            book = start + delivered - pumped
            err = rng.gauss(0, 3.5)
            if anomaly == "jet_a_leak" and tk == "jetA":
                err -= rng.uniform(14, 26)      # steady unexplained loss
            elif rng.random() < 0.03:
                err += rng.choice([-1, 1]) * rng.uniform(25, 70)
            stick = round(book + err, 0)
            over = int(round(stick - book))
            cum[tk] += over
            tank[tk].append({
                "date": iso, "startInventoryGal": round(start, 0),
                "gallonsDelivered": delivered, "gallonsPumped": round(pumped, 1),
                "bookInventoryGal": round(book, 0),
                "endStickInches": round(stick / 116.0, 2),
                "endStickGal": stick, "dailyOverShortGal": over,
                "cumulativeOverShortGal": cum[tk],
                "initials": rng.choice(CREW)[:2].upper(), "synthetic": True,
            })
            inv[tk] = stick

        # --- landing / ramp fees: FBO keeps 80%, airport authority gets 20% ---
        for _ in range(int(rng.uniform(0, 3) * busy)):
            lf = float(rng.choice([50, 75, 125, 150]))
            on = float(rng.choice([0, 0, 30, 60]))
            total = lf + on
            tax = r2(total * 0.05)
            ccf = r2(total * 0.035)
            net = total - tax - ccf
            landing.append({
                "date": iso, "tailNumber": rng.choice(JET_TAILS),
                "landingFee": lf, "overnightFee": on, "tieDownFee": 0.0,
                "total": total, "salesTax": tax, "ccFees": ccf,
                "fboShare": r2(net * 0.8), "airportShare": r2(net * 0.2),
                "note": None, "synthetic": True,
            })

        # --- shop + FBO card spend --------------------------------------------
        for _ in range(int(rng.uniform(0, 3))):
            shop.append({"date": iso, "vendor": rng.choice(VENDORS),
                         "amount": r2(rng.uniform(12, 520)),
                         "referenceOrStock": rng.choice(["SHOP", "STOCK", str(rng.randint(26000, 26150))]),
                         "tailNumberOrShop": rng.choice(["SHOP"] + BASED_TAILS),
                         "synthetic": True})
        if anomaly == "shop_overhaul" and i in (7, 8, 14):
            shop.append({"date": iso, "vendor": "AIRCRAFT SPRUCE",
                         "amount": r2(rng.uniform(2400, 4200)),
                         "referenceOrStock": "OVERHAUL",
                         "tailNumberOrShop": OVERHAUL_TAIL, "synthetic": True})
        if rng.random() < 0.12:
            fbo_card.append({"date": iso, "business": "Sinclair",
                             "amount": r2(rng.uniform(80, 190)),
                             "description": "Fuel for Jet A truck", "synthetic": True})

        # --- timesheet ----------------------------------------------------------
        hours = {c: (0.0 if wd >= 5 and rng.random() < 0.6
                     else round(rng.choice([0, 4, 5, 6.5, 8, 8, 8.5, 9]) * (0.7 + 0.5 * s), 1))
                 for c in CREW}
        timesheet.append({"date": iso, "day": day.strftime("%a").upper(),
                          "hours": hours, "onCall": rng.choice(CREW), "synthetic": True})

        # --- aircraft on the field ----------------------------------------------
        tie_down.append({"date": iso,
                         "tailNumbers": BASED_TAILS[: 2 + (1 if s > 1.0 else 0)],
                         "synthetic": True})
        shop_storage.append({"date": iso,
                             "tailNumbers": ([rng.choice(PISTON_TAILS)] if rng.random() < 0.25 else []),
                             "synthetic": True})

        # --- cash box ------------------------------------------------------------
        if rng.random() < 0.18:
            amt = r2(rng.uniform(-40, 220))
            CASH["balance"] = r2(CASH["balance"] + amt)
            cash.append({"date": iso,
                         "transactionDetails": rng.choice(
                             ["Avgas self-serve cash", "Donation jar", "Pilot supplies",
                              "Petty cash out", "Oil sale", "Ramp fee cash"]),
                         "amount": amt, "runningTotal": CASH["balance"],
                         "initials": rng.choice(CREW)[:2].upper(), "synthetic": True})

    # --- hangar settlements (transient jets, mostly summer) --------------------
    for _ in range(int(rng.uniform(0, 4) * s)):
        arr = d + timedelta(days=rng.randint(0, n - 2))
        nights = rng.randint(1, 6)
        rate = float(rng.choice([350, 400, 500, 650]))
        gross = rate * nights
        tax = r2(gross * 0.05)
        fee = r2(gross * 0.035)
        net = r2(gross - tax - fee)
        owner_share = r2(net * 0.7)          # hangar owner receives 70% of net
        hangars.append({
            "hangar": rng.choice(["E3", "E4", "H12", "H35"]),
            "aircraftType": rng.choice(["Hawker 4000", "Citation CJ3", "King Air 350", "Phenom 300"]),
            "tailNumber": rng.choice(JET_TAILS),
            "arrivalDate": arr.isoformat(),
            "departureDate": (arr + timedelta(days=nights)).isoformat(),
            "nights": float(nights), "nightlyRate": rate, "grossRent": gross,
            "salesTax5pct": tax, "avFuelProcessingFee3_5pct": fee, "netRent": net,
            "owner": {"name": "KD HANGAR, LLC", "remitTo": "PO BOX 1381, DILLON, MT 59725"},
            "ownerShareLabel": "70% DUE", "ownerShareAmount": owner_share,
            "adjustments": [], "totalDue": owner_share, "synthetic": True,
        })

    jet_pumped = round(sum(t["gallons"] for t in truck_tx if t["fuelType"] == "Jet A"), 1)
    av_pumped = round(sum(t["gallons"] for t in truck_tx if t["fuelType"] == "100LL"), 1)

    return {
        "month": key, "synthetic": True,
        "anomaly": anomaly,
        "costs": {"jetAPerGal": jc, "avgasPerGal": ac},
        "retail": {"jetAPerGal": jet_retail, "avgasPerGal": avgas_retail,
                   "jetASelfServePerGal": round(jet_retail - 0.40, 2)},
        "tank": tank, "truckTransactions": truck_tx, "landingFees": landing,
        "shopTransactions": shop, "fboCardTransactions": fbo_card,
        "hangarSettlements": hangars, "timesheet": timesheet,
        "tieDown": tie_down, "shopStorage": shop_storage, "cashBox": cash,
        "totals": {"jetAGallons": jet_pumped, "avgasGallons": av_pumped},
    }


# ---------------------------------------------------------------------------
# Build every month
# ---------------------------------------------------------------------------
all_dates = months_between(START, END)
timeline = {mkey(d): gen_month(d) for d in all_dates}


def write(name, data):
    p = OUT / f"{name}.json"
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {p.name}")


SYNTH_NOTE = ("Generated demo data - every record is fabricated. No real "
              "customer, aircraft, or financial record appears here.")

write("timeline", {
    "_note": SYNTH_NOTE + (
        " Data extends past today on purpose so forecasts can be scored "
        "against held-out ground truth; the UI clamps display to <= today."),
    "rangeStart": mkey(START), "rangeEnd": mkey(END),
    "syntheticMonths": sorted(timeline.keys()),
    "anomalies": ANOMALIES,
    "months": timeline,
})

# --- flattened per-topic files, spanning the whole range --------------------
def across(pick):
    out = []
    for k in sorted(timeline):
        out.extend(pick(timeline[k]))
    return out


write("fuel-tank-log", {
    "_note": SYNTH_NOTE,
    "100LL": across(lambda m: m["tank"]["100LL"]),
    "jetA": across(lambda m: m["tank"]["jetA"]),
})

write("truck-log", {
    "_note": SYNTH_NOTE,
    "truck4": {"label": "Truck #4 - 4700 3k", "capacityGal": 3000, "fuelType": "100LL",
               "entries": [t for t in across(lambda m: m["truckTransactions"]) if t["truck"] == "Truck #4"]},
    "truck3": {"label": "Truck #3 - F700 5k", "capacityGal": 5000, "fuelType": "Jet A",
               "entries": [t for t in across(lambda m: m["truckTransactions"]) if t["truck"] == "Truck #3"]},
})

write("timesheet", {"_note": SYNTH_NOTE, "employees": CREW,
                    "days": across(lambda m: m["timesheet"])})

write("landing-fees", {
    "_note": SYNTH_NOTE + (" Split 80/20 after 5% state sales tax and a 3.5% "
                           "card processing fee: the FBO keeps 80%, the "
                           "airport authority receives 20%."),
    "records": across(lambda m: m["landingFees"]),
})

write("cc-purchases", {
    "_note": SYNTH_NOTE,
    "fboCardTransactions": across(lambda m: m["fboCardTransactions"]),
    "shopTransactions": across(lambda m: m["shopTransactions"]),
})

write("tie-down", {"_note": SYNTH_NOTE + " Aircraft parked on the ramp, by date.",
                   "days": across(lambda m: m["tieDown"])})
write("shop-storage", {"_note": SYNTH_NOTE + " Aircraft in shop storage, by date.",
                       "days": across(lambda m: m["shopStorage"])})
write("cash-box", {"_note": SYNTH_NOTE, "entries": across(lambda m: m["cashBox"])})
write("hangar-settlements", {
    "_note": SYNTH_NOTE + " Transient hangar stays; the third-party hangar owner receives 70% of net rent.",
    "period": "Aug 2025 - Feb 2027",
    "settlements": across(lambda m: m["hangarSettlements"]),
})

# --- customer rate registry -------------------------------------------------
customers = []
for i, tail in enumerate(JET_TAILS + PISTON_TAILS):
    owner, attn = OWNERS[i % len(OWNERS)]
    is_jet = tail in JET_TAILS
    base = round(rng.uniform(5.60, 6.90) if is_jet else rng.uniform(5.40, 6.30), 2)
    history = []
    for j, d in enumerate(reversed(all_dates[:14])):
        history.append({"deliveryDate": d.isoformat(),
                        "rate": round(base - 0.02 * j + rng.uniform(-0.05, 0.05), 2)})
    customers.append({
        "hangarOrLocation": rng.choice(["H4", "H35", "E3", "Airpark", "Transient"]),
        "tailNumber": tail,
        "aircraftType": rng.choice(["C525B", "King Air 200", "TBM-960", "172", "180", "Citabria", "HA4T"]),
        "owner": owner, "attention": attn,
        "paymentMethod": rng.choice(["Invoice", "CC"]),
        "currentRate": base,
        "fuelType": "Jet A" if is_jet else "100LL",
        "rateHistory": history, "synthetic": True,
    })
write("customer-rates", {"_note": SYNTH_NOTE, "customers": customers})

# --- month-end close per month ----------------------------------------------
def tank_close(rows):
    pumped = round(sum(r["gallonsPumped"] or 0 for r in rows), 1)
    over = rows[-1]["cumulativeOverShortGal"] if rows else 0
    threshold = r2(pumped * LEAK_RATE_PER_GAL + LEAK_ALLOWANCE_GAL)
    exceeded = abs(over) > threshold
    flags = []
    if exceeded:
        flags.append(
            f"Cumulative over/short of {over:,} gal exceeds the leak-check "
            f"threshold of {threshold:,.2f} gal. That is the signal this check "
            f"exists to catch - inspect the tank, lines, and meter calibration."
        )
    return {
        "totalGallonsPumped": pumped,
        "sheetStatedGallonsPumped": pumped,
        "totalOverShortGal": over,
        "leakCheck": {
            "gallons": pumped, "ratePerGallon": LEAK_RATE_PER_GAL,
            "allowanceGal": LEAK_ALLOWANCE_GAL, "threshold": threshold,
            "equation": f"{pumped:,.0f} × {LEAK_RATE_PER_GAL} + {LEAK_ALLOWANCE_GAL:,.0f} = {threshold:,.2f} gal",
            "question": "Is total daily over/short larger than the leak-check result?",
            "sheetResult": "YES" if exceeded else "NO",
            "exceeded": exceeded,
        },
        "flags": flags,
    }


month_end = {}
for k in sorted(timeline):
    m = timeline[k]
    anomaly = m["anomaly"]
    gross = r2(sum(l["total"] or 0 for l in m["landingFees"]))
    tax = r2(sum(l["salesTax"] or 0 for l in m["landingFees"]))
    ccf = r2(sum(l["ccFees"] or 0 for l in m["landingFees"]))
    fbo = r2(sum(l["fboShare"] or 0 for l in m["landingFees"]))
    apt = r2(sum(l["airportShare"] or 0 for l in m["landingFees"]))
    shop_total = r2(sum(t["amount"] or 0 for t in m["shopTransactions"]))
    h_net = r2(sum(h["netRent"] or 0 for h in m["hangarSettlements"]))
    h_owner = r2(sum(h["ownerShareAmount"] for h in m["hangarSettlements"]))

    shop_flags = []
    if anomaly == "shop_overhaul":
        shop_flags.append(
            f"Parts spend of ${shop_total:,.2f} is well above the usual monthly "
            f"run rate - driven by a single engine overhaul on {OVERHAUL_TAIL}. Expected, "
            f"but it will distort any month-over-month comparison."
        )

    month_end[k] = {
        "label": label_for(k),
        "sourceWorkbook": "generated (synthetic demo data)",
        "fuel": {
            "100LL": tank_close(m["tank"]["100LL"]),
            "jetA": tank_close(m["tank"]["jetA"]),
        },
        "landingFees": {
            "grossTotal": gross, "salesTax": tax, "ccFees": ccf,
            "netAfterCosts": r2(gross - tax - ccf),
            "eightyPctShare": fbo, "twentyPctShare": apt,
            "equation": f"({gross:,.2f} − {tax:,.2f} tax − {ccf:,.2f} fees) × 0.20 = {apt:,.2f}",
            "amountDue": apt, "payTo": "Ridgeline Airport Authority",
            "splitDirectionUnresolved": False, "flags": [],
        },
        "shopPurchases": {
            "sheetStatedTotal": shop_total, "computedTotal": shop_total,
            "equation": f"sum of {len(m['shopTransactions'])} purchases = {shop_total:,.2f}",
            "flags": shop_flags,
        },
        "invoices": [],
        "hangar": {
            "totalNetRents": h_net, "ownerShareLabel": "70% DUE",
            "ownerShareAmount": h_owner, "adjustments": 0,
            "totalDue": h_owner,
            "equation": f"{h_net:,.2f} net rents × 0.70 = {h_owner:,.2f} due to hangar owner",
            "flags": [],
        },
        "rentalCar": {"monthTotal": 0, "flags": []},
    }

write("month-end", {"_note": SYNTH_NOTE, "months": month_end})

leaks = [k for k, v in month_end.items() if v["fuel"]["jetA"]["leakCheck"]["exceeded"]]
print(f"\n{len(timeline)} months {mkey(START)} .. {mkey(END)} - all synthetic")
print(f"injected anomalies: {ANOMALIES}")
print(f"months tripping the Jet A leak check: {leaks or 'none'}")
