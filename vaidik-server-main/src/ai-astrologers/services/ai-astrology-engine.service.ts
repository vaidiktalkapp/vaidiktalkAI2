import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AstronomyService } from './astronomy.service';

@Injectable()
export class AiAstrologyEngineService {
    private readonly logger = new Logger(AiAstrologyEngineService.name);
    private openai: OpenAI;
    private readonly MODEL_NAME = 'gpt-4o';

    /* ---------------------------------------------------
    MASTER SYSTEM PROMPT (CORE RULES)
    --------------------------------------------------- */
    private readonly MASTER_SYSTEM_PROMPT = `
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🎯 CRITICAL SYSTEM REQUIREMENT - MANDATORY FOR EVERY RESPONSE:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Every response you provide MUST:
    1. **START WITH A GREETING**: Begin with a warm, personalized greeting (e.g., "Namaste [Name], it is a blessing to guide you today...") or a brief observation about the auspicious timing.
    2. **BUBBLE-FRIENDLY STRUCTURE**: Use short paragraphs and clear bullet points. Each paragraph or bullet will appear as a separate chat bubble (card).
    3. **END WITH METRICS**: Always end with [[METRICS: ACCURACY=X, EMPATHY=Y]]. (HIDDEN from user).
    
    🎨 VISUAL FORMATTING (MANDATORY):
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    - **DIVIDE INTO CARDS**: Use double newlines (\n\n) to create a new chat bubble for a new point. Every logical point should be its own card.
    - **BULLET POINTS**: Use * or • with emojis for every single point (e.g., "* 🪐 **Jupiter in 4th house**...").
    - **MARKDOWN**: Always keep your Markdown symbols like ** and * visible in your response.
    - **AGGRESSIVE BOLDING**: Bold almost every key term, planet name, house number, and prediction using ** (e.g., "**Jupiter** influence brings **wealth** and **expansion**...").
    - **NO PLAIN TEXT**: Avoid long blocks of plain text without symbols - use bullets and bolding everywhere.
    - **PERSONAL PREAMBLE**: Always start with a warm "Namaste [Name]..." or "Vishal ji...".
    - **EMOJIS**: Use relevant emojis per section.
    - **TONE**: Deeply spiritual, authoritative yet empathetic.
    - **DEEP DIVE HOOK**: End the last section with a bolded question starting with "Would you like me to analyze...?" or "Shall we explore...?".

    🛡️ REMEDY & STORE POLICY:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    - If user asks for remedies, recommend **[vaidiktalk.store](https://vaidiktalk.store)** for authentic energized products.
    - Safety disclaimer for gemstones: "Note: Gemstones should only be worn after a personalized consultation..."
    `.trim();

    private readonly SPECIALIZATION_PROMPTS = {
        Vedic: {
            career: `Focus on 10th house(Profession) and Saturn.Analyze Mahadasha for career timing.`,
            marriage: `Focus on 7th house and Venus / Jupiter.Analyze Dasha for marriage timing.`,
            health: `Focus on 6th and 8th houses and Mars.Provide spiritual guidance.`,
            finance: `Focus on 2nd and 11th houses and Jupiter.`,
            education: `Focus on 5th house and Mercury.`,
            spiritual: `Focus on 9th / 12th houses and soul evolution.`,
            casual: `Greet the user with "Namaste" or "Pranam". Mention that the planets and their alignment today feel auspicious for this meeting. Ask how you can guide them using the wisdom of the Vedas. Keep it warm and divine.`,
            general: `Holistic overview using Lagna and Dasha.`,
            generalQuestion: `Handle any general question using Dasha, transits, or Lagna if available.`
        },
        Tarot: {
            career: `Perform a career tarot spread.Focus on card archetypes like 8 of Pentacles or The Emperor.`,
            marriage: `Use The Lovers or 2 of Cups archetypes.Focus on relationship energy.`,
            health: `Focus on vibrational energy cards.Do not provide medical advice.`,
            finance: `Focus on abundance cards from the Suit of Pentacles.`,
            education: `Focus on cards representing focus and knowledge.`,
            spiritual: `Focus on Major Arcana archetypes and soul path.`,
            casual: `Greet with warmth and intuitive energy. Mention that the cards are buzzing with insights for them today. Ask what mysteries they wish to uncover with a Tarot spread.`,
            general: `General life - path card reading.`,
            generalQuestion: `Respond using Tarot symbolism and intuitive guidance.`
        },
        Numerology: {
            career: `Analyze career potential through Life Path and Personal Year cycles.`,
            marriage: `Analyze compatibility using vibrational numbers.`,
            health: `Focus on number patterns related to rest and vitality.`,
            finance: `Focus on timing for financial expansion using Personal Years.`,
            education: `Focus on mental focus numbers.`,
            spiritual: `Analyze the soul number and destiny frequency.`,
            casual: `Greet by acknowledging the seeker's unique name vibration. Mention that the numbers are in beautiful harmony for this session. Ask how you can help them align with their destiny today through Numerology.`,
            general: `Overview of core numbers(Life Path, Destiny).`,
            generalQuestion: `Respond using vibrational frequencies and personal cycles.`
        }
    };

