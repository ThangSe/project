const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const Account = new Schema({
    username: {type: String, required: [true, 'Bạn phải nhập tài khoản'], unique: true},
    password: {type: String, required: [true, 'Bạn phải nhập mật khẩu']},
    status: {type: String, required: true, default: 'offline'},
    role: {type: String, required: true, default: 'customer'},
    refreshToken: {type: String},
    user_id: {type: mongoose.Schema.Types.ObjectId, ref:"user"},
    agency_id: {type: mongoose.Schema.Types.ObjectId, ref:"agency"},
    booking:[
        {type: mongoose.Schema.Types.ObjectId, ref:"booking"}
    ],
    workslot_id:[
        {type: mongoose.Schema.Types.ObjectId, ref:"workslot"}
    ]
}, {
    timestamps: true,
})
Account.plugin(mongooseDelete, {
    deletedAt : true, 
    overrideMethods: 'all'})

module.exports = mongoose.model('account', Account)