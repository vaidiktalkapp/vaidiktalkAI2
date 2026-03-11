const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkAdmins() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check Admin Roles
    const rolesCollection = db.collection('adminroles'); // Standard NestJS/Mongoose naming usually results in lowercase plural or similar
    // Fallback names if 'adminroles' doesn't exist
    const collections = await db.listCollections().toArray();
    const roleColName = collections.find(c => c.name.toLowerCase().includes('adminrole'))?.name || 'adminroles';
    
    console.log(`Using roles collection: ${roleColName}`);
    const roles = await db.collection(roleColName).find({}).toArray();
    console.log('Admin Roles found:', roles.length);
    roles.forEach(r => console.log(`- Role: ${r.name}, Permissions: ${JSON.stringify(r.permissions)}`));

    // Check Admins
    const adminsCollection = db.collection('admins');
    const admins = await adminsCollection.find({}).toArray();
    console.log(`Total Admins found: ${admins.length}`);
    
    admins.forEach(a => {
      const role = roles.find(r => r._id.toString() === a.roleId?.toString());
      console.log(`- Admin: ${a.name} (${a.email})
        RoleType: ${a.roleType}
        RoleId: ${a.roleId}
        RoleName: ${role?.name || 'Unknown'}
        IsSuperAdmin: ${a.isSuperAdmin}
        Status: ${a.status}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

checkAdmins();
