const mongoose = require('mongoose')

const Schema = mongoose.Schema

const WorkSlot = new Schema({
    slot_id: {type: mongoose.Schema.Types.ObjectId, ref:"slot"},
    staff_id: {type: mongoose.Schema.Types.ObjectId, ref:"account"},
    order_id: {type: mongoose.Schema.Types.ObjectId, ref:"order"}
}, {
    timestamps: true,
})

module.exports = mongoose.model('workslot', WorkSlot)
