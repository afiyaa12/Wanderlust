const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const plm = require('passport-local-mongoose').default;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    wishlist: [
        {
            type: Schema.Types.ObjectId,
            ref: 'listing'  // array of saved listing IDs
        }
    ]
});

userSchema.plugin(plm);

module.exports = mongoose.model('User', userSchema);