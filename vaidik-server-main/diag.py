import swisseph as swe
import json
import datetime
import sys

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

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

def _to_jd(date_str, time_str, tzone):
    year, month, day = map(int, date_str.split("-"))
    hour, minute     = map(int, time_str.split(":"))
    dt     = datetime.datetime(year, month, day, hour, minute)
    utc_dt = dt - datetime.timedelta(hours=tzone)
    return swe.julday(utc_dt.year, utc_dt.month, utc_dt.day,
                      utc_dt.hour + utc_dt.minute / 60.0)

def test():
    data = {"date": "1998-02-07", "time": "20:05", "lat": 28.6139, "lon": 77.2090, "tzone": 5.5}
    try:
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        jd = _to_jd(data["date"], data["time"], data["tzone"])
        print(f"JD: {jd}")
        
        # Test Houses
        res = swe.houses(jd, data["lat"], data["lon"], b"P")
        cusps = res[0]
        print(f"Cusps: {len(cusps)}")
        
        # Test Planets
        for name, id_attr in PLANET_IDS.items():
            planet_id = getattr(swe, id_attr)
            print(f"Calculating {name} ({planet_id})...")
            pos = swe.calc_ut(jd, planet_id, swe.FLG_SWIEPH | swe.FLG_SIDEREAL)
            print(f"{name} Result: {pos}")
            
    except Exception as e:
        print(f"CRASH: {e}")

test()
