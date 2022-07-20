const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const Service = new Schema({
    name: {type: String, required: [true, 'Bạn phải nhập tên dịch vụ'], unique: true},
    description: {type: String, default: 'Chưa có mô tả chi tiết'},
    type: {type: String, required: [true, 'Bạn phải nhập loại dịch vụ']},
    price: {type: Number, required: [true, 'Bạn phải nhập giá tiền dịch vụ']},
    brand: {type: String, default:''},
    hasAccessory: {type: Boolean, required:true, default: false},
    serHasAcc: [
        {type: mongoose.Schema.Types.ObjectId, ref:"serviceaccessory"}
    ],
    orderdetail_id: [
        {type: mongoose.Schema.Types.ObjectId, ref:"orderdetail"}
    ]
}, {
    timestamps: true,
})
Service.plugin(mongooseDelete, {
    deletedAt : true, 
    overrideMethods: 'all'})

module.exports = mongoose.model('service', Service)
