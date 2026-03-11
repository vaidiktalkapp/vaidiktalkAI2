import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkAiAstrologers() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection failed - db is undefined');
    }

    const collections = await db.listCollections().toArray();
    console.log('Collections present:', collections.map(c => c.name));

    const aiCollection = db.collection('ai_astrologer_profiles');
    const count = await aiCollection.countDocuments();
    
    console.log(`Total AI Astrologers found: ${count}`);
    
    if (count > 0) {
      const samples = await aiCollection.find({}).limit(5).toArray();
      console.log('Sample AI Astrologers:');
      samples.forEach(s => console.log(`- ${s.name} (${s.expertise?.join(', ') || 'No expertise'})`));
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

checkAiAstrologers();
