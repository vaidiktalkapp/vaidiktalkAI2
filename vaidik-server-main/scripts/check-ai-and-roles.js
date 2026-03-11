const mongoose = require('mongoose');

async function checkData() {
  const uri = 'mongodb+srv://vadiktalk:7fnBvxiPrutuSu7G@cluster0.zjkqtzw.mongodb.net/vaidiktalk';
  
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Check AI Astrologer Profiles
    console.log('\n--- AI Astrologer Profiles ---');
    const aiProfiles = await db.collection('ai_astrologer_profiles').find({}).toArray();
    console.log(`Found ${aiProfiles.length} AI profiles.`);
    aiProfiles.forEach(p => {
      console.log(`- ${p.name}: isAvailable=${p.isAvailable}, status=${p.status}, isAI=${p.isAI}`);
    });

    // Check Admins
    console.log('\n--- Admins ---');
    const admins = await db.collection('admins').find({}).toArray();
    console.log(`Found ${admins.length} admins.`);
    admins.forEach(a => {
      console.log(`- ${a.email}: roleType=${a.roleType}, isSuperAdmin=${a.isSuperAdmin}, roleId=${a.roleId}`);
    });

    // Check Admin Roles
    console.log('\n--- Admin Roles ---');
    const roles = await db.collection('admin_roles').find({}).toArray();
    console.log(`Found ${roles.length} roles.`);
    roles.forEach(r => {
      console.log(`- ${r.name}: permissions count=${r.permissions ? r.permissions.length : 0}`);
      if (r.permissions) {
          console.log(`  Permissions: ${r.permissions.join(', ')}`);
      }
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkData();