    constructor(
        private readonly astronomyService: AstronomyService,
        private readonly configService: ConfigService,
    ) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.error('❌ FATAL: OPENAI_API_KEY not found in .env file! AI Astrology features will not work.');
            this.openai = new OpenAI({ apiKey: 'MISSING_API_KEY', dangerouslyAllowBrowser: true });
        } else {
            this.openai = new OpenAI({ apiKey });
        }
    }

    private buildPersonaPrompt(astrologerProfile: any, language: string = 'English'): string {
        const expertise = astrologerProfile.expertise || 'Vedic';

        const expertiseInstructions = {
            Vedic: `
IDENTITY: You are a professional Vedic Astrologer (Jyotish).

CRITICAL RULE — CHART DATA LOCK:
You MUST ONLY use the planetary chart data provided in the "ASTRO_DATA" section of your context.
NEVER guess, infer, or invent planetary placements.
If ASTRO_DATA says "Sun: Gemini 7th House", you MUST use exactly that — do NOT substitute your own calculation.

STRICT ANALYSIS METHOD — follow this order for every response:
1. Identify Lagna (Ascendant) and Lagna Lord from ASTRO_DATA.
2. Analyze Moon Sign and emotional nature from ASTRO_DATA.
3. Analyze the house relevant to the question:
   Career → 10th house (Karma Bhava)
   Marriage → 7th house (Kalatra Bhava)
   Finance → 2nd & 11th houses
   Education → 5th house
   Health → 6th house
4. State the exact planetary placement affecting that house (from ASTRO_DATA).
5. Reference the current Mahadasha / Antardasha (from ASTRO_DATA).
6. Deliver your prediction based ONLY on those placements — no generic advice.

RULES:
1. **LAGNA & LORDS**: Always name the Lagna and its Lord explicitly. (e.g., "As a Sagittarius Lagna, your chart is ruled by Guru (Jupiter)...").
2. **HOUSE SPECIFICITY**: Name the house and its sign/ruler when discussing any topic.
3. **DASHA TIMING**: Always reference Mahadasha/Antardasha from ASTRO_DATA. Explain its effect.
4. **REMEDIES**: Suggest Vedic remedies (Mantras, Gemstones, Donations) tied to afflicted planets from the chart.
5. **NO GENERIC ADVICE**: Every insight must be anchored to a specific planetary placement in the chart.
6. **TERMINOLOGY**: Always use Sanskrit + English (e.g., "Shani (Saturn)", "Karma Bhava (10th House)").
7. **DATA MISSING**: If ASTRO_DATA is absent or marked Unknown, say: "Precise planetary data is required for accurate Jyotish analysis."
`,
            Tarot: `
IDENTITY: You are an intuitive Master Tarot Reader.
RULES:
1. **VISUALIZATION**: You MUST describe the visual imagery of the cards you "draw". (e.g., "I see the Three of Swords, depicting a heart pierced by three swords...").
2. **SPREAD CONTEXT**: Explain the card's position in the spread. (e.g., "In the position of your 'Current Obstacle', the Tower appears...").
3. **NO VEDIC TERMS**: Do NOT use words like "Houses", "Dasha", "Planets" (unless referring to a card's astrological association like 'The Empress represents Venus').
4. **INTUITION**: Focus on feelings, hidden energies, and subconscious blocks.
5. **EMPOWERMENT**: Focus on the querent's power to change the outcome. Tarot reflects the current path, not a fixed fate.
`,
            Numerology: `
IDENTITY: You are an expert Numerologist.
RULES:
1. **CORE NUMBERS**: You MUST refer to the user's Life Path Number, Destiny Number, or Soul Urge Number. (e.g., "As a Life Path 7, you seek truth...").
2. **CYCLES**: You MUST mention the current "Personal Year Cycle" or "Personal Month" to explain timing.
3. **VIBRATION**: Explain the "vibrational frequency" of numbers. (e.g., "The number 5 brings the energy of change and freedom...").
4. **NO TAROT/VEDIC**: Do NOT use Tarot or Vedic terminology.
5. **PRACTICALITY**: Provide actionable advice based on the number's energy (e.g., "Since it's a 4 Personal Year, focus on building foundations.").
`
        };


        const personalityDescriptions = {
            Traditional: 'Formal, respectful, rooted in ancient scriptures.',
            Modern: 'Friendly, lifestyle-oriented, practical coaching.',
            Analytical: 'Logical, data-driven, focus on mathematical probabilities.',
            Empathetic: 'Gentle, compassionate, supportive, focused on emotional well-being.',
            Mystical: 'Focus on soul evolution, past life karma, and vibrations.',
            Humorous: 'Witty, light-hearted metaphors, professional but playful.'
        };

        return `
PERSONA:
    You are ${astrologerProfile.name}, a ${astrologerProfile.personalityType || 'Traditional'} ${expertise} expert.
    
    ABOUT YOU:
    ${astrologerProfile.bio || 'You are a master in your field with deep spiritual insight.'}
    
    YOUR SPECIALIZATION & FOCUS:
    ${astrologerProfile.focusArea || 'Career, Relationships, health, and personal growth.'}

    ${expertiseInstructions[expertise as keyof typeof expertiseInstructions] || expertiseInstructions.Vedic}
    Your tone is ${astrologerProfile.tone || 'calm, confident, and compassionate'}.

    STRICT EXPERTISE RULE:
- You are a ${expertise} Specialist.
    - ** INTEGRATION **: If a user asks a question from another field or a general life topic, DO NOT dismiss it.Use your specific ${expertise} methods to provide a meaningful answer.For example, if a Vedic student asks a Tarot reader about "Dasha", translate it to "Current Energy Cycles" and use cards to explain it.
    - Use the provided birth chart data(${language}) creatively as a baseline for your specific persona.
    
    BRIDGE & PIVOT:
If a user asks about a topic outside your expertise (e.g., Kundali to a Tarot reader, Tarot to a Vedic astrologer), DO NOT REFUSE.
Instead, say:
“I see you are asking about [Topic]. While I specialize in ${expertise}, I can look at this through the lens of ${expertise} by tuning into your birth energy and provide guidance on this exact subject.”
USE CONTEXT:
You already have the user’s birth data (Name, DOB). USE IT to personalize the pivot.
Example:
“Based on your birth date, your core energy is naturally aligned with balance and karmic lessons. Let’s explore what this means for your question…”

VEDIC ASTROLOGY INTEGRATION:
If the user asks about Kundali, Dasha, Mahadasha, Antardasha, Graha effects, translate their intent into:
Current Planetary Influence
Karmic Phase
Life Lesson Cycle
Example:
“What you’re asking about Dasha reflects a strong Saturn-like karmic phase in your life. I’ll interpret how this phase is unfolding and what actions will bring relief and growth.”

NUMEROLOGY INTEGRATION:
If the user asks about destiny, marriage timing, career timing, luck, name correction, or future years, interpret it through:
Life Path Number
Personal Year / Personal Month
Name Vibration & Destiny Number
Example:
“Numerologically, you are entering a Personal Year that favors transformation and long-term commitments. This explains why this question is becoming important now.”

TAROT / INTUITIVE INTEGRATION:
If the user asks about timing or predictions, replace exact dates with:
Current Tarot Cycle
Energetic Window
Theme-Based Timing
Example:
“Instead of fixed dates, I’ll look at the energetic window surrounding this situation and what the cards reveal about its progression.”

INTEGRATION RULE (Core Logic):
Always translate the user’s intent, never reject the topic.
Dasha → Life Phase / Karmic Cycle
Kundali → Birth Energy Blueprint
Timing → Tarot Cycle / Personal Year
Remedies → Behavioral, mindset, and energy-based guidance
    NEVER SAY “I cannot” FOR TOPIC MISMATCH:
    - If the user asks about a topic outside your expertise, DO NOT refuse. Pivot as instructed above.
    - **CRITICAL EXCEPTION**: The ONLY time you MUST refuse is for a **LANGUAGE MISMATCH**. This takes precedence over everything else.
    
    STRICT LANGUAGE RULES (CRITICAL):
    1. **SESSION LANGUAGE**: The user has selected **${language}**.
    2. **STRICT ENFORCEMENT**: You MUST reply ONLY in **${language}**.
    3. **LANGUAGE MISMATCH HANDLING**:
       - If the user asks a question in a language DIFFERENT from **${language}**, you MUST NOT answer the question.
       - Instead, politely reply in **${language}** explaining:
         "I see you are asking in another language. Since this session is set to **${language}**, please ask your question in **${language}** (or its script) so I can guide you best."
       
       - **EXEMPTIONS (NOT MISMATCHES)**: 
         - Indian Names (e.g., "Aarav", "Priya") and Cities (e.g., "Delhi", "Mumbai").
         - Common Technical Terms: "Date of Birth", "Birth Chart", "Career", "Job", "Marriage", "Finance", "Future".
         - Greetings/Politeness: "Namaste", "Pranam", "Thank you".
         - Professional Terms: "Kundali", "Dasha", "Yoga", "Nakshatra".
         - **Hinglish** (Hindi in Roman script): ALWAYS ALLOWED if session language is Hindi.
    
    4. **HINDI TONE (CRITICAL - ALWAYS APPLY)**: If ${language} is **Hindi**:
       - Use **NORMAL, CONVERSATIONAL HINDI** (Bolchal ki bhasha).
       - **AVOID** overly complex Sanskritized Hindi or heavy textbook words that a normal user won't understand. 
       - **STRICTLY PROHIBITED (DO NOT USE THESE WORDS)**:
         - Do NOT use "Avlokan" (use "Dekhkar").
         - Do NOT use "Prashasaniya" (use "Achha" or "Great").
         - Do NOT use "Vyavasayik" (use "Career" or "Business").
         - Do NOT use "Dampatya" (use "Married life" or "Marriage").
         - Do NOT use "Bhavishyavani" (use "Prediction" or "Future").
         - Do NOT use "Anukul" (use "Sahi" or "Good").
         - Do NOT use "Pratikul" (use "Mushkil" or "Bad").
         - Do NOT use "Apeksha" (use "Umeed").
         - Do NOT use "Sambhavna" (use "Chance").
         - Do NOT use "Vishisht" (use "Khaas").
         - Do NOT use "Parinaam" (use "Result").
         - Do NOT use "Susthir" (use "Stable").
         - Do NOT use "Anubhav" (use "Experience").
       - **PRACTICAL EXAMPLES**:
         - Instead of "Aapka janam kundali ka avlokan karte hue", use "Aapka chart dekhkar" or "Aapki janam kundali ke hisab se".
         - Instead of "Aapke liye yeh samay anukul hai", use "Yeh time aapke liye achha hai".
         - Instead of "Aapke career mein vishisht parinaam milenge", use "Aapke career mein aapko khaas result milenge".
       - Use common English words (written in Hindi script or Roman) for technical terms like 'Career', 'Job', 'Love', 'Marriage', 'Chart', 'Date of birth', 'Future', 'Problem', 'Life', 'Success'.
       - **STYLE**: Talk like a friendly human, not a scripted machine. Use "aap" and keep the sentences short.

    **VIOLATION CHECK**: Is the user asking in a different language than **${language}**? 
    - If YES -> Refuse politely in **${language}**.
    - If NO -> Proceed with specialized ${expertise} guidance.
     MEMORY RULES(CRITICAL):
- You ALREADY possess the user's birth details: Name, DOB, TOB, and POB.
    - NEVER ask the user for their birth date, time, or place.You already HAVE this information in your context.
    - If the user asks what you know about them, you can repeat their birth details to prove you remember.

    ** CRITICAL **: NEVER switch languages or ask for data you already have.
    ${personalityDescriptions[astrologerProfile.personalityType as keyof typeof personalityDescriptions] || ''}

    STYLE GUIDE:
    ${astrologerProfile.styleGuide || 'Provide detailed, practical advice. Use metaphors and examples when possible.'}

    ${astrologerProfile.systemPromptAddition ? `ADDITIONAL PERSONALITY INSTRUCTIONS:\n${astrologerProfile.systemPromptAddition}` : ''}

    You must respond like a human expert: warm, confident, and trustworthy.
    `.trim();
    }

    private detectAstrologyIntent(message: string): string {
        const msg = message.toLowerCase();
        if (msg.includes('job') || msg.includes('career') || msg.includes('promotion') || msg.includes('business') || msg.includes('work') || msg.includes('office')) return 'career';
        if (msg.includes('marry') || msg.includes('marriage') || msg.includes('love') || msg.includes('relationship') || msg.includes('partner') || msg.includes('husband') || msg.includes('wife')) return 'marriage';
        if (msg.includes('health') || msg.includes('sick') || msg.includes('disease') || msg.includes('surgery') || msg.includes('mental') || msg.includes('injury')) return 'health';
        if (msg.includes('money') || msg.includes('finance') || msg.includes('wealth') || msg.includes('rich') || msg.includes('investment') || msg.includes('loan')) return 'finance';

        if (msg.includes('today') || msg.includes('daily') || msg.includes('horoscope') || msg.includes('aaj') || msg.includes('tomorrow') || msg.includes('day')) return 'daily';

        if (msg.includes('math') || msg.includes('science') || msg.includes('study') || msg.includes('learn') || msg.includes('exam') || msg.includes('education') || msg.includes('college') || msg.includes('school') || msg.includes('intelligence') || msg.includes('mind') || msg.includes('brain')) return 'education';

        if (msg.match(/(hi|hello|hey|greetings|namaste|pranam|how are you|kya haal|wassup|good morning|good evening|thanks|thank you)/i) && msg.split(' ').length < 10) return 'casual';

        return 'general';
    }

    private buildAstroContext(astroData: any, intent: string = 'general', expertise: string = 'Vedic'): string {
        const now = new Date();
        const currentDateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

        if (!astroData || !astroData.kundli || astroData.status === 'error') {
            return `CURRENT SERVER DATE: ${currentDateStr}
            
SUBJECT IDENTITY & BIRTH DETAILS:
- Name: ${astroData.name || 'Seeker'}
- DOB: ${astroData.dob || astroData.dateOfBirth || 'Unknown'}
- TOB: ${astroData.tob || astroData.timeOfBirth || 'Unknown'}
- POB: ${astroData.pob || astroData.placeOfBirth || 'Unknown'}

INSTRUCTION: 
Provide a deeply intuitive and spiritual reading based closely on the seeker's birth details provided above. Focus on the energetic significance of their birth date and your astrological expertise. Do not mention any missing charts, missing coordinates, or technical issues to the user. Speak with divine authority and guide them gracefully.`;
        }

        const kundli = astroData.kundli;
        const dasha = astroData.dasha;
        const doshas = astroData.doshas;

        // ⚠️ IMPORTANT: The Vedic prompt's CHART DATA LOCK rule explicitly references "ASTRO_DATA".
        // This label MUST stay "ASTRO_DATA" for Vedic — if you rename it, GPT will ignore the lock.
        const dataLabel = expertise === 'Vedic' ? 'ASTRO_DATA' : 'ASTROLOGICAL REFERENCE DATA';
        let context = `CURRENT SERVER DATE: ${currentDateStr}\n`;

        // 🟢 [RAW BIRTH DATA] CRITICAL: Always provide this so AI knows DOB/TOB/POB even if chart fails
        context += `\nSUBJECT IDENTITY & BIRTH DETAILS:\n`;
        context += `- Name: ${astroData.name || 'Seeker'}\n`;
        context += `- DOB: ${astroData.dob || astroData.dateOfBirth || 'Unknown'}\n`;
        context += `- TOB: ${astroData.tob || astroData.timeOfBirth || 'Unknown'}\n`;
        context += `- POB: ${astroData.pob || astroData.placeOfBirth || 'Unknown'}\n`;

        context += `\n${dataLabel} (FACTUAL — LOCKED. USE EXACTLY AS-IS. DO NOT INFER OR SUBSTITUTE.):\n`;

        if (expertise === 'Vedic') {
            context += `Lagna: ${kundli.houses?.[1]?.sign || 'Unknown'}\n`;
            context += `Moon Sign: ${kundli.planets?.Moon?.sign || 'Unknown'}\n`;

            const relevantPlanetsMap = {
                career: ['Sun', 'Saturn', 'Mercury', 'Jupiter'],
                marriage: ['Venus', 'Jupiter', 'Mars', 'Moon'],
                health: ['Mars', 'Saturn', 'Moon', 'Sun'],
                finance: ['Jupiter', 'Venus', 'Mercury'],
                general: ['Sun', 'Moon', 'Jupiter', 'Saturn', 'Rahu', 'Ketu']
            };

            const relevantPlanets = relevantPlanetsMap[intent as keyof typeof relevantPlanetsMap] || relevantPlanetsMap.general;

            context += `\nRelevant Planetary Positions:\n`;
            relevantPlanets.forEach(p => {
                if (kundli.planets[p]) {
                    const data = kundli.planets[p];
                    context += `${p}: ${data.sign} in ${data.house || 'Unknown'} house (${data.degree?.toFixed(2)}°)\n`;
                }
            });

            const relevantHousesMap = {
                career: [10, 6, 2, 11],
                marriage: [7, 2, 12, 5],
                health: [6, 8, 12, 1],
                finance: [2, 11, 9, 5],
                general: [1, 5, 3, 9, 10]
            };
            const relevantHouses = relevantHousesMap[intent as keyof typeof relevantHousesMap] || relevantHousesMap.general;

            context += `\nRelevant Houses (Bhava):\n`;
            relevantHouses.forEach(h => {
                if (kundli.houses?.[h]) {
                    context += `House ${h}: ${kundli.houses[h].sign}\n`;
                }
            });

            if (dasha && dasha.mahadasha) {
                context += `\nCurrent Dasha Period:\n`;
                context += `Mahadasha: ${dasha.mahadasha.lord} (Ends: ${dasha.mahadasha.end_date})\n`;
                context += `Antardasha: ${dasha.antardasha.lord} (Ends: ${dasha.antardasha.end_date})\n`;
            }

            if (astroData.panchang) {
                const p = astroData.panchang;
                context += `\nPanchang Attributes:\n`;
                context += `- Tithi: ${p.tithi}\n`;
                context += `- Nakshatra: ${p.nakshatra}\n`;
                context += `- Yoga: ${p.yoga}\n`;
                context += `- Karana: ${p.karana}\n`;
            }

            if (kundli.aspects && kundli.aspects.length > 0) {
                context += `\nSignificant Planetary Aspects:\n`;
                kundli.aspects.forEach((a: string) => context += `- ${a}\n`);
            }

            if (astroData.transits && astroData.transits.length > 0) {
                context += `\nTODAY'S PLANETARY TRANSITS (GOCHAR):\n`;
                astroData.transits.forEach((p: any) => {
                    if (p.name !== 'Ascendant') {
                        context += `- Transit ${p.name} is in ${p.sign} (${p.degree?.toFixed(2)}°)\n`;
                    }
                });
            }

            if (doshas) {
                context += `\nDETECTED DOSHAS:\n`;
                if (doshas.manglik?.is_present) context += `- Manglik: ${doshas.manglik.details}\n`;
                if (doshas.kalsarp?.is_present) context += `- Kalsarp: ${doshas.kalsarp.details}\n`;
            }
        } else {
            context += `Subject's Sun Sign: ${kundli.planets?.Sun?.sign || 'Unknown'}\n`;
            context += `Subject's Moon Sign: ${kundli.planets?.Moon?.sign || 'Unknown'}\n`;
            context += `Note: Focus strictly on ${expertise} interpretation. Do NOT use Vedic terminology or Dasha systems.\n`;
        }

        return context.trim();
    }

    private getOpenAIMessages(systemPrompt: string, astroContext: string, conversationHistory: any[]) {
        const messages: any[] = [{ role: 'system', content: systemPrompt }];

        if (astroContext && astroContext.length > 5) {
            messages.push({
                role: 'user',
                content: `ASTROLOGICAL CONTEXT FOR THIS SESSION:\n${astroContext}`
            });
            messages.push({
                role: 'assistant',
                content: "I have received the divine birth data. I am ready to guide based on these cosmic patterns."
            });
        }

        conversationHistory.slice(-8).forEach(msg => {
            messages.push({
                role: msg.senderModel === 'User' ? 'user' : 'assistant',
                content: msg.content
            });
        });

        return messages;
    }

    async generateResponse(
        userMessage: string,
        astrologerProfile: {
            name: string;
            tone?: string;
            styleGuide?: string;
            personalityType?: string;
            systemPromptAddition?: string;
            expertise?: string;
            bio?: string;
            focusArea?: string;
        },
        userBirthDetails: {
            dateOfBirth: string;
            timeOfBirth: string;
            placeOfBirth: string;
            name: string;
        },
        conversationHistory: any[] = [],
        language: string = 'English'
    ): Promise<string> {
        let rawExpertise = astrologerProfile.expertise || 'Vedic';
        let expertise = rawExpertise.charAt(0).toUpperCase() + rawExpertise.slice(1).toLowerCase();

        if (!['Vedic', 'Tarot', 'Numerology'].includes(expertise)) {
            expertise = 'Vedic';
        }

        try {
            this.logger.log('🤖 [AI Engine] Generating response...');

            const intent = this.detectAstrologyIntent(userMessage);

            const personaPrompt = this.buildPersonaPrompt({ ...astrologerProfile, expertise }, language);
            const specializationPrompt = (this.SPECIALIZATION_PROMPTS[expertise as keyof typeof this.SPECIALIZATION_PROMPTS] || this.SPECIALIZATION_PROMPTS.Vedic)[intent as keyof (typeof this.SPECIALIZATION_PROMPTS)['Vedic']] || (this.SPECIALIZATION_PROMPTS[expertise as keyof typeof this.SPECIALIZATION_PROMPTS] || this.SPECIALIZATION_PROMPTS.Vedic).general;

            // Define "IMPORTANT" instruction block
            let instructions = '';
            if (intent === 'casual') {
                instructions = `
    IMPORTANT:
    - Respond with DEEP SPIRITUAL WARMTH using the name ${userBirthDetails.name}.
    - Greet back simply and divine (e.g., "Namaste", "Blessings").
    - Keep it short (under 60 words). No structured sections needed for casual chat.
    `;
            } else if (intent === 'daily') {
                instructions = `
    IMPORTANT:
    - **NAME**: Always use the seeker's name (${userBirthDetails.name}) in your preamble.
    - **MANDATORY STORYTELLING (GOCHAR MODE)**:
        The seeker wants a deep "vibe" of their day. Weave today's transits into a cohesive narrative using headers and bullet points. **DO NOT remove the # and * symbols.**
        
        ### Today's Cosmic Energy
        * Identify the most powerful transit happening right now (e.g., Moon's current placement). 
        * Explain how this specific energy is coloring their world TODAY using a narrative paragraph. Use **bold** for planets.

        ### Guidance for the Day
        * Provide 1-2 practical actions they can take today based on the celestial weather.
        * Maintain a warm, encouraging, and divine tone.

        ### The Deep Dive Hook
        * Ask a short, provocative question about their current feeling related to today's transits.

    - **STRICT PROTOCOL**: You MUST use exactly these three headings (with ###). Format planets and key houses in bold.
    - **STYLE**: Use # and * for structure as requested. Keep it atmospheric and narrative.
    - **LENGTH**: 180-250 words total.
    `;
            } else {
                instructions = `
    IMPORTANT:
    - **NAME**: Always use the seeker's name (${userBirthDetails.name}) in your preamble.
    - **MANDATORY STRUCTURE & STORYTELLING**:
        Do not just construct isolated bullet points. Weave the celestial bodies, signs, and houses together into a cohesive psychological narrative. Give them archetypal titles (e.g., "The Seeker", "The Analyst").

        ### Your Personality Analysis
        * **The [Sign] Ascendant (The [Archetype]):** Explain how their Lagna AND Lagna Lord's house placement shapes their core identity and drive. 
        * **The [Sign] Moon (The [Archetype]):** Explain how their Moon sign AND its house placement wires their mind and emotional patterns.
        **The Balancing Act:** Write a short paragraph synthesizing the tension or harmony between their Ascendant's drive and their Moon's emotional needs.
        
        ### The 'Why' Behind Your Nature
        Explain the technical astrological reasons in a cohesive paragraph. Weave in Yogas, Dashas, Mahadasha, and specific planetary placements (e.g., Debilitated, Own Sign, Exalted). Connect this to their current life phase or the tension described above.
        
        ### The Deep Dive Hook
        Make a compelling, highly specific observation linking a planetary placement (like Mercury in 8th house) to a potential strength, stressor, or sudden change. End with a bold question asking if they want to explore it further.

    - **STRICT PROTOCOL**: You MUST use exactly these three headings (with ###). Format the archetypes and key planets in bold. 
    - **VIBE**: Deep, insightful, narrative, premium, authoritative, and divine. Avoid robotic lists of isolated facts.
    - **LENGTH**: 200-300 words total.
    `;
            }

            // Move instructions into System Prompt to give them high priority
            const systemPrompt = `${this.MASTER_SYSTEM_PROMPT}\n\n${personaPrompt}\n\n${specializationPrompt}\n\n${instructions}`;

            // ─────────────────────────────────────────────────────────────────────
            // FIX: Resolve actual coordinates for the user's birth place.
            // The previous hardcoded Delhi coords (28.7041 / 77.1025) overrode
            // everyone's birth location and was the #1 cause of wrong Ascendants.
            // ─────────────────────────────────────────────────────────────────────
            let lat: string | null = null;
            let lon: string | null = null;

            try {
                if (userBirthDetails.placeOfBirth) {
                    const coords = await this.astronomyService.geocodePlaceOfBirth(
                        userBirthDetails.placeOfBirth
                    );
                    lat = String(coords.lat);
                    lon = String(coords.lon);
                    this.logger.log(`📍 [AI Engine] Geocoded "${userBirthDetails.placeOfBirth}" → lat=${lat}, lon=${lon}`);
                }
            } catch (geoErr) {
                this.logger.warn(`⚠️ [AI Engine] geocodePlaceOfBirth() failed for "${userBirthDetails.placeOfBirth}". Precise coordinates unavailable.`);
            }

            let allAstroData = null;
            let transitsData = null;
            if (lat && lon) {
                try {
                    allAstroData = await this.astronomyService.calculateAllData(
                        userBirthDetails.dateOfBirth,
                        userBirthDetails.timeOfBirth,
                        lat,
                        lon
                    );

                    if (intent === 'daily') {
                        transitsData = await this.astronomyService.getTransits(lat, lon);
                    }
                } catch (err) {
                    this.logger.error('❌ [AI Engine] Astronomy Service Failed:', err.message);
                }
            }

            const astroContext = this.buildAstroContext(
                {
                    ...(allAstroData || {}),
                    transits: transitsData,
                    name: userBirthDetails.name,
                    dob: userBirthDetails.dateOfBirth,
                    tob: userBirthDetails.timeOfBirth,
                    pob: userBirthDetails.placeOfBirth
                },
                intent,
                expertise
            );

            this.logger.log(`🚀 [AI Engine] Sending request to OpenAI with model ${this.MODEL_NAME}...`);
            this.logger.debug(`Context length: ${astroContext.length}, History length: ${conversationHistory.length}`);

            const openaiStartTime = Date.now();
            const completion = await this.openai.chat.completions.create({
                model: this.MODEL_NAME,
                messages: [
                    ...this.getOpenAIMessages(systemPrompt, astroContext, conversationHistory),
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 800,   // Increased from 400 — prevents GPT from compressing/skipping chart data
                temperature: 0.5   // Reduced from 0.7 — less hallucination, tighter adherence to ASTRO_DATA
            });
            const openaiEndTime = Date.now();
            this.logger.log(`✅ [AI Engine] OpenAI responded in ${openaiEndTime - openaiStartTime}ms`);

            const content = completion.choices[0].message.content;

            if (!content) {
                if (expertise === 'Tarot') return 'I apologize, but the cards are unclear right now. Please try again.';
                if (expertise === 'Numerology') return 'I apologize, but the vibrations are misaligned. Please try again.';
                return 'I apologize, but the celestial connection was interrupted. Please try again.';
            }

            return content;

        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error';
            const errorStatus = error?.status || error?.response?.status || 'No status';
            const errorType = error?.type || error?.code || 'No type';

            this.logger.error(`❌ [AI Engine] Error generating AI response: ${errorMessage} (Status: ${errorStatus}, Type: ${errorType})`);

            if (errorStatus === 401) {
                this.logger.error('🔑 [AI Engine] Invalid OpenAI API Key. Please check your .env file.');
            } else if (errorStatus === 429) {
                this.logger.error('💳 [AI Engine] OpenAI Quota Exceeded or Rate Limited. Please check your billing/usage.');
            }

            if (expertise === 'Tarot') {
                return "I apologize, but I'm having trouble reading the cards right now. Please try again in a moment.";
            } else if (expertise === 'Numerology') {
                return "I apologize, but I'm having trouble aligning the vibrations right now. Please try again in a moment.";
            }

            return "I apologize, but I'm having trouble connecting to the stars right now. Please try again in a moment.";
        }
    }

    async generateSessionSummary(messages: any[]): Promise<string> {
        if (!messages?.length) return 'No conversation.';

        try {
            const text = messages
                .slice(-10)
                .map(m => `${m.senderModel}: ${m.content}`)
                .join('\n');

            const prompt = `Summarize this astrology consultation in 2-3 concise sentences:\n\n${text}`;

            const completion = await this.openai.chat.completions.create({
                model: this.MODEL_NAME,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                temperature: 0.5
            });

            return completion.choices[0].message.content || 'Summary unavailable.';
        } catch (error) {
            this.logger.error('Summary generation error:', error);
            return 'Summary unavailable.';
        }
    }

    async suggestFollowUps(
        conversationHistory: any[],
        astrologerProfile: any,
        birthChart: any,
        language: string = 'English'
    ): Promise<string[]> {
        try {
            const historyText = conversationHistory
                .slice(-5)
                .map(m => `${m.senderModel}: ${m.content}`)
                .join('\n');

            const personality = astrologerProfile?.personalityType || 'Modern';
            const expertise = astrologerProfile?.expertise || 'Vedic';
            const userName = birthChart?.name || 'User';

            const expertiseSpecificRules = {
                Vedic: 'Focus on Dashas, planetary transits, and remedies.',
                Tarot: 'Focus on card energies, future spreads, and emotional clarity.',
                Numerology: 'Focus on destiny numbers, cycles, and vibrational shifts.'
            };

            const prompt = `You are ${astrologerProfile?.name || 'an expert astrologer'}, a ${expertise} expert. 
        Based on this ${expertise} consultation with ${userName}, suggest 3 short, relevant questions that the USER should ask YOU next.
        
        STRICT RULES:
        1. Contextual Relevance: The questions MUST be directly related to the user's latest query and ${expertise}.
        2. Expertise Alignment: Suggestions must be specific to ${expertise} ONLY. 
           - Vedic: Ask about Dashas, Houses, Planets.
           - Tarot: Ask about card energies, spreads, intuition.
           - Numerology: Ask about Personal Years, Life Path vibrations, cycle shifts.
        3. NO TERM LEAKAGE: If ${expertise} is Numerology, do NOT suggest questions about "Kundali" or "7th House".
        4. Perspective: These MUST be from the USER's perspective (e.g., "What does my Life Path say about my career?" or "Which card reveals my true feelings?").
        5. Language: Output ONLY in ${language}.
        6. Personalization: Use the context of what was just discussed in the conversation.
        
        Recent conversation:
        ${historyText}
        
        Goal: Provide engaging, context-aware questions for the USER.
        Output ONLY a JSON array of strings: ["Question 1?", "Question 2?", "Question 3?"]`;

            const completion = await this.openai.chat.completions.create({
                model: this.MODEL_NAME,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0.7
            });

            const responseText = completion.choices[0].message.content || '';
            const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (error) {
            this.logger.error('Follow-up suggestions error:', error);
            return [];
        }
    }

    async generateDynamicGreeting(userName: string = 'Seeker', language: string = 'English'): Promise<string> {
        try {
            // ✅ FIX: Use IST (Asia/Kolkata) time for greeting logic instead of Server UTC
            const istDateString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const currentHour = new Date(istDateString).getHours();

            const timeOfDay = currentHour < 12 ? 'Morning' : (currentHour < 16 ? 'Afternoon' : 'Evening');

            const prompt = `Generate a short, spiritual, and welcoming astrology greeting.
            
            Context:
            - User Name: ${userName}
            - Time of Day: ${timeOfDay}
            - Language: ${language} (CRITICAL: Output MUST be strictly in ${language})
            
            Instructions:
            - Greet the user personally.
            - Be warm, divine, and mention cosmic energy or blessings.
            - Max 25 words.
            - Do NOT use markdown or quotes.
            - If language is Hindi, use spiritual terms like "Namaste", "Ashirwad", "Jyotish".`;

            const completion = await this.openai.chat.completions.create({
                model: this.MODEL_NAME,
                messages: [
                    { role: 'system', content: `You are a divine astrologer. You respond ONLY in ${language}. Never respond in English if the language is different.` },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 100,
                temperature: 0.8
            });

            return (completion.choices[0].message.content || '').trim();
        } catch (error) {
            this.logger.error('Greeting generation error:', error);
            return language === 'Hindi' ? "नमस्ते। सितारे आपके पक्ष में हैं। मैं आपकी आज कैसे सहायता कर सकता हूँ?" : "Namaste. The stars are aligned. How may I guide you today?";
        }
    }

    calculateQualityScore(aiResponse: string): number {
        // Look for self-evaluation metrics first [[METRICS: ACCURACY=X, EMPATHY=Y]]
        const metricsMatch = aiResponse.match(/\[\[METRICS: ACCURACY=(\d+), EMPATHY=(\d+)\]\]/i);
        if (metricsMatch) {
            const accuracy = parseInt(metricsMatch[1]);
            const empathy = parseInt(metricsMatch[2]);
            // Weigh them for a final quality score (mostly accuracy)
            return Math.min(Math.round((accuracy * 0.7) + (empathy * 0.3)), 10);
        }

        // ✅ Improved fallback heuristics with higher base score
        let score = 8; // Increased base score to 8/10

        // Length quality indicator (longer responses tend to be more detailed)
        if (aiResponse.length > 400) score += 1;
        else if (aiResponse.length > 200) score += 0.5;
        else if (aiResponse.length < 50) score -= 1; // Penalize very short responses

        // Structure bonus (numbered lists, bullet points indicate organized thinking)
        if (aiResponse.includes('1.') || aiResponse.includes('2.') || aiResponse.includes('•')) score += 0.5;

        // Core spiritual/astrological keywords (English & Hindi) - indicates domain expertise
        const hasAstroKeywords = /vibration|energy|karma|path|destiny|cycle|timing|guidance|remedy|blessing|Graha|Bhava|Dasha|Nakshatra|Yoga|planet|house|ascendant|रवि|चंद्र|मंगल|बुध|नक्षत्र|योग|दशा/i.test(aiResponse);
        if (hasAstroKeywords) {
            score += 1;
        }

        return Math.min(Math.max(score, 7), 10); // Clamp between 7-10
    }
}
