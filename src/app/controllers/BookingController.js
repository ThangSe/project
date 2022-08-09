const Booking = require('../models/Booking')
const Account = require("../models/Account")
const Order = require("../models/Order")
const Buffer = require('buffer/').Buffer
class BookingController {
    async showAll (req, res) {
        try {
            const {page = 1, limit = 10} = req.query
            const sort = req.query.sort
            let bookings = await Booking.find().limit(limit * 1).skip((page - 1) * limit)
            let count = await Booking.find().count()/10
            if(sort == "desc" && !req.query.status) {
                bookings = await Booking.find().sort({_id:-1}).limit(limit * 1).skip((page - 1) * limit)
                return res.status(200).json({count: Math.ceil(count), bookings})
            }
            else if(req.query.status) {
                var flag = 1
                if(sort == "desc") {
                    flag = -1
                    bookings = await Booking.find({status:req.query.status}).sort({_id: flag}).limit(limit * 1).skip((page - 1) * limit)
                    count = await Booking.find({status:req.query.status}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }
                else {
                    bookings = await Booking.find({status:req.query.status}).sort({_id: flag}).limit(limit * 1).skip((page - 1) * limit)
                    count = await Booking.find({status:req.query.status}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }      
            }
            else {
                return res.status(200).json({count: Math.ceil(count), bookings})
            }

        } catch (err) {
            res.status(500).json(err)
        }
    }

    async showAllBookingWithOrderInfo (req, res) {
        try {
            const {page = 1, limit = 10} = req.query
            const sort = req.query.sort
            let bookings = await Booking.find().limit(limit * 1).skip((page - 1) * limit).populate([
                {
                    path: 'order_id',
                    model: 'order',
                    select: 'status'
                }
            ])
            let count = await Booking.find().count()/10
            if(sort == "desc" && !req.query.status) {
                bookings = await Booking.find().sort({_id:-1}).limit(limit * 1).skip((page - 1) * limit).populate([
                    {
                        path: 'order_id',
                        model: 'order',
                        select: 'status'
                    }
                ])
                return res.status(200).json({count: Math.ceil(count), bookings})
            }
            else if(req.query.status) {
                var flag = 1
                if(sort == "desc") {
                    flag = -1
                    bookings = await Booking.find({status:req.query.status}).sort({_id: flag}).limit(limit * 1).skip((page - 1) * limit).populate([
                        {
                            path: 'order_id',
                            model: 'order',
                            select: 'status'
                        }
                    ])
                    count = await Booking.find({status:req.query.status}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }
                else {
                    bookings = await Booking.find({status:req.query.status}).sort({_id: flag}).limit(limit * 1).skip((page - 1) * limit).populate([
                        {
                            path: 'order_id',
                            model: 'order',
                            select: 'status'
                        }
                    ])
                    count = await Booking.find({status:req.query.status}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }      
            }
            else {
                return res.status(200).json({count: Math.ceil(count), bookings})
            }

        } catch (err) {
            res.status(500).json(err)
        }
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

    async getBookingByIdForCus(req, res) {
        try {
             const bookingId = req.params.id
             const token = req.headers.token
             const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
             const acc_id = accountInfo.id
             const booking = await Booking.findOne({_id: bookingId, acc_id: acc_id}).populate([{
                path: 'order_id',
                model: 'order'
             }])
             res.stauts(200).json(booking)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async createBookingCustomer(req, res) {
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

    async createBookingManager(req, res) {
        try {
             const cus_id = req.query.cusId
             const booking = new Booking(req.body)
             const saveBooking = await booking.save()
             const updateBooking = await Booking.findById(saveBooking.id)
             await updateBooking.updateOne({$set: {acc_id: cus_id, status: 'Đã tiếp nhận'}})
             const account =  Account.findById(cus_id)
             await account.updateOne({$push: {booking: saveBooking._id}})
             const order = new Order()
             const saveOrder = await order.save()
             const updateOrder = await Order.findById(saveOrder.id)
             const neworder = await updateOrder.updateOne({$set: {booking_id: saveBooking.id}}, {new: true})
             await booking.updateOne({$set: {order_id: saveOrder.id}})
             res.status(200).json(neworder)
        } catch (err) {
            res.status(500).json(err)
        }
        
    }
    async updateBookingById(req, res) {
        try {
            const booking = await Booking.findById(req.params.id)
            await booking.updateOne({$set: req.body})
            res.status(200).json("Cập nhật lịch hẹn thành công")
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async updateBookingByIdForCus(req, res) {
        try {
            const token = req.headers.token
            const bookingId = req.params.id
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const filter = {_id: bookingId, acc_id: acc_id}
            const update = {$set: req.body}
            const updateBooking = await Booking.findByIdAndUpdate(filter, update, {new: true})
            res.status(200).json(updateBooking)
        } catch (err) {
            res.status(500).json(err)
        }
    }
    
    //PATCH /booking/accept-booking (Manager)
    async acceptBooking(req, res) {
        try {
            const booking = await Booking.findById(req.body.id)
            await booking.updateOne({$set: {status: 'Đã tiếp nhận'}})
            const order = new Order()
            const saveOrder = await order.save()
            const updateOrder = await Order.findById(saveOrder.id)
            await updateOrder.updateOne({$set: {booking_id: booking.id}})
            await booking.updateOne({$set: {order_id: saveOrder.id}})
            res.status(200).json(saveOrder)
        } catch (err) {
            res.status(500).json(err)
        }
    }
    //PATCH /booking/cancel-booking (Customer)
    async cancelBooking(req, res) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const booking = await Booking.findOne({$and:[
                {_id: req.body.id},
                {acc_id: acc_id}
            ]}).populate("order_id")
            if(booking.status == "Đang xử lí") {
                await booking.updateOne({$set: {status: 'Hủy'}})
                return res.status(200).json("Hủy lịch hẹn thành công")
            }
            else if(booking.status == "Đã tiếp nhận" && booking.order_id.status == "Đang chờ") {
                await booking.updateOne({$set: {status: 'Hủy'}})
                return res.status(200).json("Hủy lịch hẹn thành công")
            }
            else {
                return res.status(200).json("Lịch hẹn của bạn đã được tiếp nhận không thể hủy")
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

}

module.exports = new BookingController()
 