const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Channel = require('./src/lib/db/models/Channel');

dotenv.config();

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const channels = await Channel.find({}).limit(5);
        console.log('Sample Channels:');
        channels.forEach(ch => {
            console.log(JSON.stringify(ch, null, 2));
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

inspect();
