const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define allowed categories
const categories = [
    "Beaches",
    "Mountains", 
    "Cities",
    "Castles",
    "Camping",
    "Farms",
    "Arctic",
    "Domes",
    "Boats"
];

const listingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: {
        type: String,
        default: "https://images.unsplash.com/photo-1469474968028-56623f02e42e"
    },
    price: Number,
    location: String,
    country: String,
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    category: {
        type: String,
        enum: categories,  // only allows these specific values
        default: "Cities"
    }
});

const Listing = mongoose.model('listing', listingSchema);
module.exports = Listing;