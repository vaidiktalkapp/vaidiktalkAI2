const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkAstrologers() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check Human Astrologers
    const astrologerCollection = db.collection('astrologers');
    const humanCount = await astrologerCollection.countDocuments();
    console.log(`Total Human Astrologers found: ${humanCount}`);
    
    if (humanCount > 0) {
      const samples = await astrologerCollection.find({}).limit(5).toArray();
      console.log('Sample Human Astrologers:');
      samples.forEach(s => console.log(`- ${s.name} (Status: ${s.status}, IsVerified: ${s.isVerified})`));
    }

    // Check AI Astrologers again to be sure
    const aiCollection = db.collection('ai_astrologer_profiles');
    const aiCount = await aiCollection.countDocuments();
    console.log(`Total AI Astrologers found: ${aiCount}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

checkAstrologers();
