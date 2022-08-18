const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const Accessory = new Schema({
    name: {type: String, required: true},
    price: {type: Number},
    type: {type: String}, // loai may tinh
    component: {type: String},
    description: {type: String, required: true},
    insurance: {type: String, required: true},
    imgURL: {type: String},
    supplier_id: {type: mongoose.Schema.Types.ObjectId, ref:"supplier"},
    orderdetail_id: [
        {type: mongoose.Schema.Types.ObjectId, ref:"orderdetail"}
    ],
    serHasAcc: [
        {type: mongoose.Schema.Types.ObjectId, ref:"serviceaccessory"}
    ]
}, {
    timestamps: true,
})
Accessory.plugin(mongooseDelete, {
    deletedAt : true, 
    overrideMethods: 'all'})

module.exports = mongoose.model('accessory', Accessory)
