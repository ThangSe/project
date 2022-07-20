const mongoose = require('mongoose')

const Schema = mongoose.Schema

const Order = new Schema({
    totalPrice: {type: Number},
    status: {type: String, default: 'pending'},
    orderDetails_id:[{type: mongoose.Schema.Types.ObjectId, ref: "orderdetails"}],
    booking_id: {type: mongoose.Schema.Types.ObjectId, ref: "booking"}
}, {
    timestamps: true,
})

module.exports = mongoose.model('order', Order)