const jwt = require('jsonwebtoken')
require('dotenv').config()
const bookingRouter = require('./booking')
const authRouter = require('./auth')

function route(app) {
    app.use('/auth', authRouter)
    app.use('/booking', bookingRouter) 
    app.use((req, res, next) => {
        res.status(404)
        res.json({
            status:404,
            message: 'Not found!'
        })
    })
    app.use((err, req, res, next) => {
        res.status(err.status || 500)
        res.json({
            status: err.status || 500,
            message: err.message
        })
    })
}

module.exports = route
