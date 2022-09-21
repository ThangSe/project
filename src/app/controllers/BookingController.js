const Booking = require('../models/Booking')
const Service = require('../models/Service')
const Account = require("../models/Account")
const Order = require("../models/Order")
const Buffer = require('buffer/').Buffer
const checkServices = async (booking) => {
    var count = 0
    const services = booking.services
    for(const service of services) {
        const a = await Service.findOne({name: service.name})
        if(!a) {
            if(!service.deleted) {
                service.deleted = true
                count++
            }
        } else if(a) {
            if(service.deleted) {
                service.deleted = false
                count ++
            }
        }
    }
    if(count == 0) {
        return booking
    } else {
        await booking.updateOne({$set: {services: services}}, {new: true})
        return booking
    }
}
class BookingController {
    async showAll (req, res) {
        try {
            const {page = 1, limit = 10, sort, status} = req.query
            let bookings = await Booking.find().limit(limit * 1).skip((page - 1) * limit)
            let count = await Booking.find().count()/10
            if(status) {
                if(sort == "desc") {
                    bookings = await Booking.find({status: status}).sort({_id:-1}).limit(limit * 1).skip((page - 1) * limit)
                    count = await Booking.find({status: status}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }else {
                    bookings = await Booking.find({status: status}).sort({_id: 1}).limit(limit * 1).skip((page - 1) * limit)
                    count = await Booking.find({status: status}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }
            }else {
                if(sort == "desc") {
                    bookings = await Booking.find().sort({_id:-1}).limit(limit * 1).skip((page - 1) * limit)
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }else {
                    bookings = await Booking.find().sort({_id: 1}).limit(limit * 1).skip((page - 1) * limit)
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }   
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async showAllBookingByCusId(req, res) {
        try {
            const {page = 1, limit = 10} = req.query
            const sort = req.query.sort
            const cusId = req.params.id
            let bookings = await Booking.find({acc_id: cusId}).limit(limit * 1).skip((page - 1) * limit).populate([
                {
                    path: 'order_id',
                    model: 'order',
                    select: 'status'
                }
            ])
            let count = await Booking.find({acc_id: cusId}).count()/10
            if(sort == "desc" && !req.query.status) {
                bookings = await Booking.find({acc_id: cusId}).sort({_id:-1}).limit(limit * 1).skip((page - 1) * limit).populate([
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
                    bookings = await Booking.find({status:req.query.status, acc_id: cusId}).sort({_id: flag}).limit(limit * 1).skip((page - 1) * limit).populate([
                        {
                            path: 'order_id',
                            model: 'order',
                            select: 'status'
                        }
                    ])
                    count = await Booking.find({status:req.query.status, acc_id: cusId}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }
                else {
                    bookings = await Booking.find({status:req.query.status, acc_id: cusId}).sort({_id: flag}).limit(limit * 1).skip((page - 1) * limit).populate([
                        {
                            path: 'order_id',
                            model: 'order',
                            select: 'status'
                        }
                    ])
                    count = await Booking.find({status:req.query.status, acc_id: cusId}).count()/10
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
            const {page = 1, limit = 10, sort, cus_name, status} = req.query
            let bookings = await Booking.find().sort({_id:1}).limit(limit * 1).skip((page - 1) * limit).populate([
                {
                    path: 'order_id',
                    model: 'order',
                    select: 'status'
                }
            ])
            let count = await Booking.find().count()/10
            if(status && cus_name) {
                if(sort == "desc") {
                    bookings = await Booking.find({status:status, cus_name: { $regex: cus_name, $options: 'i'}}).sort({_id:-1}).limit(limit * 1).skip((page - 1) * limit).populate([
                        {
                            path: 'order_id',
                            model: 'order',
                            select: 'status'
                        }
                    ])
                    count = await Booking.find({status:status, cus_name: { $regex: cus_name, $options: 'i'}}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                } else {
                    bookings = await Booking.find({status:status, cus_name: { $regex: cus_name, $options: 'i'}}).sort({_id:1}).limit(limit * 1).skip((page - 1) * limit).populate([
                        {
                            path: 'order_id',
                            model: 'order',
                            select: 'status'
                        }
                    ])
                    count = await Booking.find({status:status, cus_name: { $regex: cus_name, $options: 'i'}}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }
            }
            else if(status) {
                if(sort == "desc") {
                    bookings = await Booking.find({status:status}).sort({_id: -1}).limit(limit * 1).skip((page - 1) * limit).populate([
                        {
                            path: 'order_id',
                            model: 'order',
                            select: 'status'
                        }
                    ])
                    count = await Booking.find({status:status}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }
                else {
                    bookings = await Booking.find({status:status}).sort({_id: 1}).limit(limit * 1).skip((page - 1) * limit).populate([
                        {
                            path: 'order_id',
                            model: 'order',
                            select: 'status'
                        }
                    ])
                    count = await Booking.find({status:status}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }      
            }else if(cus_name) {
                if(sort == "desc") {
                    bookings = await Booking.find({cus_name: { $regex: cus_name, $options: 'i'}}).sort({_id: -1}).limit(limit * 1).skip((page - 1) * limit).populate([
                        {
                            path: 'order_id',
                            model: 'order',
                            select: 'status'
                        }
                    ])
                    count = await Booking.find({cus_name: { $regex: cus_name, $options: 'i'}}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }
                else {
                    bookings = await Booking.find({cus_name: { $regex: cus_name, $options: 'i'}}).sort({_id: 1}).limit(limit * 1).skip((page - 1) * limit).populate([
                        {
                            path: 'order_id',
                            model: 'order',
                            select: 'status'
                        }
                    ])
                    count = await Booking.find({cus_name: { $regex: cus_name, $options: 'i'}}).count()/10
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }      
            }
            else {
                if(sort == "desc") {
                    bookings = await Booking.find().sort({_id:-1}).limit(limit * 1).skip((page - 1) * limit).populate([
                        {
                            path: 'order_id',
                            model: 'order',
                            select: 'status'
                        }
                    ])
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }else {
                    return res.status(200).json({count: Math.ceil(count), bookings})
                }
            }

        } catch (err) {
            res.status(500).json(err)
        }
    }

    showAllBookingByAccount (req, res, next) {
        const token = req.headers.token
        const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        const acc_id = accountInfo.id
        Booking.find({acc_id: acc_id}).sort({_id:-1})
            .then(bookings => {
                res.status(200).json(bookings)
            })
            .catch(next)
    }
    async searchBookingById(req, res) {
        try {
            const booking = await Booking.findById(req.params.id).populate({
                path: 'acc_id',
                select: 'username'
            })
            res.status(200).json(await checkServices(booking))
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async searchBookingWithOrderById(req, res) {
        try {
            const booking = await Booking.findById(req.params.id).populate([{
                path: 'order_id',
                model: 'order',
                select: 'totalPrice status orderDetails_id work_slot computer_id'
             }])
            res.status(200).json(await checkServices(booking))
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async getBookingByIdForCus(req, res) {
        try {
             const bookingId = req.params.id
             const token = req.headers.token
             const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
             const acc_id = accountInfo.id
             const booking = await Booking.findOne({_id: bookingId, acc_id: acc_id}).populate([{
                path: 'order_id',
                model: 'order',
             }])
             res.status(200).json(await checkServices(booking))
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
            const finalBooking = await Booking.findByIdAndUpdate({_id: saveBooking.id}, {$set: {acc_id: acc_id}}, {new: true})
            await Account.findByIdAndUpdate({_id: acc_id}, {$push: {booking: saveBooking.id}})
            res.status(200).json(finalBooking)
        } catch (err) {
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
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
             const neworder = await Order.findByIdAndUpdate({_id: saveOrder.id},{$set: {booking_id: saveBooking.id}}, {new: true})
             await booking.updateOne({$set: {order_id: saveOrder.id}})
             res.status(200).json(neworder)
        } catch (err) {
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
        }
        
    }
    async updateBookingById(req, res) {
        try {
            const booking = await Booking.findById(req.params.id)
            if(req.body.status =='Hủy') {
                if(booking.status == "Đang xử lí") {
                    await booking.updateOne({$set: req.body})
                    res.status(200).json("Cập nhật lịch hẹn thành công")
                } else {
                    res.status(500).json("Hủy lịch hẹn thất bại")
                }
            }else {
                await booking.updateOne({$set: req.body})
                res.status(200).json("Cập nhật lịch hẹn thành công")
            }
        } catch (err) {
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
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
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
        }
    }
    
    //PATCH /booking/accept-booking (Manager)
    async acceptBooking(req, res) {
        try {
            const booking = await Booking.findById(req.body.id)
            if(booking.status == "Đang xử lí") {
                await booking.updateOne({$set: {status: 'Đã tiếp nhận'}})
                const order = new Order()
                const saveOrder = await order.save()
                const updateOrder = await Order.findByIdAndUpdate({_id: saveOrder.id},{$set: {booking_id: booking.id}}, {new: true})
                await booking.updateOne({$set: {order_id: saveOrder.id}})
                res.status(200).json(updateOrder)
            } else {
                res.status(500).json("Lịch hẹn này đã được cập nhật")
            }      
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
 