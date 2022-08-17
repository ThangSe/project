const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const SerHasAcc = new Schema({
    type: {type: String, required: true},
    brand: {type: String, required: true},
    price: {type: Number, required: true},
    hasAccessory: {type: Boolean, required:true, default: false}
}, {
    timestamps: true,
})
Service.plugin(mongooseDelete, {
    deletedAt : true, 
    overrideMethods: 'all'})

module.exports = mongoose.model('service', Service)
