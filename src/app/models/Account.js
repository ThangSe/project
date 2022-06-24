const mongoose = require('mongoose')

const Schema = mongoose.Schema

const Account = new Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    status: {type: String, required: true, default: 'offline'},
    role: {type: String, required: true, default: 'customer'},
    user_id: {type: mongoose.Schema.Types.ObjectId}
}, {
    timestamps: true,
})

module.exports = mongoose.model('Account', Account)