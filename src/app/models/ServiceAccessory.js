const mongoose = require('mongoose')

const Schema = mongoose.Schema

const ServiceAccessory = new Schema({
    typeCom: {type: String, required: true},
    brandCom: {type: String, required: true},
    accessory_id: {type: mongoose.Schema.Types.ObjectId, ref:"accessory"},
    service_id: {type: mongoose.Schema.Types.ObjectId, ref:"service"}
}, {
    timestamps: true,
})

module.exports = mongoose.model('serviceaccessory',ServiceAccessory)
