
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = 'mongodb+srv://vadiktalk:7fnBvxiPrutuSu7G@cluster0.zjkqtzw.mongodb.net/vaidiktalk';

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        const db = mongoose.connection.db;

        // 1. Update AI Sessions
        console.log('Updating AI Sessions...');
        const sessionUpdate = await db.collection('chat_sessions').updateMany(
            { orderId: /^AI-/, astrologerModel: { $exists: false } },
            { $set: { astrologerModel: 'AiAstrologerProfile' } }
        );
        console.log(`Updated ${sessionUpdate.modifiedCount} AI sessions.`);

        // 2. Update Human Sessions
        console.log('Updating Human Sessions...');
        const humanSessionUpdate = await db.collection('chat_sessions').updateMany(
            { orderId: { $not: /^AI-/ }, astrologerModel: { $exists: false } }, // sessions with normal order IDs
            { $set: { astrologerModel: 'Astrologer' } }
        );
        console.log(`Updated ${humanSessionUpdate.modifiedCount} human sessions.`);

        // 3. Update Orders
        console.log('Updating Orders...');
        const aiOrderUpdate = await db.collection('orders').updateMany(
            { orderId: /^AI-/, astrologerModel: { $exists: false } },
            { $set: { astrologerModel: 'AiAstrologerProfile' } }
        );
        const humanOrderUpdate = await db.collection('orders').updateMany(
            { orderId: { $not: /^AI-/ }, astrologerModel: { $exists: false } },
            { $set: { astrologerModel: 'Astrologer' } }
        );
        console.log(`Updated ${aiOrderUpdate.modifiedCount} AI orders and ${humanOrderUpdate.modifiedCount} human orders.`);

        // 4. Update Message models
        console.log('Updating Chat Message models...');
        // Messages where sender is not 'User' or 'System' in AI sessions
        // This is more complex, but let's start with sessions/orders first as history depends on those.

        console.log('Migration finished successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
