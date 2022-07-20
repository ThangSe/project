const Booking = require('../models/Booking')
const Account = require("../models/Account")
const Order = require("../models/Order")
const Buffer = require('buffer/').Buffer
class BookingController {
    showAllBooking(req, res, next) {
       Booking.find({})
        .then(bookings => {
            res.json(bookings)
        })
        .catch(next)
    }

    showAllBookingByAccount (req, res, next) {
        const token = req.headers.token
        const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        const acc_id = accountInfo.id
        Booking.find({acc_id: acc_id})
            .then(bookings => {
                res.json(bookings)
            })
            .catch(next)
    }

    showAllBookingByStatus (req, res, next) {
        const status = req.body.status
        Booking.find({status: status})
            .then(bookings => {
                res.json(bookings)
            })
            .catch(next)
    }

    showLastestBooking (req, res, next) {
        const status = req.body.status
        Booking.find({status: status}).sort({_id:-1}).limit(10)
            .then(bookings => {
                res.json(bookings)
            })
            .catch(next)
    }

    searchBookingById(req, res, next) {
        Booking.findById(req.params.id).populate({
            path: 'acc_id',
            select: 'username'
        })
            .then(booking => {
                res.json(booking)
            })
            .catch(next)
    }

    async create(req, res) {
        try {
             const token = req.headers.token
             const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
             const acc_id = accountInfo.id
             const booking = new Booking(req.body)
             const saveBooking = await booking.save()
             const updateBooking = await Booking.findById(saveBooking.id)
             await updateBooking.updateOne({$set: {acc_id: acc_id}})
             if(acc_id) {
                const account =  Account.findById(acc_id)
                await account.updateOne({$push: {booking: saveBooking._id}}) 
             }
             res.status(200).json(saveBooking)
        } catch (err) {
            res.status(500).json(err)
        }
        
    }
    async updateBookingById(req, res) {
        try {
            const booking = await Booking.findById(req.params.id)
            await booking.updateOne({$set: req.body})
            res.status(200).json("Update successfully")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async acceptBooking(req, res) {
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

module.exports = new BookingController()
 