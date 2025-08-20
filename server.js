const express = require('express');
const dotenv = require('dotenv');
const exphbs = require('express-handlebars');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const User = require('./models/user');
const connectDB = require('./config/database');
const Cart = require('./models/cart');
const Product = require('./models/product');
const Order = require('./models/order');
const Subscription = require('./models/subscription');
const cartRoutes = require('./routes/cart');
const quizRoutes = require('./routes/quiz');
const checkoutRoutes = require('./routes/checkout');
const QuizResult = require('./models/quizResult');
const productsRouter = require('./routes/products');
const userBoxRoutes = require('./routes/userBox.js');

const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const subscription = require('./models/subscription');


dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

// Middleware to make session user available in templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null; // Makes user data available in all views
    next();
});

// Set Handlebars as the template engine
app.engine('hbs', exphbs.engine({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    extname: '.hbs',
    helpers: {
        eq: (a, b) => a === b,
        stringEq: (a, b) => a.toString() === b.toString(),
        not: (value) => !value,
        arrayContains: (array, value) => {
            return array && array.includes(value);
        },
        outOfStock: (product) => product.variations && product.variations[0].stock === 0,
        inStock: (product) => product.variations && product.variations[0].stock >= 0,
        json: (context) => JSON.stringify(context),
        multVar: (product) => product.variations.length > 1,
        compare: (val1, val2, options) => {
            if (val1 == val2) { 
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        containsComma: (answer) =>  answer && answer.includes(','),
        split: (answer) => answer.split(','),
        formatDate: (date) => {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = new Date(date).toLocaleDateString('en-US', options);
            return formattedDate;
        },
        twoDec: (num) => {
            if (typeof num === 'number' && !isNaN(num)) {
                return num.toFixed(2); 
              } else {
                return '0.00'; // If invalid, return 0.00
              }
        }
    },
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('public/uploads'));

// Configure storage
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage });


// Middleware to check if the user is logged in
function ensureLoggedIn(req, res, next) {
    if (req.session.user) {
        return next(); // User is logged in, proceed
    }

    // Only set redirect URL if it's a normal page request (not an AJAX call)
    if (!req.xhr) {
        req.session.redirectUrl = req.originalUrl;
    }

    res.redirect('/login');
}

app.post("/email-signup", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
  const DC = process.env.MAILCHIMP_DC;

  // Add subscriber
  const url = `https://${DC}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`;
  const subscriberData = { email_address: email, status: "subscribed" };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `apikey ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(subscriberData)
  });

  if (!response.ok) {
    const errData = await response.json();
    return res.status(response.status).json(errData);
  }

  // Create and send a small welcome campaign
  const campaignRes = await fetch(`https://${DC}.api.mailchimp.com/3.0/campaigns`, {
    method: "POST",
    headers: { "Authorization": `apikey ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "regular",
      recipients: { list_id: AUDIENCE_ID },
      settings: {
        subject_line: "Welcome to Beauty Box!",
        from_name: "Beauty Box",
        reply_to: "juliayuhanick@242426902.mailchimpapp.com"
      }
    })
  });
  const campaignData = await campaignRes.json();

  // Set campaign content
  await fetch(`https://${DC}.api.mailchimp.com/3.0/campaigns/${campaignData.id}/content`, {
    method: "PUT",
    headers: { "Authorization": `apikey ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ html: `<h1>Welcome!</h1><p>Thanks for joining our Beauty Box community!</p>` })
  });

  // Send campaign
  await fetch(`https://${DC}.api.mailchimp.com/3.0/campaigns/${campaignData.id}/actions/send`, {
    method: "POST",
    headers: { "Authorization": `apikey ${API_KEY}` }
  });

  res.json({ success: true });
});


// Serve the homepage
app.get('/', (req, res) => {
    res.render('home', { user: req.session.user });
});

// Serve the signup page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Serve the login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Serve the subcription selection page
app.get('/subscription', async (req, res) => {
    try {
        const products = await Product.find({ subscription: true }).sort({ name: -1 }); 
        res.render('subscription', { products });
    } catch (error) {
        console.error('Error fetching subscription products:', error);
        res.status(500).send('Error loading subscriptions.');
    }
});

// Serve the profile page (only if logged in)
app.get('/profile', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const quizResults = await QuizResult.findOne({ userId: req.session.user.id });

        // Fetch the user, excluding the password field
        const user = await User.findOne({ _id: req.session.user.id }).select('-password');

        // Fetch the 3 most recent orders for the user
        let orders = await Order.find({ userId: req.session.user.id })
        .sort({ createdAt: -1 })  // Sort orders by createdAt in descending order
        .limit(3)  // Limit to the 3 most recent orders
        .populate({
            path: 'items.productId',
            select: 'name price variations',  // Fetch name, price, and variations
            populate: {
                path: 'variations',
                select: 'images',  // Fetch images field for each variation
            }
        });

        const subscriptions = await Subscription.find({userId: req.session.user.id, active: 'true'})
            .populate('productId')
            .sort({startDate: -1});

        res.render('profile', {
            user: user,
            quizResults,
            orders: orders,
            subscriptions
        });
    } catch (error) {
        console.error('Error fetching quiz results:', error);
        res.status(500).send('Error loading profile.');
    }
});

