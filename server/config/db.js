const mongoose = require('mongoose');

const db = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not set in environment variables');
        }
        await mongoose.connect(mongoUri).then(() => {
            console.log('---Database Connected Successfully---');
        })
    } catch (error) {
        console.log('Error while connecting to the database', error.message);
    }
}

module.exports = db;