const mongoose = require('mongoose');
const initdata = require("./data.js");
const listing = require('../models/listin.js');

// ← temporarily use Atlas URL directly
const mongo_url = 'mongodb+srv://wanderlustuser:Wanderlust123@cluster0.an1hpcf.mongodb.net/?appName=Cluster0';

main()
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

async function main() {
    await mongoose.connect(mongo_url);
}

const initDB = async () => {
    await listing.deleteMany({});
    const fixedData = initdata.data.map((obj) => ({
        ...obj,
        image: obj.image.url
    }));
    await listing.insertMany(fixedData);
    console.log('Database initialized with sample data');
    mongoose.connection.close();
};

initDB();