const mongoose = require('mongoose');

const db = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/mehndi').then(() => {
            console.log('Database Connected Successfully');
        })
    } catch (error) {
        console.log('Error while connecting to the database', error.message);
    }
}

module.exports = db;