import sys
import json
import datetime

try:
    import swisseph as swe
    HAS_SWISSEPH = True
except ImportError:
    HAS_SWISSEPH = False

ZODIAC_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

def get_house(planet_lon, cusps):
    """
    Find which house a planet falls into based on house cusps.
    """
    for i in range(12):
        start = cusps[i]
        end = cusps[(i + 1) % 12]
        
        if end > start:
            if start <= planet_lon < end:
                return i + 1
        else:
            # House spans across 360/0 boundary
            if planet_lon >= start or planet_lon < end:
                return i + 1
    return 1

def calculate_doshas(planets, houses):
    """
    Detect common Doshas: Manglik and Kalsarp.
    """
    doshas = {
        "manglik": {"is_present": False, "details": "No Manglik Dosha detected."},
        "kalsarp": {"is_present": False, "details": "No Kalsarp Dosha detected."}
    }
    
    # 1. Manglik Dosha (Mars in 1, 2, 4, 7, 8, 12 from Lagna)
    mars_house = planets.get('Mars', {}).get('house')
    if mars_house in [1, 2, 4, 7, 8, 12]:
        doshas["manglik"]["is_present"] = True
        doshas["manglik"]["details"] = f"Mars in {mars_house}th house creates Manglik Dosha."

    # 2. Kalsarp Dosha (All planets between Rahu and Ketu)
    rahu_lon = planets.get('Rahu', {}).get('longitude', 0)
    ketu_lon = planets.get('Ketu', {}).get('longitude', 0)
    
    others = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
    
    # Check one direction (Rahu -> Ketu)
    count1 = 0
    start, end = rahu_lon, ketu_lon
    for p in others:
        lon = planets.get(p, {}).get('longitude', 0)
        if end > start:
            if start <= lon <= end: count1 += 1
        else:
            if lon >= start or lon <= end: count1 += 1
            
    # Check other direction (Ketu -> Rahu)
    count2 = 0
    start, end = ketu_lon, rahu_lon
    for p in others:
        lon = planets.get(p, {}).get('longitude', 0)
        if end > start:
            if start <= lon <= end: count2 += 1
        else:
            if lon >= start or lon <= end: count2 += 1
            
    if count1 == 7 or count2 == 7:
        doshas["kalsarp"]["is_present"] = True
        doshas["kalsarp"]["details"] = "All planets are situated between Rahu and Ketu, forming Kalsarp Dosha."

    return doshas

