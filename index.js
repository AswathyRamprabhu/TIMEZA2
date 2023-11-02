require('dotenv').config();
const express = require('express')
const crypto = require('crypto');
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const Swal =  require('sweetalert2')
const bcrypt = require('bcrypt')
const logger = require('morgan')
const dbConnect = require('./config/dbConnection')
const session = require('express-session')
const secret = require('./config/config');

dbConnect(err => {
    if (err) console.log("Connection with Database failed")
})

const userRoute = require('./routes/userRoutes')
const adminRoute = require('./routes/adminRoutes')


app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('Generated session secret key:', sessionSecret);

const config = require('./config/config')


app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
    secret: secret.sessionSecret,
    cookie: { maxAge: 1800000 },
    saveUninitialized: true,
    resave: false
}))
app.use(logger('dev'));

app.use('/', userRoute)
app.use('/admin', adminRoute)

app.get('/admin/login', (req, res) => {
    const error = 'Your error message here'; // Replace with your actual error message
    console.log('Passing error to template:', error); // Debugging line
    res.render('admin/adminLogin', { error });
});




app.listen(3000, function () {
    console.log("Server Started at port 3000...")
})
module.exports = app;