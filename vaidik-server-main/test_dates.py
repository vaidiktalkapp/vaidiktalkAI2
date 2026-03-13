import swisseph as swe
import json

def get_astrology(year, month, day, hour, minute, lat, lon):
    # Calculate Julian Day
    jd = swe.julday(year, month, day, hour + minute/60.0 - 5.5) # IST to UTC
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    res, ascmc = swe.houses_ex(jd, lat, lon, b'P', swe.FLG_SIDEREAL)
    ascendant = ascmc[0]
    signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
    return signs[int(ascendant / 30)]

# Feb 7th
print(f"Feb 7: {get_astrology(1998, 2, 7, 20, 5, 28.61, 77.21)}")
# July 2nd
print(f"July 2: {get_astrology(1998, 7, 2, 20, 5, 28.61, 77.21)}")