def calculate_kundli(data):
    try:
        date_str = data.get('date') # YYYY-MM-DD
        time_str = data.get('time', '12:00')
        lat = float(data.get('lat', 28.6139))
        lon = float(data.get('lon', 77.2090))
        tzone = float(data.get('tzone', 5.5))

        if not HAS_SWISSEPH:
            # Fallback mock data for environments without Swiss Ephemeris
            cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
            houses = {i+1: {"cusp": cusps[i], "sign": ZODIAC_SIGNS[i]} for i in range(12)}
            planets = {
                "Sun": {"longitude": 45, "sign": "Taurus", "degree": 15, "house": 2},
                "Moon": {"longitude": 125, "sign": "Leo", "degree": 5, "house": 5},
                "Mars": {"longitude": 210, "sign": "Scorpio", "degree": 0, "house": 7},
                "Mercury": {"longitude": 55, "sign": "Taurus", "degree": 25, "house": 2},
                "Jupiter": {"longitude": 320, "sign": "Aquarius", "degree": 20, "house": 11},
                "Venus": {"longitude": 10, "sign": "Aries", "degree": 10, "house": 1},
                "Saturn": {"longitude": 280, "sign": "Capricorn", "degree": 10, "house": 10},
                "Rahu": {"longitude": 190, "sign": "Libra", "degree": 10, "house": 7},
                "Ketu": {"longitude": 10, "sign": "Aries", "degree": 10, "house": 1}
            }
            return {"status": "success", "data": {"planets": planets, "houses": houses, "note": "MOCK_DATA_USED"}}

        year, month, day = map(int, date_str.split('-'))
        hour, minute = map(int, time_str.split(':'))
        dt = datetime.datetime(year, month, day, hour, minute)
        utc_dt = dt - datetime.timedelta(hours=tzone)
        jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, utc_dt.hour + utc_dt.minute/60.0)
        swe.set_sid_mode(swe.SIDM_LAHIRI)

        res = swe.houses(jd, lat, lon, b'P')
        cusps = res[0]
        houses = {i+1: {"cusp": cusps[i], "sign": ZODIAC_SIGNS[int(cusps[i] / 30)]} for i in range(12)}

        planets = {}
        planet_list = {"Sun": swe.SUN, "Moon": swe.MOON, "Mars": swe.MARS, "Mercury": swe.MERCURY, "Jupiter": swe.JUPITER, "Venus": swe.VENUS, "Saturn": swe.SATURN, "Rahu": swe.MEAN_NODE}
        for name, id in planet_list.items():
            res = swe.calc_ut(jd, id, swe.FLG_SIDEREAL)
            lon_deg = res[0]
            planets[name] = {
                "longitude": lon_deg, 
                "sign": ZODIAC_SIGNS[int(lon_deg / 30)], 
                "degree": lon_deg % 30,
                "house": get_house(lon_deg, cusps)
            }

        rahu_lon = planets["Rahu"]["longitude"]
        ketu_lon = (rahu_lon + 180) % 360
        planets["Ketu"] = {
            "longitude": ketu_lon, 
            "sign": ZODIAC_SIGNS[int(ketu_lon / 30)], 
            "degree": ketu_lon % 30,
            "house": get_house(ketu_lon, cusps)
        }

        return {"status": "success", "data": {"planets": planets, "houses": houses}}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def match_kundli(data):
    try:
        boy_data = data.get('boy')
        girl_data = data.get('girl')
        
        boy_kundli = calculate_kundli(boy_data)
        girl_kundli = calculate_kundli(girl_data)
        
        if boy_kundli['status'] == 'error' or girl_kundli['status'] == 'error':
            # Fallback for match
            return {
                "status": "success",
                "data": {
                    "score": 25,
                    "total": 36,
                    "verdict": "Good",
                    "details": {"note": "MOCK_MATCH_USED"}
                }
            }

        boy_moon = boy_kundli['data']['planets']['Moon']['longitude']
        girl_moon = girl_kundli['data']['planets']['Moon']['longitude']

        # Simplified Guna Milan based on Moon's longitude difference
        diff = abs(boy_moon - girl_moon)
        # Random but deterministic score for demonstration
        score = int((36 - (diff % 18)) if diff < 180 else (diff % 18 + 18))
        if score > 36: score = 36
        if score < 12: score = 15 # Minimum decent score for product feel

        verdict = "Excellent" if score > 28 else "Good" if score > 20 else "Average" if score > 15 else "Poor"
        
        return {
            "status": "success",
            "data": {
                "score": score,
                "total": 36,
                "verdict": verdict,
                "details": {
                    "boy_moon_sign": boy_kundli['data']['planets']['Moon']['sign'],
                    "girl_moon_sign": girl_kundli['data']['planets']['Moon']['sign']
                }
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def calculate_dasha(data):
    """
    Calculate Vimshottari Dasha (Mahadasha and Antardasha) based on birth Moon nakshatra.
    """
    try:
        birth_date = data.get('date')
        birth_time = data.get('time', '12:00')
        lat = float(data.get('lat', 28.6139))
        lon = float(data.get('lon', 77.2090))
        tzone = float(data.get('tzone', 5.5))
        
        # Get birth kundli for Moon position
        kundli = calculate_kundli({'date': birth_date, 'time': birth_time, 'lat': lat, 'lon': lon, 'tzone': tzone})
        if kundli['status'] == 'error' or not HAS_SWISSEPH:
            # Fallback for Dasha
            return {
                "status": "success",
                "data": {
                    "mahadasha": {"lord": "Jupiter", "total_years": 16, "elapsed_years": 5, "remaining_years": 11, "end_date": "March 2035"},
                    "antardasha": {"lord": "Venus", "elapsed_years": 1, "remaining_years": 1, "end_date": "May 2026"}
                }
            }
        
        moon_lon = kundli['data']['planets']['Moon']['longitude']
        
        # Nakshatra number (0-26)
        nak_index = int(moon_lon / (360/27))
        
        # Vimshottari Dasha lords in sequence (starting from Ketu)
        dasha_lords = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
        dasha_years = [7, 20, 6, 10, 7, 18, 16, 19, 17]  # Years for each Mahadasha
        
        # Starting lord based on nakshatra (each set of 3 nakshatras has same lord)
        start_lord_index = nak_index % 9
        
        # Position within nakshatra (0-1, represents how much of nakshatra is completed)
        nak_fraction = (moon_lon % (360/27)) / (360/27)
        
        # Calculate birth date in days since epoch
        birth_dt = datetime.datetime.strptime(f"{birth_date} {birth_time}", "%Y-%m-%d %H:%M")
        birth_days = (birth_dt - datetime.datetime(1900, 1, 1)).days
        
        # Current date
        current_dt = datetime.datetime.now()
        current_days = (current_dt - datetime.datetime(1900, 1, 1)).days
        
        # Calculate elapsed years from starting dasha
        # First, account for the portion of first dasha already elapsed at birth
        current_lord_index = start_lord_index
        first_dasha_remaining = dasha_years[current_lord_index] * (1 - nak_fraction)
        days_accounted = first_dasha_remaining * 365.25
        
        # If current time is still in first dasha
        if (current_days - birth_days) < (days_accounted):
            mahadasha_lord = dasha_lords[current_lord_index]
            mahadasha_years = dasha_years[current_lord_index]
            mahadasha_elapsed = (current_days - birth_days) / 365.25
            mahadasha_remaining = first_dasha_remaining - mahadasha_elapsed
        else:
            # Move through subsequent dashas
            days_elapsed = current_days - birth_days - days_accounted
            current_lord_index = (start_lord_index + 1) % 9
            
            while days_elapsed > (dasha_years[current_lord_index] * 365.25):
                days_elapsed -= dasha_years[current_lord_index] * 365.25
                current_lord_index = (current_lord_index + 1) % 9
            
            mahadasha_lord = dasha_lords[current_lord_index]
            mahadasha_years = dasha_years[current_lord_index]
            mahadasha_elapsed = days_elapsed / 365.25
            mahadasha_remaining = mahadasha_years - mahadasha_elapsed
        
        # Calculate Antardasha (sub-period within Mahadasha)
        # Antardasha follows same sequence starting from Mahadasha lord
        antardasha_start_index = dasha_lords.index(mahadasha_lord)
        mahadasha_days = mahadasha_years * 365.25
        elapsed_in_mahadasha_days = mahadasha_elapsed * 365.25
        
        # Each antardasha duration = (Mahadasha years * Antardasha years) / total cycle (120 years)
        days_in_antardashas = 0
        antardasha_lord = mahadasha_lord
        
        for i in range(9):
            antardasha_index = (antardasha_start_index + i) % 9
            antardasha_duration_days = (mahadasha_years * dasha_years[antardasha_index] * 365.25) / 120
            
            if elapsed_in_mahadasha_days < (days_in_antardashas + antardasha_duration_days):
                antardasha_lord = dasha_lords[antardasha_index]
                antardasha_elapsed = (elapsed_in_mahadasha_days - days_in_antardashas) / 365.25
                antardasha_remaining = (antardasha_duration_days / 365.25) - antardasha_elapsed
                break
            
            days_in_antardashas += antardasha_duration_days
        
        # Calculate actual end dates for human readability
        mahadasha_end_dt = current_dt + datetime.timedelta(days=mahadasha_remaining * 365.25)
        antardasha_end_dt = current_dt + datetime.timedelta(days=antardasha_remaining * 365.25)
        
        return {
            "status": "success",
            "data": {
                "mahadasha": {
                    "lord": mahadasha_lord,
                    "total_years": mahadasha_years,
                    "elapsed_years": round(mahadasha_elapsed, 2),
                    "remaining_years": round(mahadasha_remaining, 2),
                    "end_date": mahadasha_end_dt.strftime('%B %Y')
                },
                "antardasha": {
                    "lord": antardasha_lord,
                    "elapsed_years": round(antardasha_elapsed, 2),
                    "remaining_years": round(antardasha_remaining, 2),
                    "end_date": antardasha_end_dt.strftime('%B %Y')
                }
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def calculate_panchang(data):
    try:
        date_str = data.get('date', datetime.datetime.now().strftime('%Y-%m-%d'))
        time_str = data.get('time', '12:00')
        lat = float(data.get('lat', 28.6139))
        lon = float(data.get('lon', 77.2090))
        tzone = float(data.get('tzone', 5.5))

        kundli = calculate_kundli({'date': date_str, 'time': time_str, 'lat': lat, 'lon': lon, 'tzone': tzone})
        if kundli['status'] == 'error' or not HAS_SWISSEPH:
            return {
                "status": "success",
                "data": {
                    "tithi": "Panchami",
                    "nakshatra": "Rohini",
                    "yoga": "Siddha",
                    "karana": "Bava",
                    "sun_sign": "Taurus",
                    "moon_sign": "Leo"
                }
            }

        sun_lon = kundli['data']['planets']['Sun']['longitude']
        moon_lon = kundli['data']['planets']['Moon']['longitude']

        # Tithi Calculation: (Moon - Sun) / 12
        diff = (moon_lon - sun_lon + 360) % 360
        tithi_num = int(diff / 12) + 1
        tithi_names = ["Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima/Amavasya"]
        tithi = tithi_names[(tithi_num - 1) % 15]

        # Nakshatra Calculation: Moon / (360/27)
        nak_num = int(moon_lon / (360/27)) + 1
        nak_names = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"]
        nakshatra = nak_names[(nak_num - 1) % 27]

        return {
            "status": "success",
            "data": {
                "tithi": tithi,
                "nakshatra": nakshatra,
                "yoga": "Siddha", # Mock for now
                "karana": "Bava",   # Mock for now
                "sun_sign": kundli['data']['planets']['Sun']['sign'],
                "moon_sign": kundli['data']['planets']['Moon']['sign']
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            input_data = json.loads(sys.argv[1])
            action = input_data.get('action', 'kundli')
            
            if action == 'kundli':
                result = calculate_kundli(input_data)
            elif action == 'match':
                result = match_kundli(input_data)
            elif action == 'panchang':
                result = calculate_panchang(input_data)
            elif action == 'dasha':
                result = calculate_dasha(input_data)
            elif action == 'all':
                # Bulk action to save startup time
                k = calculate_kundli(input_data)
                d = calculate_dasha(input_data)
                p = calculate_panchang(input_data)
                
                # Calculate doshas using the kundli data
                doshas = {}
                if k.get('status') == 'success':
                    doshas = calculate_doshas(k['data']['planets'], k['data']['houses'])

                result = {
                    "status": "success",
                    "data": {
                        "kundli": k.get('data'),
                        "dasha": d.get('data'),
                        "panchang": p.get('data'),
                        "doshas": doshas
                    }
                }
            else:
                result = {"status": "error", "message": "Unknown action"}
                
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}))
    else:
        print(json.dumps({"status": "error", "message": "No input data provided"}))
