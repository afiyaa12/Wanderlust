const mongoose = require('mongoose');
const initdata = require("./data.js");
const listing = require('../models/listin.js');

const mongo_url = 'mongodb://127.0.0.1:27017/wanderlust';

main()
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

async function main() {
    await mongoose.connect(mongo_url);
}

const initDB = async () => {
    await listing.deleteMany({});

    // FIX: data.js has image as {url: "..."} but schema expects plain string
    const fixedData = initdata.data.map((obj) => ({
        ...obj,
        image: obj.image.url
    }));

    await listing.insertMany(fixedData);
    console.log('Database initialized with sample data');
    mongoose.connection.close(); // FIX: close connection when done
};

initDB();