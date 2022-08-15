const mongoose = require('mongoose')

const Schema = mongoose.Schema

const Agency = new Schema({
    name: {type: String, required: true},
    status: {type: String, required: true},
    phonenum: {type: String, required: true},
    address: {
        city: {type: String, required: true},
        district: {type: String, required: true},
        ward: {type: String, required: true},
        street: {type: String, required: true} 
    },
    staff_id:[
        {type: mongoose.Schema.Types.ObjectId, ref:"account"}
    ],
    admin_id:[
        {type: mongoose.Schema.Types.ObjectId, ref:"account"}
    ],
    booking_id: [
        {type: mongoose.Schema.Types.ObjectId, ref:"booking"}
    ]
}, {
    timestamps: true,
})

module.exports = mongoose.model('agency', Agency)
