const mongoose = require('mongoose')

const Schema = mongoose.Schema

const Order = new Schema({
    totalPrice: {type: Number},
    status: {type: String, default: 'waiting'},
    orderDetails_id:[{type: mongoose.Schema.Types.ObjectId, ref: "orderdetails"}],
    booking_id: {type: mongoose.Schema.Types.ObjectId, unique:true, ref: "booking"},
    work_slot:[
        {type: mongoose.Schema.Types.ObjectId, ref:"workslot"}
    ]
}, {
    timestamps: true,
})

module.exports = mongoose.model('order', Order)