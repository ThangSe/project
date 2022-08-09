const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const helmet = require('helmet')
const morgan =require('morgan')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
var startOfWeek = require('date-fns/startOfWeek')
var endOfWeek = require('date-fns/endOfWeek')

const route = require('./src/routes')
const db =require('./src/config/db')

const app = express()

db.connect()

const start = startOfWeek(new Date(), {weekStartsOn: 1})
console.log(start)

//app.use(helmet())
app.use(methodOverride('_method'))
app.use(bodyParser.json({limit:"50mb"}))
const whitelist = ['http://localhost:3000', 'https://computer-services.netlify.app/', 'https://computer-services-api.herokuapp.com/', 'http://localhost:5000']
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if(!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)     
    }
    else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(cors(corsOptions))
app.use(cookieParser())
app.use(morgan('common'))
app.use(express.json())
app.use(
    express.urlencoded({
        extended: true,
    }),
)

const PORT = process.env.PORT || 2000

route(app)

app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`)
})
