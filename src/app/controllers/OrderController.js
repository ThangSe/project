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
            const discount = req.body.discount
            const listAccId = req.body.accessories
            const serId = req.body.service_id
            var priceAcc = 0
            if(hasAccessory) {
                const orderDetail = new OrderDetail({
                    amount_ser: amountSer,
                    discount,
                    accessories: req.body.accessories
                })
                const saveOrderDetail = await orderDetail.save()
                listAccId.forEach(async function(e){
                    const accessory = await Accessory.findById(e.accessory_id)
                    priceAcc+=(accessory.price*e.amount_acc)
                    await accessory.updateOne({$push: {orderdetail_id: saveOrderDetail.id}})
                })
                const service = await Service.findById(serId)
                await service.updateOne({$push: {orderdetail_id: saveOrderDetail.id}})              
                await order.updateOne({$push: {orderDetails_id: saveOrderDetail.id}, $set: {status: 'Chờ xác nhận'}})
                const totalPrice = (priceAcc + amountSer*service.price)*(100-discount)/100
                const lastestDetail = await OrderDetail.findByIdAndUpdate(
                    {_id: saveOrderDetail.id}, 
                    {price_after: totalPrice, order_id: order.id, accessories: listAccId, service_id: service.id}, 
                    {new: true}
                )
                res.status(200).json(lastestDetail)
            }
            else {
                const orderDetail = new OrderDetail({
                    amount_ser: amountSer,
                    discount,
                    service_id: serId
                })
                const saveOrderDetail = await orderDetail.save()
                const service = await Service.findById(serId)
                await service.updateOne({$push: {orderdetail_id: saveOrderDetail.id}})
                await order.updateOne({$push: {orderDetails_id: saveOrderDetail.id}, $set: {status: 'Chờ xác nhận'}})
                const totalPrice = (amountSer*service.price)*(100-discount)/100
                const lastestDetail = await OrderDetail.findByIdAndUpdate(
                    {_id: saveOrderDetail.id},
                    {price_after: totalPrice, order_id: order.id, service_id: service.id}, 
                    {new: true}
                )
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
    async showOrderForStaff(req, res) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const orders = await WorkSlot.find({staff_id: acc_id, order_id: {$exists: true}}, {_id: 0, oder_id: 1}).populate([{
                path: 'order_id',
                model: 'order',
                populate: {
                    path: 'booking_id',
                    model: 'booking',
                    populate: {
                        path: 'acc_id',
                        model: 'account',
                        select: 'user_id',
                        populate: {
                            path: 'user_id',
                            model: 'user',
                            select: 'name'
                        }
                    }
                }
            },
            {
                path: 'staff_id',
                model: 'account',
                select: 'user_id',
                populate: {
                    path: 'user_id',
                    model: 'user',
                    select: 'name'
                }
            }
        ])
            res.status(200).json(orders)
        } catch (err) {
            res.status(500).json(err)
        }
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
             const order = await Order.findOne({_id: orderId}).populate([
                {
                    path: 'orderDetails_id',
                    model: 'orderdetail',
                    populate: [
                        {
                            path: 'service_id',
                            model: 'service',
                            select: 'name price hasAccessory'
                        }
                    ]
                },
                {
                    path: 'booking_id',
                    model: 'booking',
                    select: 'acc_id',
                    match: {
                        acc_id: {$eq: acc_id}
                    }
                },
                {
                    path: 'work_slot',
                    model: 'workslot',
                    select : 'staff_id',
                    populate: {
                        path: 'staff_id',
                        model: 'account',
                        select: 'user_id',
                        populate: {
                            path: 'user_id',
                            model: 'user',
                            select: ' name'
                        }
                    }
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
                await order.updateOne({$set: {status: 'Quản lí xác nhận'}})
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
 