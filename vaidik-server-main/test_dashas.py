import swisseph as swe
import datetime
import json

ZODIAC_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
DASHA_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17]
NAK_SIZE = 360 / 27

def get_dasha(year, month, day, hour, minute):
    jd = swe.julday(year, month, day, hour + minute/60.0 - 5.5)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    res, ret = swe.calc_ut(jd, swe.MOON, swe.FLG_SIDEREAL)
    moon_lon = res[0]
    
    nak_index = int(moon_lon / NAK_SIZE)
    nak_fraction = (moon_lon % NAK_SIZE) / NAK_SIZE
    
    start_lord_index = nak_index % 9
    first_remain_days = DASHA_YEARS[start_lord_index] * 365.25 * (1 - nak_fraction)
    
    birth_dt = datetime.datetime(year, month, day, hour, minute)
    current_dt = datetime.datetime(2026, 3, 13) # Today's date in conversation
    elapsed_days = (current_dt - birth_dt).days
    
    if elapsed_days < first_remain_days:
        idx = start_lord_index
        maha_elapsed = elapsed_days / 365.25
    else:
        days_left = elapsed_days - first_remain_days
        idx = (start_lord_index + 1) % 9
        while days_left > DASHA_YEARS[idx] * 365.25:
            days_left -= DASHA_YEARS[idx] * 365.25
            idx = (idx + 1) % 9
    
    return DASHA_LORDS[idx]

print(f"Feb 7: {get_dasha(1998, 2, 7, 20, 5)}")
print(f"July 2: {get_dasha(1998, 7, 2, 20, 5)}")
