const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const Service = new Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    type: {type: String, required: true}, //type: loai dich vu
    price: {type: Number, required: true},
    brand: {type: String, required: true}, // lam cho 1 nhan hieu cu the
    hasAccessory: {type: Boolean, required:true, default: false},
    serHasAcc: [
        {type: mongoose.Schema.Types.ObjectId, ref:"serviceaccessory"}
    ],
    orderdetail_id: [
        {type: mongoose.Schema.Types.ObjectId, ref:"orderdetail"}
    ]
}, {
    timestamps: true,
})
Service.plugin(mongooseDelete, {
    deletedAt : true, 
    overrideMethods: 'all'})

module.exports = mongoose.model('service', Service)
