const mongoose = require('mongoose');

const db = async () => {
    try {
        await mongoose.connect('mongodb+srv://zainmanzoor:zain123@restaurantcluster.58idby5.mongodb.net/').then(() => {
            console.log('Database Connected Successfully');
        })
    } catch (error) {
        console.log('Error while connecting to the database', error.message);
    }
}

module.exports = db;