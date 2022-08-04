const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");
require("dotenv").config();

// create cors before sessions

const session = require('express-session');
const flash = require('connect-flash');
const FileStore = require('session-file-store')(session);
const csrf = require('csurf');

// create an instance of express app
let app = express();

// set the view engine
app.set("view engine", "hbs");

// static folder
app.use(express.static("public"));

// set up sessions
app.use(session({
  store: new FileStore(),
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true
}))

app.use(flash())

// register flash middleware
app.use(function (req, res, next) {
  res.locals.success_messages = req.flash("success_messages");
  res.locals.error_messages = req.flash("error_messages");
  next();
})

// setup wax-on
wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

// enable forms
app.use(
  express.urlencoded({
    extended: false
  })
);

// share the user data with hbs files
app.use(function(req,res,next){
  res.locals.user = req.session.user;
  next();
})

// enable CSRF
// app.use(csrf());
const csurfInstance = csrf();
app.use(function(req,res,next){
  if (req.url === '/checkout/process_payment' || req.url.slice(0,5) == "/api/") {
    return next();
  }
  csurfInstance(req,res,next);
})

// Share CSRF with hbs files
app.use(function(req,res,next){
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use(function (err,req,res,next){
  if (err && err.code == "EBADCSRFTOKEN") {
    req.flash('error_messages', 'The form has expired. Please try again');
    res.redirect('back');
  } else {
    next();
  }
})

const landingRoutes = require('./routes/landing');
const postersRoutes = require('./routes/posters');
const usersRoutes = require('./routes/users');
const cloudinaryRoutes = require('./routes/cloudinary');
const shoppingCartRoutes = require('./routes/shoppingCart')
const { checkIfAuthenticated } = require('./middlewares');
const checkoutRoutes = require('./routes/checkout');
const api = {
  posters: require('./routes/api/posters')
}

async function main() {
   app.use('/', landingRoutes);
   app.use('/posters', postersRoutes);
   app.use('/users',usersRoutes );
   app.use('/cloudinary', cloudinaryRoutes);
   app.use('/cart', shoppingCartRoutes);
   app.use('/checkout', checkoutRoutes);
   app.use('/api/posters', express.json(), api.posters);
}



main();

app.listen(3301, () => {
  console.log("Server has started");
});