// Orders
app.get('/orders', async (req, res) => {
    try {
      const userId = req.session.user.id;
      const yearFilter = req.query.year;

      const years = [];
    for (let y = 2025; y >= 2018; y--) {
    years.push(y.toString());
    }
  
      let query = { userId };
      if (yearFilter) {
        const start = new Date(`${yearFilter}-01-01`);
        const end = new Date(`${parseInt(yearFilter) + 1}-01-01`);
        query.createdAt = { $gte: start, $lt: end };
      }
  
      // Fetch the 3 most recent orders for the user
      let orders = await Order.find(query)
      .sort({ createdAt: -1 })  // Sort orders by createdAt in descending order
      .populate({
          path: 'items.productId',
          select: 'name price variations',  // Fetch name, price, and variations
          populate: {
              path: 'variations',
              select: 'images',  // Fetch images field for each variation
          }
      });
  
      res.render('orders', { orders, selectedYear: yearFilter, years });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error loading orders");
    }
  });
  

app.post('/subscriptions/cancel/:id', async (req, res) => {
    try {
        const subscriptionId = req.params.id;

        const updated = await Subscription.findByIdAndUpdate(subscriptionId, {
            active: false
        });

        if (!updated) {
            return res.status(404).send('Subscription not found');
        }

        res.redirect('/profile'); 
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).send('Internal Server Error');
    }
});

// User Signup Route (with redirect to login page)
app.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.render('signup', {
                message: 'User already exists. Please log in or use a different email.',
                firstName,
                lastName,
                email,
            });
        }

        const newUser = new User({ firstName, lastName, email, password });
        await newUser.save();
        
        // Redirect to login page after successful signup
        return res.redirect('/login');

    } catch (error) {
        console.error('Error signing up user:', error);
        res.status(500).render('signup', {
            message: 'Error signing up. Please try again later.',
            firstName,
            lastName,
            email,
        });
    }
});


// User Login Route (with session and redirect )
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            const errorResponse = { message: 'Invalid email or password.', email };
            return req.xhr ? res.status(401).json(errorResponse) : res.render('login', errorResponse);
        }

        // Store user info in session
        req.session.user = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        };

        // Get stored redirect URL or default to '/profile'
        const redirectUrl = req.session.redirectUrl || '/profile';
        delete req.session.redirectUrl; // Clear it after use

        // Handle AJAX vs. normal form submission
        return req.xhr ? res.json({ redirect: redirectUrl }) : res.redirect(redirectUrl);

    } catch (error) {
        console.error('Error logging in user:', error);
        const errorResponse = { message: 'Error logging in user', email };
        return req.xhr ? res.status(500).json(errorResponse) : res.status(500).render('login', errorResponse);
    }
});




// User Logout Route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.redirect('/home'); // Redirect to home if logout fails
        }
        res.redirect('/login'); // Redirect to the login after logging out
    });
});

// Redirects user to previous page after loggin in
app.get('/protected-route', (req, res, next) => {
    if (!req.session.user) {
        console.log('in the protected-route');
        // Set redirect URL to subscription if coming from there
        const redirectUrl = req.headers.referer && req.headers.referer.includes('/subscription') || (req.headers.referer && req.headers.referer.includes('/products'))
            ? '/subscription' 
            : req.originalUrl;

        console.log('Redirecting to login, original URL:', redirectUrl);  // Log the redirect URL
        req.session.redirectUrl = redirectUrl; // Store the redirect URL in the session
        return res.redirect(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
    next();
});

// Check if user is logged in
app.get('/api/auth/check', (req, res) => {
    res.json({ isAuthenticated: !!req.session.user });
});

// Route to upload a product image
app.post('/upload', upload.array('images', 5), (req, res) => {
    if (!req.files) return res.status(400).send('No files uploaded.');

    const filePaths = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ filePaths });
});


// Cart Routes
app.use('/cart', cartRoutes);

// Quiz Routes
app.use('/quiz', quizRoutes);

// Products Routes
app.use('/products', productsRouter);

// Checkout Routes
app.use('/checkout', checkoutRoutes);

// User Box Routes
app.use('/user-box', userBoxRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Something went wrong');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));