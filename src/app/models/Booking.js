const mongoose = require('mongoose')

const Schema = mongoose.Schema

const Booking = new Schema({
    cus_name: {type: String, required: true},
    services: {type: Array, required: true},
    description: {type: String},
    type: {type: String, required: true},
    cus_address: {
        city: {type: String, required: true},
        district: {type: String, required: true},
        ward: {type: String, required: true},
        street: {type: String, required: true}
    },
    time: {type: Date},
    status: {type: String, required: true},
    phonenum: {type: String, required: true},
    acc_id: {type: mongoose.Schema.Types.ObjectId, ref: "account"},
    order_id: {type: mongoose.Schema.Types.ObjectId, ref: "order"}
}, {
    timestamps: true,
})

module.exports = mongoose.model('booking', Booking)