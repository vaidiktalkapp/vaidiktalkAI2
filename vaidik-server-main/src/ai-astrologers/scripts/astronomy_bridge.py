import sys
import json
import datetime

try:
    import swisseph as swe
    HAS_SWISSEPH = True
except ImportError:
    HAS_SWISSEPH = False

# ─── Constants ────────────────────────────────────────────────────────────────

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
    "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
    "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

TITHI_NAMES = [
    "Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
    "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
    "Trayodashi", "Chaturdashi", "Purnima/Amavasya"
]

YOGA_NAMES = [
    "Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
    "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
    "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva",
    "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
]

KARANA_NAMES = [
    "Kintughna", "Bava", "Balava", "Kaulava", "Taitila", "Gara",
    "Vanija", "Vishti", "Shakuni", "Chatushpada", "Naga"
]

DASHA_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17]

PLANET_IDS = {
    "Sun":     "SUN",
    "Moon":    "MOON",
    "Mars":    "MARS",
    "Mercury": "MERCURY",
    "Jupiter": "JUPITER",
    "Venus":   "VENUS",
    "Saturn":  "SATURN",
    "Rahu":    "MEAN_NODE"
}

NAK_SIZE = 360 / 27

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _require_swisseph():
    if not HAS_SWISSEPH:
        return {"status": "error", "message": "pyswisseph not installed. Run: pip install pyswisseph"}
    return None


def _parse_datetime(date_str, time_str):
    """Parse date/time strings into a datetime object, auto-detecting format."""
    if not date_str:
        raise ValueError("Missing birth date (date_str is None or empty)")
    if not time_str:
        time_str = "12:00"

    # Standardize separator
    date_str = date_str.replace("/", "-").replace(".", "-")
    parts = list(map(int, date_str.split("-")))
    
    if parts[0] > 31: # Looks like YYYY-MM-DD
        year, month, day = parts
    else: # Looks like DD-MM-YYYY
        day, month, year = parts

    # Handle time
    if ":" in time_str:
        h, m = map(int, time_str.split(":"))
    else:
        h, m = 12, 0

    return datetime.datetime(year, month, day, h, m)


def _to_jd(date_str, time_str, tzone):
    """Convert local date/time + timezone to Julian Day (UT)."""
    dt = _parse_datetime(date_str, time_str)
    utc_dt = dt - datetime.timedelta(hours=tzone)
    return swe.julday(utc_dt.year, utc_dt.month, utc_dt.day,
                      utc_dt.hour + utc_dt.minute / 60.0)


def get_house(planet_lon, cusps):
    """Return 1-based house number for a given ecliptic longitude."""
    for i in range(12):
        start = cusps[i]
        end   = cusps[(i + 1) % 12]
        if end > start:
            if start <= planet_lon < end:
                return i + 1
        else:
            if planet_lon >= start or planet_lon < end:
                return i + 1
    return 1


def _planet_entry(lon_deg, cusps):
    """Build a standard planet dict from an ecliptic longitude."""
    # Safety: ensure lon_deg is a float (calc_ut returns a tuple)
    if isinstance(lon_deg, (tuple, list)):
        lon_deg = lon_deg[0]
        
    lon_deg = lon_deg % 360
    return {
        "longitude": round(lon_deg, 4),
        "sign":      ZODIAC_SIGNS[int(lon_deg / 30) % 12],
        "degree":    round(lon_deg % 30, 4),
        "nakshatra": NAKSHATRAS[int(lon_deg / NAK_SIZE) % 27],
        "house":     get_house(lon_deg, cusps)
    }

# ─── Kundli ───────────────────────────────────────────────────────────────────

