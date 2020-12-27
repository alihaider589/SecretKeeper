//jshint esversion:6
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const ejs = require('ejs')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const bodyParser = require('body-parser')
const encrypt = require('mongoose-encryption')
const bycrypt = require('bcrypt')
const findOrCreate = require('mongoose-findorcreate')
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();


app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(session({
    secret: 'Our Little Secret',
    resave: false,
    saveUninitialized: false
}
))
app.use(passport.initialize())
app.use(passport.session())
mongoose.connect('mongodb://localhost:27017/userDB',
    { useUnifiedTopology: true, useNewUrlParser: true }
)
mongoose.set('useCreateIndex', true)

const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
})

UserSchema.plugin(passportLocalMongoose)
UserSchema.plugin(findOrCreate)

const User = new mongoose.model('User', UserSchema)
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get('/', (req, res) => {
    res.render('home')
})


app.get('/auth/google', (req, res) => {
    passport.authenticate('google', { scope: ['profile'] })
})
app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})

//  BYCRYPT METHOD


// app.post('/register', (req, res) => {
//     const email = req.body.username
//     const password = req.body.password
//     bycrypt.hash(password, 10, function (err, has) {

//         const user = new User({
//             email: req.body.username,
//             password: has
//         })
//         user.save((err) => {
//             if (err) {
//                 res.send(err)
//             } else {
//                 res.render('secrets')
//             }
//         })
//     })


// })


// BCRYPT METHOD

// app.post('/login', (req, res) => {
//     const email = req.body.username
//     const password = req.body.password
//     console.log(email, password)
//     User.findOne({ email: email }, function (err, foundUser) {
//         if (foundUser) {
//             bycrypt.compare(password, foundUser.password, function (err, result) {
//                 if (result === true) {
//                     res.render('secrets')
//                 }
//             })
//         }
//     }
//     )
// })



app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        User.find({ "secret": { $ne: null } }, (err, foundUser) => {
            if (err) {
                console.log(err)
            } else {
                if (foundUser) {
                    res.render('secrets', { usersWithSecret: foundUser })
                }
            }
        })
    } else {
        res.redirect('/login')
    }
})
app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('submit')
    } else {
        res.redirect('/login')
    }
})

app.post('/submit', (req, res) => {
    const submittedSecret = req.body.secret

    User.findById(req.user.id, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret
                foundUser.save(() => {
                    res.redirect('/secrets')
                }
                )

            } else {
                res.send('No User Found')
            }
        }
    })
})


app.post('/register', (req, res) => {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
})
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/')
})
app.post('/login', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, function (err) {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/secrets')
            })
        }
    })
})

app.listen(3000, console.log('app is running on port 3000'))