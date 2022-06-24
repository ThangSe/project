const mongoose = require('mongoose')

const Schema = mongoose.Schema

const User = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    address: {
        city: {type: String, required: true},
        district: {type: String, required: true},
        ward: {type: String, required: true},
        street: {type: String, required: true}
    },
    phonenum: {type: String, required: true},
    birth: {type: Date, required: true},
    img: {type: String, required: true}
}, {
    timestamps: true,
})

module.exports = mongoose.model('User', User)