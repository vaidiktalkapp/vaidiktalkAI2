const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkAiProfiles() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const aiCollection = db.collection('ai_astrologer_profiles');
    const profiles = await aiCollection.find({}).toArray();
    
    console.log(`Total AI Profiles: ${profiles.length}`);
    profiles.forEach(p => {
      console.log(`- ${p.name}: isAvailable=${p.isAvailable}, status=${p.status}, accountStatus=${p.accountStatus}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAiProfiles();
