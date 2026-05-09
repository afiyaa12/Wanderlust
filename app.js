// ─── All Imports Together At Top ─────────────────────────────────────
require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const Booking = require('./models/booking.js');

// Models
const Listing = require('./models/listin.js');
const Review = require('./models/review.js');
const User = require('./models/user.js');

// Utils
const wrapAsync = require('./utils/wrapAsync.js');
const ExpressError = require('./utils/ExpressError.js');
const { listingSchema, reviewSchema } = require('./schema.js');

const mongo_url = process.env.MONGO_URL;

// ─── Middleware Setup ─────────────────────────────────────────────────
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

// ─── Session Configuration ────────────────────────────────────────────
const sessionOptions = {
    secret: process.env.SECRET,  // ← must be HERE inside the object
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
};
app.use(session(sessionOptions));
app.use(flash());

// ─── Passport Configuration ───────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ─── Global Locals Middleware ─────────────────────────────────────────
app.use(async (req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    // populate wishlist so we can check it in views
    res.locals.currUser = req.user ? 
        await User.findById(req.user._id).populate('wishlist') : null;
    next();
});
// ─── MongoDB Connection ───────────────────────────────────────────────
async function main() {
    await mongoose.connect(mongo_url);
}
main()
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// ─── Auth Middleware ──────────────────────────────────────────────────
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be logged in!');
        return res.redirect('/login');
    }
    next();
};

const isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing.owner.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/listings/${id}`);
    }
    next();
};

// ─── Validation Middleware ────────────────────────────────────────────
const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map((el) => el.message).join(', ');
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map((el) => el.message).join(', ');
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// ─── ROOT ROUTE ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.render('home.ejs');
});


// ─── LISTINGS ROUTES ──────────────────────────────────────────────────
app.get('/listings', wrapAsync(async (req, res) => {
    const { category, search } = req.query;

    let filter = {};

    // if category is selected
    if (category) {
        filter.category = category;
    }

    // if search term exists
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } }
        ];
        // $regex lets us do partial matching (like SQL LIKE)
        // $options: 'i' means case-insensitive
        // $or means match EITHER title OR location
    }

    const alllistings = await Listing.find(filter);
    res.render('listings/index', { alllistings, category, search });
}));
app.get('/listings/new', isLoggedIn, (req, res) => {
    res.render('listings/new.ejs');
});

app.post('/listings', isLoggedIn, validateListing, wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash('success', 'New listing created!');
    res.redirect('/listings');
}));

app.get('/listings/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: 'reviews',
            populate: { path: 'author' }
        })
        .populate('owner');
    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }
    res.render('listings/show.ejs', { listing });
}));

app.get('/listings/:id/edit', isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }
    res.render('listings/edit.ejs', { listing });
}));

app.put('/listings/:id', isLoggedIn, isOwner, validateListing, wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash('success', 'Listing updated!');
    res.redirect(`/listings/${id}`);
}));

app.delete('/listings/:id', isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Listing deleted!');
    res.redirect('/listings');
}));

// ─── AUTH ROUTES ──────────────────────────────────────────────────────
app.get('/register', (req, res) => {
    res.render('users/register.ejs');
});

app.post('/register', wrapAsync(async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash('success', `Welcome to Wanderlust, ${username}!`);
            res.redirect('/listings');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}));

app.get('/login', (req, res) => {
    res.render('users/login.ejs');
});

app.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true
    }),
    async (req, res) => {
        req.flash('success', `Welcome back, ${req.user.username}!`);
        res.redirect('/listings');
    }
);

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash('success', 'Logged out successfully!');
        res.redirect('/listings');
    });
});

// ─── REVIEW ROUTES ────────────────────────────────────────────────────
app.post('/listings/:id/reviews', isLoggedIn, validateReview, wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    req.flash('success', 'Review added!');
    res.redirect(`/listings/${listing._id}`);
}));

app.delete('/listings/:id/reviews/:reviewId', isLoggedIn, wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Review deleted!');
    res.redirect(`/listings/${id}`);
}));

// ─── PROFILE ROUTE ────────────────────────────────────────────────────
app.get('/profile', isLoggedIn, wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    const userListings = await Listing.find({ owner: req.user._id });
    const userReviews = await Review.find({ author: req.user._id }); // ✅
    res.render('users/profile.ejs', { user, userListings, userReviews });
}));

// ─── WISHLIST ROUTES ──────────────────────────────────────────────────

// ADD to wishlist
app.post('/wishlist/:id', isLoggedIn, wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    const listingId = req.params.id;

    // check if already in wishlist
    const alreadySaved = user.wishlist.includes(listingId);

    if(alreadySaved) {
        // remove it (toggle off)
        user.wishlist = user.wishlist.filter(
            id => id.toString() !== listingId
        );
        await user.save();
        req.flash('success', 'Removed from wishlist!');
    } else {
        // add it (toggle on)
        user.wishlist.push(listingId);
        await user.save();
        req.flash('success', 'Added to wishlist! ❤️');
    }
    res.redirect(`/listings/${listingId}`);
}));

// VIEW wishlist
app.get('/wishlist', isLoggedIn, wrapAsync(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('wishlist');
    res.render('users/wishlist.ejs', { wishlist: user.wishlist });
}));

// ─── BOOKING ROUTES ───────────────────────────────────────────────────

// POST — create a booking
app.post('/listings/:id/book', isLoggedIn, wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const { checkIn, checkOut } = req.body;

    // calculate number of nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil(
        (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    // validate dates
    if(nights <= 0) {
        req.flash('error', 'Check-out must be after check-in!');
        return res.redirect(`/listings/${req.params.id}`);
    }

    const totalPrice = listing.price * nights;

    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
        nights
    });

    await booking.save();
    req.flash('success', `Booking confirmed! ${nights} nights for ₹${totalPrice.toLocaleString('en-IN')}`);
    res.redirect('/mybookings');
}));

// GET — view all bookings for current user
app.get('/mybookings', isLoggedIn, wrapAsync(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate('listing')
        .sort({ createdAt: -1 }); // newest first
    res.render('users/bookings.ejs', { bookings });
}));

// DELETE — cancel a booking
app.delete('/bookings/:id', isLoggedIn, wrapAsync(async (req, res) => {
    await Booking.findByIdAndDelete(req.params.id);
    req.flash('success', 'Booking cancelled!');
    res.redirect('/mybookings');
}));

// ─── 404 ROUTE ───────────────────────────────────────────────────────
app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, 'Page not found!'));
});
// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    const { status = 500, message = 'Something went wrong!' } = err;
    res.status(status).render('error.ejs', { message });
});

// ─── START SERVER ─────────────────────────────────────────────────────
app.listen(3000, () => {
    console.log('Server running on port 3000');
});