const _ = require('lodash')
const Order = require("../models/Order")
const WorkSlot = require("../models/WorkSlot")
const Service = require("../models/Service")
const OrderDetail = require("../models/OrderDetail")
const Accessory = require('../models/Accessory')
const Computer = require('../models/Computer')
const Buffer = require('buffer/').Buffer
const multer = require('multer')
const {storage, fileFind, deletedFile} = require('../../config/db/upload')

const addNewData = async (data, order) => {
    var priceAcc = 0
    var priceSer = 0
    const orderDetail = new OrderDetail(data)
    const saveOrderDetail = await orderDetail.save()
    if(data.accessory_id){
        const accessory = await Accessory.findById(data.accessory_id)
        await accessory.updateOne({$push: {orderdetail_id: saveOrderDetail.id}})
        priceAcc +=(accessory.price*saveOrderDetail.amount_acc)
    }
    if(data.service_id){
        const service = await Service.findById(data.service_id)
        await service.updateOne({$push: {orderdetail_id: saveOrderDetail.id}})
        priceSer +=(service.price*saveOrderDetail.amount_ser)
    }
    await order.updateOne({$push: {orderDetails_id: saveOrderDetail.id}})
    const totalPrice = (priceAcc + priceSer)*(100-saveOrderDetail.discount)/100
    await OrderDetail.findByIdAndUpdate(
        {_id: saveOrderDetail.id}, 
        {$set: {price_after: totalPrice, order_id: order.id}}
)
}

