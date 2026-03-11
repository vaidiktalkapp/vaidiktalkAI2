const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixHumanAstrologers() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const astrologerCollection = db.collection('astrologers');

    // Update all astrologers where status or profileCompletion is missing/incomplete
    const result = await astrologerCollection.updateMany(
      { 
        $or: [
          { accountStatus: { $exists: false } },
          { accountStatus: null },
          { accountStatus: "" },
          { "profileCompletion.isComplete": { $ne: true } }
        ]
      },
      { 
        $set: { 
          accountStatus: 'active',
          "profileCompletion.isComplete": true,
          "profileCompletion.steps.availability": true,
          "profileCompletion.steps.pricing": true,
          "profileCompletion.steps.expertise": true,
          "profileCompletion.steps.basicInfo": true,
          "availability.isOnline": true,
          "availability.isAvailable": true
        } 
      }
    );

    console.log(`Successfully updated ${result.modifiedCount} astrologers to active status.`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

fixHumanAstrologers();
