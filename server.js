const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const helmet = require('helmet')
const morgan =require('morgan')
const mongoose = require('mongoose')

const route = require('./src/routes')
const db =require('./src/config/db')

const app = express()

db.connect()

//app.use(helmet())
app.use(cors())
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