const mongoose = require('mongoose')

const Schema = mongoose.Schema

const Slot = new Schema({
    slot: {type: Number, required: true},
    start: {type: Number, required: true},
    end: {type: Number, required: true},
    max_per: {type: Number, required: true, default: 3},
    status: {type: String, required: true, default: 'Available'},
    work_slot: [{type: mongoose.Schema.Types.ObjectId, ref:"workslot"}],
    schedule_id: {type: mongoose.Schema.Types.ObjectId, ref:"schedule"}
}, {
    timestamps: true,
})

module.exports = mongoose.model('slot', Slot)
