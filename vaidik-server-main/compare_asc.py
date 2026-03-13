import swisseph as swe
import datetime
import json

ZODIAC_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

def get_asc(year, month, day, hour, minute):
    jd = swe.julday(year, month, day, hour + minute/60.0 - 5.5)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    res, ascmc = swe.houses_ex(jd, 28.61, 77.21, b'P', swe.FLG_SIDEREAL)
    lon = ascmc[0]
    return ZODIAC_SIGNS[int(lon / 30) % 12], lon

print(f"Feb 7: {get_asc(1998, 2, 7, 20, 5)}")
print(f"July 2: {get_asc(1998, 7, 2, 20, 5)}")