def calculate_kundli(data):
    """
    Calculate full sidereal (Lahiri) birth chart.
    Includes all planets + Rahu/Ketu (both with nakshatra), houses, aspects.
    """
    err = _require_swisseph()
    if err:
        return err

    try:
        date_str = data.get("date")
        time_str = data.get("time", "12:00")
        lat      = float(data.get("lat",   28.6139))
        lon      = float(data.get("lon",   77.2090))
        tzone    = float(data.get("tzone", 5.5))

        swe.set_sid_mode(swe.SIDM_LAHIRI)
        jd    = _to_jd(date_str, time_str, tzone)
        cusps = swe.houses(jd, lat, lon, b"P")[0]

        houses = {
            i + 1: {
                "cusp": round(cusps[i], 4),
                "sign": ZODIAC_SIGNS[int(cusps[i] / 30)]
            }
            for i in range(12)
        }

        planets = {}
        for name, id_attr in PLANET_IDS.items():
            pos = swe.calc_ut(jd, getattr(swe, id_attr), swe.FLG_SWIEPH | swe.FLG_SIDEREAL)
            planets[name] = _planet_entry(pos[0], cusps)

        # Ketu — opposite Rahu, nakshatra included
        ketu_lon = (planets["Rahu"]["longitude"] + 180) % 360
        planets["Ketu"] = _planet_entry(ketu_lon, cusps)

        return {
            "status": "success",
            "data": {
                "planets": planets,
                "houses":  houses,
                "aspects": calculate_aspects(planets)
            }
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# ─── Aspects ──────────────────────────────────────────────────────────────────

def calculate_aspects(planets):
    """
    Major aspects with 5° orb: opposition (180°), trine (120°), square (90°).
    Each pair reported once only.
    """
    aspects = []
    names = list(planets.keys())
    for i, p1 in enumerate(names):
        for p2 in names[i + 1:]:
            diff = abs(planets[p1]["longitude"] - planets[p2]["longitude"])
            if diff > 180:
                diff = 360 - diff
            if   abs(diff - 180) < 5: aspects.append(f"{p1} opposes {p2}")
            elif abs(diff - 120) < 5: aspects.append(f"{p1} trine {p2}")
            elif abs(diff -  90) < 5: aspects.append(f"{p1} square {p2}")
    return aspects

# ─── Doshas ───────────────────────────────────────────────────────────────────

def calculate_doshas(planets, houses):
    """
    Detect Manglik and Kalsarp doshas.
    Kalsarp checks both arc directions (corrects Script 1 bug).
    """
    doshas = {
        "manglik": {"is_present": False, "details": "No Manglik Dosha detected."},
        "kalsarp": {"is_present": False, "details": "No Kalsarp Dosha detected."}
    }

    # Manglik: Mars in 1, 2, 4, 7, 8, 12
    mars_house = planets.get("Mars", {}).get("house")
    if mars_house in [1, 2, 4, 7, 8, 12]:
        doshas["manglik"]["is_present"] = True
        doshas["manglik"]["details"] = f"Mars in house {mars_house} creates Manglik Dosha."

    # Kalsarp: all 7 planets between Rahu and Ketu (both directions)
    rahu_lon = planets.get("Rahu", {}).get("longitude", 0)
    ketu_lon = planets.get("Ketu", {}).get("longitude", 0)
    others   = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]

    def count_between(start, end):
        n = 0
        for p in others:
            lon = planets.get(p, {}).get("longitude", 0)
            if end > start:
                if start <= lon <= end: n += 1
            else:
                if lon >= start or lon <= end: n += 1
        return n

    if count_between(rahu_lon, ketu_lon) == 7 or count_between(ketu_lon, rahu_lon) == 7:
        doshas["kalsarp"]["is_present"] = True
        doshas["kalsarp"]["details"] = (
            "All planets are between Rahu and Ketu — Kalsarp Dosha present."
        )

    return doshas

# ─── Panchang ─────────────────────────────────────────────────────────────────

