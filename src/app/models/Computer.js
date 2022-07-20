const mongoose = require('mongoose')

const Schema = mongoose.Schema

const Computer = new Schema({
    name: {type: String, required: true},
    code: {type: String},
    type: {type: String, required: true},
    brand: {type: String, default: ""},
    order: [
        {type: mongoose.Schema.Types.ObjectId, ref: "order"}
    ],
}, {
    timestamps: true,
})  

module.exports = mongoose.model('computer', Computer)