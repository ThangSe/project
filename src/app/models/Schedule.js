const mongoose = require('mongoose')

const Schema = mongoose.Schema

const Schedule = new Schema({
    date: {type: Date, required: true},
    slots: [
        {type: mongoose.Schema.Types.ObjectId, ref:"slot"}
    ],
    status: {type: String, required: true, default: 'open'}
}, {
    timestamps: true,
})

module.exports = mongoose.model('schedule', Schedule)