def calculate_panchang(data):
    """
    Full 5-element Panchang:
    Tithi, Nakshatra, Yoga, Karana, Sun sign, Moon sign.
    """
    err = _require_swisseph()
    if err:
        return err

    try:
        kundli = calculate_kundli(data)
        if kundli["status"] == "error":
            return kundli

        sun_lon  = kundli["data"]["planets"]["Sun"]["longitude"]
        moon_lon = kundli["data"]["planets"]["Moon"]["longitude"]
        diff     = (moon_lon - sun_lon + 360) % 360

        tithi_num = int(diff / 12) + 1
        tithi     = TITHI_NAMES[(tithi_num - 1) % 15]

        nakshatra = NAKSHATRAS[int(moon_lon / NAK_SIZE) % 27]

        yoga_num  = int(((sun_lon + moon_lon) % 360) / NAK_SIZE)
        yoga      = YOGA_NAMES[yoga_num % 27]

        karana_num = int(diff / 6) + 1
        if tithi_num == 1:
            karana = "Kintughna"
        elif tithi_num == 60:
            karana = "Naga"
        else:
            karana = KARANA_NAMES[(karana_num % 7) + 1]

        return {
            "status": "success",
            "data": {
                "tithi":     tithi,
                "nakshatra": nakshatra,
                "yoga":      yoga,
                "karana":    karana,
                "sun_sign":  kundli["data"]["planets"]["Sun"]["sign"],
                "moon_sign": kundli["data"]["planets"]["Moon"]["sign"]
            }
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# ─── Vimshottari Dasha ────────────────────────────────────────────────────────

def calculate_dasha(data):
    """
    Current Vimshottari Mahadasha and Antardasha
    calculated from birth Moon nakshatra.
    """
    err = _require_swisseph()
    if err:
        return err

    try:
        kundli = calculate_kundli(data)
        if kundli["status"] == "error":
            return kundli

        moon_lon     = kundli["data"]["planets"]["Moon"]["longitude"]
        nak_index    = int(moon_lon / NAK_SIZE)
        nak_fraction = (moon_lon % NAK_SIZE) / NAK_SIZE

        start_lord_index     = nak_index % 9
        first_remain_days    = DASHA_YEARS[start_lord_index] * 365.25 * (1 - nak_fraction)

        birth_dt     = _parse_datetime(data['date'], data.get('time', '12:00'))
        current_dt   = datetime.datetime.now()
        elapsed_days = (current_dt - birth_dt).days

        if elapsed_days < first_remain_days:
            idx            = start_lord_index
            maha_elapsed   = elapsed_days / 365.25
            maha_remaining = first_remain_days / 365.25 - maha_elapsed
        else:
            days_left = elapsed_days - first_remain_days
            idx       = (start_lord_index + 1) % 9
            while days_left > DASHA_YEARS[idx] * 365.25:
                days_left -= DASHA_YEARS[idx] * 365.25
                idx        = (idx + 1) % 9
            maha_elapsed   = days_left / 365.25
            maha_remaining = DASHA_YEARS[idx] - maha_elapsed

        maha_lord  = DASHA_LORDS[idx]
        maha_years = DASHA_YEARS[idx]

        # Antardasha
        antar_start          = DASHA_LORDS.index(maha_lord)
        elapsed_in_maha_days = maha_elapsed * 365.25
        days_counted         = 0
        antar_lord           = maha_lord
        antar_elapsed        = 0.0
        antar_remain         = 0.0

        for i in range(9):
            aidx     = (antar_start + i) % 9
            dur_days = (maha_years * DASHA_YEARS[aidx] * 365.25) / 120.0
            if elapsed_in_maha_days < days_counted + dur_days:
                antar_lord    = DASHA_LORDS[aidx]
                antar_elapsed = (elapsed_in_maha_days - days_counted) / 365.25
                antar_remain  = dur_days / 365.25 - antar_elapsed
                break
            days_counted += dur_days

        maha_end  = current_dt + datetime.timedelta(days=maha_remaining * 365.25)
        antar_end = current_dt + datetime.timedelta(days=antar_remain   * 365.25)

        return {
            "status": "success",
            "data": {
                "mahadasha": {
                    "lord":            maha_lord,
                    "total_years":     maha_years,
                    "elapsed_years":   round(maha_elapsed,   2),
                    "remaining_years": round(maha_remaining, 2),
                    "end_date":        maha_end.strftime("%B %Y")
                },
                "antardasha": {
                    "lord":            antar_lord,
                    "elapsed_years":   round(antar_elapsed, 2),
                    "remaining_years": round(antar_remain,  2),
                    "end_date":        antar_end.strftime("%B %Y")
                }
            }
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# ─── Kundli Matching ──────────────────────────────────────────────────────────

def match_kundli(data):
    """
    Simplified Ashta-koota Guna Milan based on Moon positions.
    Score out of 36.
    """
    err = _require_swisseph()
    if err:
        return err

    try:
        boy_kundli  = calculate_kundli(data.get("boy"))
        girl_kundli = calculate_kundli(data.get("girl"))

        if boy_kundli["status"] == "error" or girl_kundli["status"] == "error":
            return {"status": "error", "message": "Could not calculate charts for matchmaking."}

        boy_moon  = boy_kundli["data"]["planets"]["Moon"]["longitude"]
        girl_moon = girl_kundli["data"]["planets"]["Moon"]["longitude"]

        def get_varna(lon):
            s = int(lon / 30)
            if s in [3, 7, 11]: return 4  # Brahmin
            if s in [0, 4, 8]:  return 3  # Kshatriya
            if s in [1, 5, 9]:  return 2  # Vaishya
            return 1                       # Shudra

        varna_score  = 1 if get_varna(boy_moon) >= get_varna(girl_moon) else 0

        boy_sign  = int(boy_moon  / 30) + 1
        girl_sign = int(girl_moon / 30) + 1
        dist      = (girl_sign - boy_sign + 12) % 12 + 1
        bhakut_score = 7 if dist in [1, 7, 3, 4, 10, 11] else 0

        harmony_base = abs(boy_moon % 30 - girl_moon % 30)
        yoni_score   = round(max(0, 4 - (harmony_base / 7.5)), 1)

        sign_diff  = abs(boy_sign - girl_sign)
        base_score = 12
        if sign_diff in [0, 4, 8]:     base_score += 12
        if sign_diff in [3, 4, 9, 10]: base_score += 8

        score   = min(36, max(12, base_score + varna_score + bhakut_score + yoni_score))
        verdict = (
            "Excellent" if score > 28 else
            "Good"      if score > 20 else
            "Average"   if score > 15 else
            "Poor"
        )

        return {
            "status": "success",
            "data": {
                "score":   round(score, 1),
                "total":   36,
                "verdict": verdict,
                "details": {
                    "boy_moon_sign":  boy_kundli["data"]["planets"]["Moon"]["sign"],
                    "girl_moon_sign": girl_kundli["data"]["planets"]["Moon"]["sign"],
                    "varna_score":    varna_score,
                    "bhakut_score":   bhakut_score,
                    "yoni_score":     yoni_score
                }
            }
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "status":  "error",
            "message": "No input provided. Pass JSON as the first argument.",
            "actions": ["kundli", "panchang", "dasha", "match", "all"]
        }))
        sys.exit(1)

    try:
        input_data = json.loads(sys.argv[1])
        action     = input_data.get("action", "kundli")

        if action == "kundli":
            result = calculate_kundli(input_data)

        elif action == "panchang":
            result = calculate_panchang(input_data)

        elif action == "dasha":
            result = calculate_dasha(input_data)

        elif action == "match":
            result = match_kundli(input_data)

        elif action == "all":
            k = calculate_kundli(input_data)
            d = calculate_dasha(input_data)
            p = calculate_panchang(input_data)
            
            # Propagate first error found
            for res in [k, d, p]:
                if res.get("status") == "error":
                    result = res
                    break
            else:
                doshas = calculate_doshas(k["data"]["planets"], k["data"]["houses"])
                result = {
                    "status": "success",
                    "data": {
                        "kundli":   k.get("data"),
                        "dasha":    d.get("data"),
                        "panchang": p.get("data"),
                        "doshas":   doshas
                    }
                }

        else:
            result = {
                "status":  "error",
                "message": f"Unknown action '{action}'. Use: kundli | panchang | dasha | match | all"
            }

        print(json.dumps(result, indent=2, ensure_ascii=False))

    except json.JSONDecodeError as e:
        print(json.dumps({"status": "error", "message": f"Invalid JSON: {str(e)}"}))
    except Exception as e:
        import traceback
        result = {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(result, indent=2, ensure_ascii=False))