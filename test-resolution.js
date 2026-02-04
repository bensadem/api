const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const AppConfig = require('./src/lib/db/models/AppConfig');

require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testResolution() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const channelId = '703';
        console.log(`Testing resolution for ID: ${channelId}`);

        const enabled = await AppConfig.getValue('iptv_proxy_enabled');
        const baseUrl = await AppConfig.getValue('iptv_proxy_base_url');
        const username = await AppConfig.getValue('iptv_proxy_username');
        const password = await AppConfig.getValue('iptv_proxy_password');

        if (!enabled) {
            console.log('Proxy disabled');
            return;
        }

        const url = `${baseUrl}/${username}/${password}/${channelId}`;
        console.log(`Constructed URL: ${url}`);

        try {
            console.log('Sending GET request (stream mode)...');
            const response = await axios.get(url, {
                maxRedirects: 5,
                timeout: 15000,
                validateStatus: (status) => status >= 200 && status < 400,
                responseType: 'stream'
            });

            // Immediately destroy the stream to avoid downloading
            if (response.data && typeof response.data.destroy === 'function') {
                response.data.destroy();
                console.log('Stream destroyed.');
            }

            const finalUrl = response.request.res.responseUrl || response.request.res.url || url;
            console.log('Success!');
            console.log('Final URL:', finalUrl);
            console.log('Headers:', response.headers);
        } catch (error) {
            console.error('Request failed:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

testResolution();
