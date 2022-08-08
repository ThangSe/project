const mongoose = require('mongoose')

const Schema = mongoose.Schema

const OrderDetail = new Schema({
    amount_ser: {type: Number, default: 1},
    amount_acc: {type: Number, default: 0},
    discount: {type: Number},
    price_after: {type: Number},
    order_id:{type: mongoose.Schema.Types.ObjectId, ref: "order"},
    service_id: {type: mongoose.Schema.Types.ObjectId, ref: "service"},
    accessory_id: {type: mongoose.Schema.Types.ObjectId, ref: "accessory"}
}, {
    timestamps: true,
})

module.exports = mongoose.model('orderdetail', OrderDetail)
