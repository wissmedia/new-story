const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const passport = require('passport')
const session = require('express-session')
const methodOverride = require('method-override')
const MongoStore = require('connect-mongo')
const connectDB = require('./config/db')

// Load Config
dotenv.config({ path: './config/config.env' })

// Passport Config
require('./config/passport')(passport)

connectDB()

const app = express()

// Body Parser
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Method Override
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method
      delete req.body._method
      return method
    }
  })
)

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Helpers
// const {formatDate} = require('./helpers/helper')
app.locals.moment = require('moment')
app.locals.truncate = function (str, len) {
  if (str.length > len && str.length > 0) {
    let new_str = str + ' '
    new_str = str.substr(0, len)
    new_str = str.substr(0, new_str.lastIndexOf(' '))
    new_str = new_str.length > 0 ? new_str : str.substr(0, len)
    return new_str + '...'
  }
  return str
}
app.locals.stripTags = function (input) {
  return input.replace(/<(?:.|\n)*?>/gm, '')
}
app.locals.editIcon = function (storyUser, loggedUser, storyId, floating = true) {
  if (storyUser._id.toString() == loggedUser._id.toString()) {
    if (floating) {
      return `<a href="/stories/edit/${storyId}" class="btn-floating halfway-fab blue"><i class="fas fa-edit fa-small"></i></a>`
    } else {
      return `<a href="/stories/edit/${storyId}"><i class="fas fa-edit"></i></a>`
    }
  } else {
    return ''
  }
}

app.locals.select = function (selected, option) {
  return (selected == option) ? 'selected="selected"' : ''
}

// app.locals.select = function (selected, options) {
//   return options
//     .fn(this)
//     .replace(
//       new RegExp(' value="' + selected + '"'),
//       '$& selected="selected"'
//     )
//     .replace(
//       new RegExp('>' + selected + '</option>'),
//       ' selected="selected"$&'
//     )
// }

// EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')

// Sessions
app.use(session({
  secret: 'pink keyboard',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Set global var
app.use(function (req, res, next) {
  res.locals.user = req.user || null
  next()
})

// Static Folder
app.use(express.static(path.join(__dirname, 'public')))

// Routes
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/story'))

const PORT = process.env.PORT || 3000

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`))