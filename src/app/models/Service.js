const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const Service = new Schema({
    name: {type: String, required: true},
    price: {type: Number},
    description: {type: String, required: true},
    type: {type: String, required: true},
    price: {type: Number, required: true},
    hasAccessory: {type: Boolean, required:true, default: false},
    orderdetail_id: [
        {type: mongoose.Schema.Types.ObjectId, ref:"orderdetail"}
    ],
    accessories_id: [
        {type: mongoose.Schema.Types.ObjectId, ref:"accessory"}
    ]
}, {
    timestamps: true,
})
Service.plugin(mongooseDelete, {
    deletedAt : true, 
    overrideMethods: 'all'})

module.exports = mongoose.model('service', Service)
