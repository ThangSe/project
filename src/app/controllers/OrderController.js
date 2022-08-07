const Order = require("../models/Order")
// const OrderDetail = require("../models/OrderDetail")
const Service = require("../models/Service")
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
    //POST /order/addDetailOrder
    async addDetailOrder(req, res) {
        try {
            //    const insertDetail = OrderDetail.insertMany(req.body)
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

    searchOrderById(req, res, next) {
        Order.findById(req.params.id)
            .then(order => {
                res.json(order)
            })
            .catch(next)
    }
    async updateOrderById(req, res) {
        try {
            const order = await Order.findById(req.params.id)
            await order.updateOne({$set: req.body})
            res.status(200).json("Update successfully")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async acceptOrder(req, res) {
        try {
            const order = await Order.findById(req.body.id)
            await order.updateOne({$set: {status: 'pending'}})
            res.status(200).json("Accepted")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async cancelOrder(req, res) {
        try {
            const order = await Order.findById(req.body.id)
            await order.updateOne({$set: {status: 'cancel'}})
            res.status(200).json("Cancel")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async completeOrder(req, res) {
        try {
            const order = await Order.findById(req.body.id)
            await order.updateOne({$set: {status: 'completed'}})
            res.status(200).json("Completed")
        } catch (err) {
            res.status(500).json(err)
        }
    }
}

module.exports = new OrderController()
 