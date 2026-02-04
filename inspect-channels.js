const mongoose = require('mongoose');
const path = require('path');
const Channel = require('./src/lib/db/models/Channel');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') }); // Try server/.env first
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
}

async function inspectChannels() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const channels = await Channel.find().sort({ createdAt: -1 }).limit(10);

        console.log('--- Recent Channels ---');
        channels.forEach(ch => {
            console.log(`ID: ${ch._id}`);
            console.log(`Name: ${ch.name}`);
            console.log(`Stream URL: "${ch.streamUrl}"`);
            console.log(`External ID: "${ch.externalChannelId}"`);
            console.log('---');
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

inspectChannels();
