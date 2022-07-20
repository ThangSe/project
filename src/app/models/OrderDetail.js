const mongoose = require('mongoose')

const Schema = mongoose.Schema

const Order = new Schema({
    amount: {type: Number},
    discount: {type: Number},
    order_id:{type: mongoose.Schema.Types.ObjectId, ref: "order"},
    service_id: {type: mongoose.Schema.Types.ObjectId, ref: "service"}
}, {
    timestamps: true,
})

module.exports = mongoose.model('order', Order)