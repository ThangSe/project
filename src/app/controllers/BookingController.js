const Booking = require('../models/Booking')
const Account =require("../models/Account")
const Buffer = require('buffer/').Buffer
class BookingController {
    show(req, res, next) {
       Booking.find({})
        .then(bookings => {
            res.json(bookings)
        })
        .catch(next)
    }

    search(req, res, next) {
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
}

module.exports = new BookingController()
 