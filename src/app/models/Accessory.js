const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const Schema = mongoose.Schema

const Accessory = new Schema({
    name: {type: String, required: [true, 'Bạn phải nhập tên linh kiện']},
    price: {type: Number, required: [true, 'Bạn phải nhập giá linh kiện']},
    type: {type: String, required: [true, 'Bạn phải nhập loại PC hoặc Laptop']},
    component: {type: String, required: [true, 'Bạn phải nhập loại linh kiện']},
    description: {type: String, default: 'Chưa có mô tả chi tiết'},
    insurance: {type: String, required: [true, 'Bạn phải nhập hạn bảo hành cho linh kiện']},
    imgURL: {type: String},
    supplier_id: {type: mongoose.Schema.Types.ObjectId, ref:"supplier"},
    orderdetail_id: [
        {type: mongoose.Schema.Types.ObjectId, ref:"orderdetail"}
    ],
    serHasAcc: [
        {type: mongoose.Schema.Types.ObjectId, ref:"serviceaccessory"}
    ]
}, {
    timestamps: true,
})
Accessory.plugin(mongooseDelete, {
    deletedAt : true, 
    overrideMethods: 'all'})

module.exports = mongoose.model('accessory', Accessory)
