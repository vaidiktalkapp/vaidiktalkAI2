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
            return {"status": "error", "message": "Swiss Ephemeris library (pyswisseph) is not installed. Precise calculations are unavailable."}

        year, month, day = map(int, date_str.split('-'))
        hour, minute = map(int, time_str.split(':'))
        dt = datetime.datetime(year, month, day, hour, minute)
        utc_dt = dt - datetime.timedelta(hours=tzone)
        jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, utc_dt.hour + utc_dt.minute/60.0)
        swe.set_sid_mode(swe.SIDM_LAHIRI)

        res = swe.houses(jd, lat, lon, b'P')
        cusps = res[0]
        ascmc = res[1]
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
            return {"status": "error", "message": "Could not calculate charts for matchmaking"}

        boy_moon = boy_kundli['data']['planets']['Moon']['longitude']
        girl_moon = girl_kundli['data']['planets']['Moon']['longitude']

        # Improved Guna Milan (Simplified Ashta-koota)
        # 1. Varna (1 Point)
        def get_varna(lon):
            sign_idx = int(lon / 30)
            if sign_idx in [3, 7, 11]: return 4 # Brahmin
            if sign_idx in [0, 4, 8]: return 3  # Kshatriya
            if sign_idx in [1, 5, 9]: return 2  # Vaishya
            return 1 # Shudra
        
        varna_score = 1 if get_varna(boy_moon) >= get_varna(girl_moon) else 0

        # 2. Bhakut (7 Points)
        boy_sign = int(boy_moon / 30) + 1
        girl_sign = int(girl_moon / 30) + 1
        dist = (girl_sign - boy_sign + 12) % 12 + 1
        bhakut_score = 7 if dist in [1, 7, 3, 4, 10, 11] else 0 # Simplified Bhakut

        # 3. Yoni Harmony placeholder (4 Points)
        harmony_base = abs(boy_moon % 30 - girl_moon % 30)
        yoni_score = round(max(0, 4 - (harmony_base / 7.5)), 1)

        # Total Score calculation (Simplified but based on moon positions)
        sign_diff = abs(boy_sign - girl_sign)
        base_score = 12
        if sign_diff in [0, 4, 8]: base_score += 12 # Trine/Same
        if sign_diff in [3, 4, 9, 10]: base_score += 8 # Good relative positions
        
        score = min(36, max(12, base_score + varna_score + bhakut_score + yoni_score))
        
        verdict = "Excellent" if score > 28 else "Good" if score > 20 else "Average" if score > 15 else "Poor"
        
        return {
            "status": "success",
            "data": {
                "score": round(score, 1),
                "total": 36,
                "verdict": verdict,
                "details": {
                    "boy_moon_sign": boy_kundli['data']['planets']['Moon']['sign'],
                    "girl_moon_sign": girl_kundli['data']['planets']['Moon']['sign'],
                    "varna_match": varna_score
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
            return {"status": "error", "message": "Precise Dasha calculation requires Swiss Ephemeris"}
        
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
            return {"status": "error", "message": "Panchang requires Swiss Ephemeris for precise calculations"}

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

        # Yoga Calculation: (Sun + Moon) / (360/27)
        yoga_names = ["Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"]
        yoga_num = int(((sun_lon + moon_lon) % 360) / (360/27)) + 1
        yoga = yoga_names[(yoga_num - 1) % 27]

        # Karana Calculation: Tithi is diff/12. Karana is half of a Tithi (6 degrees).
        karana_num = int(diff / 6) + 1
        karana_names = ["Kintughna", "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti", "Shakuni", "Chatushpada", "Naga"]
        # There are 11 karanas. First one is special.
        if tithi_num == 1: karana = "Kintughna"
        elif tithi_num == 60: karana = "Naga"
        else: karana = karana_names[(karana_num % 7) + 1] # Simplified recurring

        return {
            "status": "success",
            "data": {
                "tithi": tithi,
                "nakshatra": nakshatra,
                "yoga": yoga,
                "karana": karana,
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
