const Order = require("../models/Order")
const Buffer = require('buffer/').Buffer
class OrderController {
    showAllOrder(req, res, next) {
       Order.find({})
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
            const booking = await Booking.findById(req.body.id)
            await booking.updateOne({$set: {status: 'accepted'}})
            const order = new Order()
            const saveOrder = await order.save()
            const updateOrder = await Order.findById(saveOrder.id)
            await updateOrder.updateOne({$set: {booking_id: booking.id}})
            res.status(200).json("Accepted")
        } catch (err) {
            res.status(500).json(err)
        }
    }
}

module.exports = new OrderController()
 