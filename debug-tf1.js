const mongoose = require('mongoose');
const path = require('path');
const Channel = require('./src/lib/db/models/Channel');
const AppConfig = require('./src/lib/db/models/AppConfig');

// Load env
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function inspectTF1() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Check App Config for Proxy
        const proxyEnabled = await AppConfig.getValue('iptv_proxy_enabled');
        const proxyBaseUrl = await AppConfig.getValue('iptv_proxy_base_url');
        const proxyUser = await AppConfig.getValue('iptv_proxy_username');

        console.log('--- Proxy Config ---');
        console.log('Enabled:', proxyEnabled);
        console.log('Base URL:', proxyBaseUrl);
        console.log('Username:', proxyUser ? 'Set' : 'Not Set');

        // Find TF1 HD
        const channel = await Channel.findOne({ name: { $regex: 'TF1', $options: 'i' } });

        if (channel) {
            console.log('--- Channel Details ---');
            console.log(`ID: ${channel._id}`);
            console.log(`Name: ${channel.name}`);
            console.log(`Stream URL: "${channel.streamUrl}"`);
            console.log(`External ID: "${channel.externalChannelId}"`);
        } else {
            console.log('Channel "TF1" not found');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

inspectTF1();
