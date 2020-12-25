//jshint esversion:6
const express = require('express')
const mongoose = require('mongoose')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const encrypt = require('mongoose-encryption')

const app = express();



app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(express.static('public'))
mongoose.connect('mongodb://localhost:27017/userDB',
    { useUnifiedTopology: true, useNewUrlParser: true }
)

const UserSchema = new mongoose.Schema({
    email: String,
    password: String
})
const Mysecret = 'donkopakarnamuskilhinahinamumkinhai';

UserSchema.plugin(encrypt, { secret: Mysecret, encrpytedFields:["password"] });

const User = new mongoose.model('User', UserSchema)



app.get('/', (req, res) => {
    res.render('home')
})
app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})


app.post('/register', (req, res) => {
    const email= req.body.username
    const password = req.body.password
    console.log(email,password)
    const user = new User({
        email: req.body.username,
        password: req.body.password
    })
    user.save((err) => {
        if (err) {
            res.send(err)
        } else {
            res.render('secrets')
        }
    })
})


app.post('/login', (req, res) => {
    const email = req.body.username
    const password = req.body.password
console.log(email,password)
    User.find({ email: email }, function (err, foundUser) {
        if (err) {
            res.send(err)
        } else {
            if (foundUser.password === password) {
                res.render('secrets')
            } else {
                res.send('Wrong Password/email')
            }
        }
    })
})
app.listen(3000, console.log('app is running on port 3000'))