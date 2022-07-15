const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const Supplier = new Schema({
    name: {type: String, required: true},
    address: {type: String, required: true},
    phonenum: {type: String, required: true},
    accessories_id: [
        {type: mongoose.Schema.Types.ObjectId, ref:"accessory"}
    ]
}, {
    timestamps: true,
})
Supplier.plugin(mongooseDelete, {
    deletedAt : true, 
    overrideMethods: 'all'})

module.exports = mongoose.model('supplier', Supplier)
