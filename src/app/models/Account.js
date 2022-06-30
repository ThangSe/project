const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const Account = new Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    status: {type: String, required: true, default: 'offline'},
    role: {type: String, required: true, default: 'customer'},
    refreshToken: {type: String},
    user_id: {type: mongoose.Schema.Types.ObjectId}
}, {
    timestamps: true,
})
Account.plugin(mongooseDelete, {
    deletedAt : true, 
    overrideMethods: 'all'})

module.exports = mongoose.model('Account', Account)