const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { AiAstrologyEngineService } = require('./dist/src/ai-astrologers/services/ai-astrology-engine.service');

async function testCharismaticPersona() {
  console.log("--- STARTING NEST CONTEXT ---");
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiEngine = app.get(AiAstrologyEngineService);

  const mockProfile = {
    name: 'Astro Ananya',
    personalityType: 'Charismatic',
    expertise: 'Vedic',
    bio: 'An expert in love and relationships.',
    focusArea: 'Love and Career',
    tone: 'Flirty and playful',
    userName: 'Vishal'
  };

  const mockUserBirthDetails = {
    dateOfBirth: '07-02-1998',
    timeOfBirth: '20:05',
    placeOfBirth: 'New Delhi',
    name: 'Vishal'
  };

  const mockHistory = [];

  console.log("--- SIMULATING CHARISMATIC RESPONSE ---");
  // SIGNATURE: generateResponse(userMessage, astrologerProfile, userBirthDetails, conversationHistory, language)
  try {
    const response = await aiEngine.generateResponse(
      "tell me about my future and personality",
      mockProfile,
      mockUserBirthDetails,
      mockHistory,
      "English"
    );

    console.log("\nAI RESPONSE:\n");
    console.log(response);
  } catch (err) {
    console.error("❌ ERROR DURING GENERATION:", err);
  }

  await app.close();
  console.log("--- DONE ---");
}

testCharismaticPersona().catch(console.error);
