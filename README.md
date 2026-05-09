# Wanderlust

A full-stack travel listing web application inspired by Airbnb, built with Node.js, Express, and MongoDB.

## Live Demo
[https://wanderlust-jrvm.onrender.com](https://wanderlust-jrvm.onrender.com)

## Features

- Browse travel listings with search and category filters
- User authentication (register, login, logout)
- Create, edit, and delete your own listings
- Leave reviews and ratings on listings
- Save favourite listings to wishlist
- Book listings with date selection and price calculator
- Tax calculator (GST 18%)
- User profile page with listings and reviews
- Authorization — only owners can edit/delete their listings
- Fully responsive design

## Tech Stack

| Technology | Usage |
|---|---|
| Node.js | Runtime environment |
| Express.js | Backend framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| EJS | Templating engine |
| Passport.js | Authentication |
| Bootstrap 5 | Frontend styling |
| Joi | Server-side validation |
| Render | Deployment |
| MongoDB Atlas | Cloud database |

## Project Structure
Wanderlust/
├── models/          # Database models
│   ├── listin.js    # Listing model
│   ├── review.js    # Review model
│   ├── user.js      # User model
│   └── booking.js   # Booking model
├── views/           # EJS templates
│   ├── listings/    # Listing pages
│   ├── users/       # Auth and profile pages
│   ├── layouts/     # Boilerplate layout
│   └── includes/    # Navbar and footer
├── public/          # Static files
│   ├── css/         # Stylesheets
│   └── js/          # Client scripts
├── utils/           # Utility functions
│   ├── wrapAsync.js
│   └── ExpressError.js
├── init/            # Database seeding
├── schema.js        # Joi validation schemas
└── app.js           # Main server file

## Run Locally

1. Clone the repository
```bash
git clone https://github.com/afiyaa12/Wanderlust.git
cd Wanderlust
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root folder
PORT=3000
MONGO_URL=mongodb://127.0.0.1:27017/wanderlust
SECRET=yoursecretkey

4. Seed the database
```bash
node init/index.js
```

5. Start the server
```bash
nodemon app.js
```

6. Visit `http://localhost:3000`

## Developer

Afiya Jabeen Kamal
- GitHub: [@afiyaa12](https://github.com/afiyaa12)

## License

This project is open source and available under the MIT License.



<img width="1866" height="1022" alt="Screenshot 2026-05-09 140943" src="https://github.com/user-attachments/assets/8c5a1799-364d-406d-9318-9936ca43f19f" />

