const Order = require("../models/Order")
const WorkSlot = require("../models/WorkSlot")
const Service = require("../models/Service")
const OrderDetail = require("../models/OrderDetail")
const Booking = require("../models/Booking")
const Accessory = require('../models/Accessory')
const mongoose = require("mongoose")
const Buffer = require('buffer/').Buffer
class OrderController {
    // GET order/test1
    async showAllServiceToChoose(req, res) {    
        try {
            const serviceNoAcc = await Service.find({hasAccessory: false})
            const serviceHasAcc = await Service.aggregate([
                {
                    $unwind: "$accessories_id"
                },
                {
                    $lookup: {
                        from: "accessories",
                        localField: "accessories_id",
                        foreignField: "_id",
                        as: "accessories_detail"
                    }
                }, 
                {
                    $project: {
                        _id: 0,
                        name: 1,
                        description: 1,
                        type: 1,
                        "accessories_detail._id": 1,
                        "accessories_detail.name": 1,
                        "accessories_detail.description": 1,
                        "accessories_detail.insurance": 1,
                        price: {$add: ["$price", {$toInt:{
                            $reduce: {
                                input: "$accessories_detail",
                                initialValue: "",
                                in: { $concat: [ "$$value", {$substr:["$$this.price", 0, -1]}]}
                            }
                        }}]}
                    }
                }
            ])
            res.status(200).json({serviceHasAcc, serviceNoAcc})
        } catch (err) {
            res.status(500).json(err)
        }
    }
    //POST /order/addDetailOrder/:id
    async addDetailOrder(req, res) {
        try {
            const order = await Order.findById(req.params.id)            
            const hasAccessory = req.body.hasAccessory
            const amountSer = req.body.amount_ser
            const amountAcc = req.body.amount_acc
            const discount = req.body.discount
            if(hasAccessory) {
                const orderDetail = new OrderDetail({
                    amount_ser: amountSer,
                    amount_acc: amountAcc,
                    discount,
                    accessory_id: req.body.accessory_id
                })
                const saveOrderDetail = await orderDetail.save()
                const accessory = await Accessory.findById(req.body.accessory_id).populate([{
                    path: 'service_id',
                    model: 'service',
                    select: 'name type price'
                }])
                await accessory.updateOne({$push: {orderdetail_id: saveOrderDetail.id}})
                await order.updateOne({$push: {orderDetails_id: saveOrderDetail.id}, $set: {status: 'Chờ xác nhận'}})
                const totalPrice = (amountAcc*accessory.price + amountSer*accessory.service_id.price)*(100-discount)/100
                const lastestDetail = await OrderDetail.findByIdAndUpdate(
                    {_id: saveOrderDetail.id}, 
                    {price_after: totalPrice, order_id: order.id, accessory_id: accessory.id }, 
                    {new: true}
                ).populate([{
                    path: 'accessory_id',
                    model: 'accessory',
                    select: 'name description insurance supplier_id service_id price',
                    populate: [{
                        path: 'supplier_id',
                        model: 'supplier',
                        select: 'name'
                    },
                    {
                        path: 'service_id',
                        model: 'service',
                        select: 'name description type price'
                    }
                ]
                }])
                res.status(200).json(lastestDetail)
            }
            else {
                const orderDetail = new OrderDetail({
                    amount_ser: amountSer,
                    discount,
                    service_id: req.body.service_id
                })
                const saveOrderDetail = await orderDetail.save()
                const service = await Service.findById(req.body.service_id)
                await service.updateOne({$push: {orderdetail_id: saveOrderDetail.id}})
                await order.updateOne({$push: {orderDetails_id: saveOrderDetail.id}, $set: {status: 'Chờ xác nhận'}})
                const totalPrice = (amountSer*service.price)*(100-discount)/100
                const lastestDetail = await OrderDetail.findByIdAndUpdate(
                    {_id: saveOrderDetail.id},
                    {price_after: totalPrice, order_id: order.id, service_id: service.id}, 
                    {new: true}
                ).populate([{
                    path: 'service_id',
                    model: 'service',
                    select: 'name description type price'
                }])
                res.status(200).json(lastestDetail)
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async getTotalPrice(req, res) {
        try {
            let price = 0
            const order = await Order.findById(req.params.id, 'orderDetails_id').populate([
                {
                    path: 'orderDetails_id',
                    model: 'orderdetail'
                }
            ])
            for (var item of order.orderDetails_id){
                price+= item.price_after
            }
            const updateOrder = await Order.findOneAndUpdate({_id:order.id}, {totalPrice: price}, {new: true}).populate([{
                path: 'orderDetails_id',
                model: 'orderdetail'
            }])
            res.status(200).json(updateOrder)

        } catch (err) {
            res.status(500).json(err)
        }
    }

    showAllOrder(req, res, next) {
        Order.aggregate([{$project: {
            status : 1
        }}])
            .then(orders => {
                res.json(orders)
            })
            .catch(next)
    }

    showLastestOrder (req, res, next) {
        Order.find().sort({_id:-1}).limit(10)
            .then(orders => {
                res.json(orders)
            })
            .catch(next)
    }

    async getOrderByStaff (req, res) {
        try {
            const orderId = req.params.id
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const workSlot = await WorkSlot.findOne({staff_id: acc_id, order_id: orderId})
            const order = await Order.findOne({work_slot: workSlot.id})
            res.status(200).json(order)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async getOrderByIdForCus (req, res) {
        try {
             const orderId = req.params.id
             const token = req.headers.token
             const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
             const acc_id = accountInfo.id
             const booking = await Booking.findOne({acc_id: acc_id})
             const order = await Order.findOne({_id: orderId, booking_id: booking.id}).populate([
                {
                    path: 'orderDetails_id',
                    model: 'orderdetail'
                }
             ])
             res.status(200).json(order)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    searchOrderById(req, res, next) {
        Order.findById(req.params.id).populate([{
            path: 'orderDetails_id',
            model: 'orderdetail',
            populate:[
                {
                    path: 'service_id',
                    model: 'service',
                    select: 'name description type price hasAccessory'
                },
                {
                    path: 'accessory_id',
                    model: 'accessory',
                    select: 'name description insurance price service_id supplier_id',
                    populate:[
                        {
                            path: 'service_id',
                            model: 'service',
                            select: 'name description type price hasAccessory'
                        },
                        {
                            path: 'supplier_id',
                            model: 'supplier',
                            select: 'name'
                        }
                    ]
                }
            ]
        }])
            .then(order => {
                res.json(order)
            })
            .catch(next)
    }
    async updateOrderById(req, res) {
        try {
            const order = await Order.findById(req.params.id)
            await order.updateOne({$set: req.body})
            res.status(200).json("Cập nhật thành công")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async acceptOrder(req, res) {
        try {
            const order = await Order.findById(req.body.id)
            if(order.status == 'Chờ xác nhận'){
                await order.updateOne({$set: {status: 'Đã xác nhận'}})
                res.status(200).json("Đơn hàng đã được xác nhận")
            }
            else {
                res.status(404).json("Đơn hàng không ở trạng thái chờ")
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async cancelOrder(req, res) {
        try {
            const order = await Order.findById(req.body.id)
            await order.updateOne({$set: {status: 'Hủy'}})
            res.status(200).json("Đơn hàng đã bị hủy")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async completeOrder(req, res) {
        try {
            const order = await Order.findById(req.body.id)
            await order.updateOne({$set: {status: 'Hoàn thành'}})
            res.status(200).json("Đơn hàng đã hoàn thành")
        } catch (err) {
            res.status(500).json(err)
        }
    }
}

module.exports = new OrderController()
 