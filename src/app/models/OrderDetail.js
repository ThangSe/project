const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OrderDetail = new Schema({
    discount: {type: Number, default: 0},
    price_after: {type: Number},
    order_id:{type: mongoose.Schema.Types.ObjectId, ref: "order"},
    service_id: {type: mongoose.Schema.Types.ObjectId, ref: "service"},
    amount_ser: {type: Number, default: 0}, 
    accessory_id: {type: mongoose.Schema.Types.ObjectId, ref: " accessory"},
    amount_acc: {type: Number, default: 0}
}, {
    timestamps: true,
})

module.exports = mongoose.model('orderdetail', OrderDetail)
