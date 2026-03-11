const mongoose = require('mongoose');

async function fixStatuses() {
  const uri = 'mongodb+srv://vadiktalk:7fnBvxiPrutuSu7G@cluster0.zjkqtzw.mongodb.net/vaidiktalk';
  
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Update AI Astrologer Profiles
    console.log('Updating statuses for AI profiles...');
    const result = await db.collection('ai_astrologer_profiles').updateMany(
      {},
      { 
        $set: { 
          status: 'active',
          accountStatus: 'active',
          isAvailable: true 
        } 
      }
    );

    console.log(`Matched ${result.matchedCount} and updated ${result.modifiedCount} documents.`);

    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixStatuses();
