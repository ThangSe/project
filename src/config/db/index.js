const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config()

async function connect() {
    try {
        await mongoose.connect(process.env.DB_CONNECTION, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000
        })
        console.log('Connect success')
    } catch (error) {
        console.log('Connect fail')
    }
}

module.exports = { connect }