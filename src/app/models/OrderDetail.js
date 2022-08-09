const mongoose = require('mongoose')

const Schema = mongoose.Schema

const OrderDetail = new Schema({
    amount_ser: {type: Number, default: 1}, 
    discount: {type: Number},
    price_after: {type: Number},
    order_id:{type: mongoose.Schema.Types.ObjectId, ref: "order"},
    service_id: {type: mongoose.Schema.Types.ObjectId, ref: "service"},
    accessories: [{
        accessory_id: {type: mongoose.Schema.Types.ObjectId, ref: "accessory"},
        amount_acc: {type: Number, default: 0}
    }  
    ]
}, {
    timestamps: true,
})

module.exports = mongoose.model('orderdetail', OrderDetail)
