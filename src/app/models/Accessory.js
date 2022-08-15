const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const Accessory = new Schema({
    name: {type: String, required: true},
    price: {type: Number},
    description: {type: String, required: true},
    insurance: {type: String, required: true},
    supplier_id: {type: mongoose.Schema.Types.ObjectId, ref:"supplier"},
    orderdetail_id: [
        {type: mongoose.Schema.Types.ObjectId, ref:"orderdetail"}
    ]
}, {
    timestamps: true,
})
Accessory.plugin(mongooseDelete, {
    deletedAt : true, 
    overrideMethods: 'all'})

module.exports = mongoose.model('accessory', Accessory)
