const Order = require("../models/Order")
const WorkSlot = require("../models/WorkSlot")
const Service = require("../models/Service")
const OrderDetail = require("../models/OrderDetail")
const ServiceAccessory = require("../models/ServiceAccessory")
const Accessory = require('../models/Accessory')
const Computer = require('../models/Computer')
const Buffer = require('buffer/').Buffer
class OrderController {
    // GET order/test1
    async showAllServiceToChoose(req, res) {    
        try {
            const typeCom = req.query.typeCom
            const typeSer = req.query.typeSer
            const hasAccessory = Boolean((req.query.hasAccessory || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))
            if(hasAccessory) {
                var serviceAndAccessory
                if(typeCom) {
                    serviceAndAccessory = await ServiceAccessory.find({typeCom: typeCom}, 'service_id')
                }else {
                    serviceAndAccessory = await ServiceAccessory.find({}, 'service_id')
                }
                const service_id = []
                for(const ser of serviceAndAccessory) {
                    service_id.push(ser.service_id)
                }
                if(typeSer) {
                    const service = await Service.find({type: typeSer}).where('_id').in(service_id).populate([
                        {
                            path: 'serHasAcc',
                            model: 'serviceaccessory',
                            select: 'accessory_id',
                            populate: {
                                path: 'accessory_id',
                                model: 'accessory',
                                select: 'name price type component description insurance supplier_id',
                                populate: {
                                    path: 'supplier_id',
                                    model: 'supplier',
                                    select: 'name'
                                }
                            }
                        }
                    ])
                    res.status(200).json(service)
                }else {
                    const service = await Service.find().where('_id').in(service_id).populate([
                        {
                            path: 'serHasAcc',
                            model: 'serviceaccessory',
                            select: 'accessory_id',
                            populate: {
                                path: 'accessory_id',
                                model: 'accessory',
                                select: 'name price type component description insurance supplier_id',
                                populate: {
                                    path: 'supplier_id',
                                    model: 'supplier',
                                    select: 'name'
                                }
                            }
                        }
                    ])
                    res.status(200).json(service)
                }           
            } else {
                if(typeSer){
                    const service = await Service.find({hasAccessory: hasAccessory, type: typeSer},  'name price type description')
                    res.status(200).json(service)
                }else {
                    const service = await Service.find({hasAccessory: hasAccessory},  'name price type description')
                    res.status(200).json(service)
                }
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async viewOrderWithDetail(req, res) {
        try {
            const id = req.params.id
            const order = await Order.findById(id).populate([
                {
                    path: 'orderDetails_id',
                    model: 'orderdetail',
                    select: 'amout_ser price_after discount service_id',
                    populate: {
                        path: 'service_id',
                        model: 'service',
                        select: 'name'
                    }
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
            const cond = await OrderDetail.findById(id).populate([
                {
                    path: 'service_id',
                    model: 'service',
                    select: 'hasAccessory'
                }
            ])
            if(cond.service_id.hasAccessory == true) {
                const detailOrder = await OrderDetail.findById(id).populate([
                    {
                        path: 'service_id',
                        model: 'service',
                        select: 'name price'
                    },
                    {
                        path: 'accessories.accessory_id',
                        model: 'accessory',
                        select: 'name price insurance supplier_id',
                        populate: {
                            path: 'supplier_id',
                            model: 'supplier',
                            select: 'name'
                        }
                    }
                ])
                res.status(200).json(detailOrder)
            }else {
                const detailOrder = await OrderDetail.findById(id).populate([
                    {
                        path: 'service_id',
                        model: 'service',
                        select: 'name price'
                    }
                ])
                res.status(200).json(detailOrder)
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }
    //POST /order/addDetailOrder/:id
    async addDetailOrder(req, res) {
        try {
            const order = await Order.findById(req.params.id)
            const datas = req.body.datas
            for(const data of datas) {
                const hasAccessory = data.hasAccessory
                const discount = data.discount
                const listAccId = data.accessories
                const serId = data.serviceId
                var priceAcc = 0
                if(hasAccessory) {
                    const orderDetail = new OrderDetail({
                        discount,
                        service_id: serId,
                        accessories: data.accessories
                    })
                    const saveOrderDetail = await orderDetail.save()
                    listAccId.forEach(async function(e){
                        if(e.accessory_id) {
                            const accessory = await Accessory.findById(e.accessory_id)
                            priceAcc+=(accessory.price*e.amount_acc)
                            await accessory.updateOne({$push: {orderdetail_id: saveOrderDetail.id}})
                        }
                    })
                    const service = await Service.findById(serId)
                    if(service){
                        await service.updateOne({$push: {orderdetail_id: saveOrderDetail.id}})              
                    }
                    await order.updateOne({$push: {orderDetails_id: saveOrderDetail.id}, $set: {status: 'Chờ xác nhận'}})
                    const totalPrice = (priceAcc + service.price)*(100-discount)/100
                    await OrderDetail.findByIdAndUpdate(
                        {_id: saveOrderDetail.id}, 
                        {price_after: totalPrice, order_id: order.id, accessories: listAccId, service_id: service.id}, 
                        {new: true}
                    )
                }
                else {
                    const orderDetail = new OrderDetail({
                        discount,
                        service_id: serId
                    })
                    const saveOrderDetail = await orderDetail.save()
                    const service = await Service.findById(serId)
                    await service.updateOne({$push: {orderdetail_id: saveOrderDetail.id}})
                    await order.updateOne({$push: {orderDetails_id: saveOrderDetail.id}, $set: {status: 'Chờ xác nhận'}})
                    const totalPrice = service.price*(100-discount)/100
                    await OrderDetail.findByIdAndUpdate(
                        {_id: saveOrderDetail.id},
                        {price_after: totalPrice, order_id: order.id, service_id: service.id}, 
                        {new: true}
                    )
                }
            }
            res.status(200).json("Cap nhat thanh cong")  
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async deleteAllDetailOrder(req, res, next) {
        try {
            const order = await Order.findById(req.params.id)
            if(order.orderDetails_id){
                for(const orderDetailId of order.orderDetails_id) {
                    const orderDetail = await OrderDetail.findById(orderDetailId)
                    const accessories_id = []
                    for(const accessory of orderDetail.accessories) {
                        accessories_id.push(accessory.accessory_id)
                    }
                    await Accessory.updateMany({_id:{$in: accessories_id}}, {$pull: {orderdetail_id: orderDetailId}})
                    await Service.findByIdAndUpdate({_id: orderDetail.service_id}, {$pull: {orderdetail_id: orderDetailId}})
                    await OrderDetail.deleteOne({_id: orderDetailId})
                }
                await order.updateOne({$unset:{orderDetails_id:1}})
                next()
            } else {
                next()
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
            if(workSlot){
                const order = await Order.findById(orderId)
                res.status(200).json(order)
            }
            else {
                res.status(200).json("Khong tim thay order")
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
                            select: 'name price hasAccessory'
                        },
                        {
                            path: 'accessories.accessory_id',
                            model: 'accessory',
                            select: 'name price'
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
    async addComputerToOrderById(req, res) {
        try {
            const data = req.body
            const orderId = req.params.id
            const existedComputer = await Computer.findOne({code: data.code})
            if(existedComputer) {
                await Computer.findByIdAndUpdate({_id: existedComputer.id}, {$push: {order_id: orderId}})
                await Order.findByIdAndUpdate({_id: orderId}, {$set: {computer_id: existedComputer.id}})
            } else {
                const computer = new Computer(data)
                const saveComputer = await computer.save()
                await Computer.findByIdAndUpdate({_id: saveComputer.id}, {$push: {order_id: orderId}})
                await Order.findByIdAndUpdate({_id: orderId}, {$set: {computer_id: saveComputer.id}})
            }
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
    async acceptOrderByCus(req, res) {
        try {
            const order = await Order.findById(req.body.id)
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
            const order = await Order.findById(req.body.id)
            await order.updateOne({$set: {status: 'Hủy'}})
            res.status(200).json("Đơn hàng đã bị hủy")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async completeOrder(req, res) {
        try {
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
 