class OrderController {
    // GET order/test1
    async viewOrderWithDetail(req, res) {
        try {
            const id = req.params.id
            const order = await Order.findById(id).populate([
                {
                    path: 'orderDetails_id',
                    model: 'orderdetail',
                    select: 'amount_ser price_after discount service_id accessory_id amount_acc',
                    populate: [{
                        path: 'service_id',
                        model: 'service',
                        select: 'name price',
                        options: { withDeleted: true }
                    },
                    {
                        path: 'accessory_id',
                        model: 'accessory',
                        select: 'name price insurance imgURL',
                        options: { withDeleted: true }
                    }
                    ]
                },
                {
                    path: 'computer_id',
                    model: 'computer'
                }
            ])
            res.status(200).json(order)
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async viewDetailOrder(req, res) {
        try {
            const id = req.params.id
            const detailOrder = await OrderDetail.findById(id).populate([
                {
                    path: 'service_id',
                    model: 'service',
                    select: 'name price',
                    options: { withDeleted: true }
                },
                {
                    path: 'accessory_id',
                    model: 'accessory',
                    select: 'name price insurance supplier_id imgURL',
                    options: { withDeleted: true },
                    populate: {
                        path: 'supplier_id',
                        model: 'supplier',
                        select: 'name'
                    }
                }
            ])
            res.status(200).json(detailOrder)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async deleteImgOrder(req, res, next) {
        try {
            const orderId = req.params.id
            const order = await Order.findById(orderId)
            if(order.imgComUrls.length > 0){
                for (var i = 0; i<order.imgComUrls.length; i++){
                    const filename = order.imgComUrls[i].replace("https://computer-services-api.herokuapp.com/order/order-img/","")
                    const file = await fileFind(filename)
                    if(file){
                        await deletedFile(file)
                    }
                }        
                next()
            }else {
                next()
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async addImageComputerToOrder(req, res) {
        try {
            const upload = multer({
                storage,
                limits: {fileSize: 1 * 1024 * 1024 },
                fileFilter: (req, file, cb) => {
                    if(file.originalname.match(/\.(jpg|png|jpeg)$/)){
                        cb(null, true)
                    }else {
                        cb(null, false)
                        const err = new Error('Chỉ nhận định dạng .png, .jpg và .jpeg')
                        err.name = 'ExtensionError'
                        return cb(err)
                    }
                }
            }).array('img', 5)
            upload(req, res, async(err) => {
                if(err instanceof multer.MulterError) {
                    res.status(500).json(`Multer uploading error: ${err.message}`).end()
                    return
                } else if(err) {
                    if(err.name == 'ExtensionError') {
                        res.status(413).json(err.message).end()
                    } else {
                        res.status(500).json(`unknown uploading error: ${err.message}`).end()
                    }
                    return
                }
                const orderId = req.params.id
                const URLs = req.files.map(file => "https://computer-services-api.herokuapp.com/order/order-img/"+file.filename)
                await Order.findByIdAndUpdate({_id: orderId}, {$set: {imgComUrls: []}})
                await Order.findByIdAndUpdate({_id: orderId}, {$push: {imgComUrls: {$each: URLs}}})
                res.status(200).json('Tải ảnh thành công')   
            })
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async addDetailOrder(req, res) {
        try {
            const order = await Order.findById(req.params.id).populate([
                {
                    path: 'orderDetails_id',
                    model: 'orderdetail'
                }
            ])
            const datas = req.body.datas
            if(datas) {
                var existedList = []
                if(order.orderDetails_id.length > 0) {                 
                    for(const item of order.orderDetails_id) {
                        if(item.accessory_id) {
                            existedList.push(item.accessory_id.toString())
                        }
                        if(item.service_id) {
                            existedList.push(item.service_id.toString())
                        }
                    }
                }
                for(const data of datas) {
                    if(data.accessory_id && existedList.includes(data.accessory_id)) {
                        const orderDetail = await OrderDetail.findOne({$and: [
                            {accessory_id: data.accessory_id},
                            {order_id: order.id}
                        ]})
                        if(orderDetail.amount_acc !=0) {
                            await orderDetail.updateOne({$set:{amount_acc: 0, price_after: 0}})
                        }
                    }
                    if(data.service_id && existedList.includes(data.service_id)) {
                        const orderDetail = await OrderDetail.findOne({$and: [
                            {service_id: data.service_id},
                            {order_id: order.id}
                        ]})
                        if(orderDetail.amount_ser !=0) {
                            await orderDetail.updateOne({$set:{amount_ser: 0, price_after: 0}})
                        }
                    }
                }
                for(const data of datas) {                                 
                    if(order.orderDetails_id.length > 0) {
                        if(data.accessory_id && existedList.includes(data.accessory_id)) {
                            const accessory = await Accessory.findById(data.accessory_id)
                            await OrderDetail.findOneAndUpdate({$and: [
                                {accessory_id: accessory.id},
                                {order_id: order.id}
                            ]},  
                            {$inc: {amount_acc: data.amount_acc, price_after: accessory.price*data.amount_acc*(100-data.discount)/100}})
                        }
                        else if(data.service_id && existedList.includes(data.service_id)) {
                            const service = await Service.findById(data.service_id) 
                            await OrderDetail.findOneAndUpdate({$and: [
                                {service_id: service.id},
                                {order_id: order.id}
                            ]}, 
                            {$inc: {amount_ser: data.amount_ser, price_after: service.price*data.amount_ser*(100-data.discount)/100}})
                        } else {
                            addNewData(data, order)
                        }                           
                    } else {
                        addNewData(data, order)
                    }              
                }
                await order.updateOne({$set: {status: 'Chờ xác nhận'}})
                return res.status(200).json("Cập nhật thành công")
            }else {
                return res.status(400).json("Không có dữ liệu")
            }  
        } catch (err) {
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
        }
    }

    async deleteDetailOrder(req, res) {
        try {
            const orderDetail = await OrderDetail.findById(req.params.id)
            if(orderDetail.accessory_id) {
                await Accessory.findByIdAndUpdate({_id: orderDetail.accessory_id}, {$pull: {orderdetail_id: orderDetail.id}})
            }
            if(orderDetail.service_id){
                await Service.findByIdAndUpdate({_id: orderDetail.service_id}, {$pull: {orderdetail_id: orderDetail.id}})
            }
            await Order.findByIdAndUpdate({_id: orderDetail.order_id}, {$pull: {orderDetails_id: orderDetail.id}})
            await OrderDetail.deleteOne({_id: orderDetail.id})
            res.status(200).json("Xóa thành công")
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
            await Order.findByIdAndUpdate({_id:order.id}, {totalPrice: price}, {new: true})
            res.status(200).json("Cập nhật thành công")  
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
            const orders = await WorkSlot.find({staff_id: acc_id, order_id: {$exists: true}}, {_id: 0, oder_id: 1}).sort({id: -1}).populate([{
                path: 'order_id',
                model: 'order',
                match: {
                    $and: [
                        {status:{$ne: "Hủy"}},
                        {status:{$ne: "Hoàn thành"}}
                    ]
                },
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
        const ordersInProcess = _.reject(orders, ['order_id', null])
            res.status(200).json(ordersInProcess)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async historyCompletedOrderForStaff(req, res) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const orders = await WorkSlot.find({staff_id: acc_id, order_id: {$exists: true}}, {_id: 0, oder_id: 1}).sort({id: -1}).populate([{
                path: 'order_id',
                model: 'order',
                match: {
                    $or: [
                        {status:{$eq: "Hủy"}},
                        {status:{$eq: "Hoàn thành"}}
                    ]
                },
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
        const ordersInProcess = _.reject(orders, ['order_id', null])
            res.status(200).json(ordersInProcess)
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
            if(workSlot){
                const order = await Order.findById(orderId)
                res.status(200).json(order)
            }
            else {
                res.status(400).json("Không tìm thấy đơn hàng")
            }
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
                            select: 'name price hasAccessory',
                            options: { withDeleted: true }
                        },
                        {
                            path: 'accessory_id',
                            model: 'accessory',
                            select: 'name price imgURL',
                            options: { withDeleted: true }
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
                            select: ' name phonenum'
                        }
                    }
                },
                {
                    path: 'computer_id',
                    model: 'computer'
                }
             ])
             res.status(200).json(order)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async searchOrderById(req, res) {
        try {
            const order = await Order.findById(req.params.id).populate([{
                path: 'orderDetails_id',
                model: 'orderdetail',
                populate:[
                    {
                        path: 'service_id',
                        model: 'service',
                        select: 'name description type price',
                        options: { withDeleted: true }
                    },
                    {
                        path: 'accessory_id',
                        model: 'accessory',
                        select: 'name description insurance price supplier_id',
                        options: { withDeleted: true },
                        populate:{
                                path: 'supplier_id',
                                model: 'supplier',
                                select: 'name'
                        }
                    }
                ]
            },
            {
                path: 'computer_id',
                model: 'computer'
            }
        ])
            if(order.work_slot) {
                var exchangeOrder = order.toObject()
                const workSlot = await WorkSlot.findOne({order_id: order.id})
                exchangeOrder.status_workslot = workSlot.status
                res.status(200).json(exchangeOrder)
            } else {
                res.status(200).json(order)
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async updateOrderById(req, res, next) {
        try {
            const order = await Order.findById(req.params.id)
            await order.updateOne({$set: req.body})
            next()
        } catch (err) {
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
        }
    }
    async updateOrderByIdForManager(req, res, next) {
        try {
            const order = await Order.findById(req.params.id)
            if(order.status == 'Chờ xác nhận'){
                await order.updateOne({$set: req.body})
                next()
            } else {
                res.status(404).json("Trạng thái đơn hàng đã thay đổi")
            }          
        } catch (err) {
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
        }
    }
    async addComputerToOrderById(req, res) {
        try {
            const data = req.body
            const orderId = req.params.id
            const existedComputer = await Computer.findOne({code: data.code})
            if(existedComputer) {
                await Computer.findByIdAndUpdate({_id: existedComputer.id}, {$set: req.body, $push: {order_id: orderId}})
                await Order.findByIdAndUpdate({_id: orderId}, {$set: {computer_id: existedComputer.id}})
            } else {
                const computer = new Computer(data)
                const saveComputer = await computer.save()
                await Computer.findByIdAndUpdate({_id: saveComputer.id}, {$push: {order_id: orderId}})
                await Order.findByIdAndUpdate({_id: orderId}, {$set: {computer_id: saveComputer.id}})
            }
            res.status(200).json("Cập nhật thành công")
        } catch (err) {
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
        }
    }
    async acceptOrder(req, res) {
        try {
            const order = await Order.findById(req.params.id)
            if(order.status == 'Chờ xác nhận'){
                await order.updateOne({$set: {status: 'Quản lí xác nhận'}})
                res.status(200).json("Cập nhật thành công")
            }
            else {
                res.status(404).json("Đơn hàng không ở trạng thái chờ")
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async acceptOrderByCus(req, res) {
        try {
            const order = await Order.findById(req.params.id)
            if(order.status == 'Quản lí xác nhận'){
                await order.updateOne({$set: {status: 'Hoàn tất hóa đơn'}})
                res.status(200).json("Đơn hàng đã hoàn tất")
            }
            else {
                res.status(404).json("Đơn hàng chưa được quản lí xác nhận")
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async cancelOrder(req, res) {
        try {
            const order = await Order.findById(req.params.id)
            if(order.work_slot){
                await WorkSlot.findByIdAndUpdate({_id: order.work_slot}, {$set: {status: 'open'}})
            }
            await order.updateOne({$set: {status: 'Hủy'}})
            res.status(200).json("Đơn hàng đã bị hủy")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async completeOrder(req, res) {
        try {
            const order = await Order.findById(req.params.id)
            if(order.status == 'Hoàn tất hóa đơn'){
                await order.updateOne({$set: {status: 'Hoàn thành'}})
                res.status(200).json("Đơn hàng đã hoàn thành")
            }
            else {
                res.status(404).json("Đơn hàng chưa được khách hàng hoàn tất")
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }
}

module.exports = new OrderController()
 