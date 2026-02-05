const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const categories = await mongoose.connection.collection('categories').find({ type: 'channel' }).limit(10).toArray();
        console.log('Sample Channel Categories:');
        categories.forEach(cat => {
            console.log(JSON.stringify(cat, null, 2));
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

inspect();
