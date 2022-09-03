const parse = require('date-fns/parse')
const formatInTimeZone = require('date-fns-tz/formatInTimeZone')
const format = require('date-fns/format')
const Booking = require('../models/Booking')
const Schedule = require('../models/Schedule')
const Slot = require('../models/Slot')
const WorkSlot = require('../models/WorkSlot')
const Account = require('../models/Account')
const Order = require('../models/Order')
const Buffer = require('buffer/').Buffer
const _ = require('lodash');
const startOfWeek = require('date-fns/startOfWeek')
const endOfWeek = require('date-fns/endOfWeek')
const add = require('date-fns/add')

class ScheduleController {
    // POST /schedule/assignslot
    async assignWorkSlot(req, res) {
        try {
            const datas = req.body.datas
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const message = []
            for(const data of datas) {
                const dateString = data.date
                const date = formatInTimeZone(parse(dateString, 'yyyy-MM-dd', new Date()), 'Asia/Bangkok', 'yyyy-MM-dd')
                const slot = data.slot
                const start = data.start
                const end = data.end
                const existedSchedule = await Schedule.findOne({date: date})
                if(existedSchedule) {        
                    const existedSlot = await Slot.findOne({$and:[
                        {slot: slot},
                        {schedule_id: existedSchedule.id}    
                    ]})
                    if(existedSlot) {
                        if(existedSlot.work_slot.length < existedSlot.max_per) {
                            const existedStaff = await WorkSlot.findOne({$and:[
                                {staff_id: acc_id},
                                {slot_id: existedSlot.id}
                            ]})
                            if(existedStaff) {
                                message.push({Warning: "Bạn đã đăng kí slot " + slot + " ngày " + date + " rồi"})
                            }
                            else {
                                const workSlot = new WorkSlot({
                                    slot_id: existedSlot.id,
                                    staff_id: acc_id
                                })
                                const saveWorkSlot = await workSlot.save()
                                await existedSlot.updateOne({$push: {work_slot: saveWorkSlot.id}})
                                await Account.findByIdAndUpdate({_id: acc_id}, {$push: {workslot_id: saveWorkSlot.id}})
                                message.push({Success: "Đăng kí slot làm việc ngày " + date + " slot " + slot + " thành công"})
                            }                        
                        }
                        else {
                            message.push({Warning: "Slot " + slot + " ngày " + date + " đã đủ người"})
                        }                    
                    } else {
                        const newSlot = new Slot({
                            slot,
                            start,
                            end,
                            schedule_id: existedSchedule.id
                        })
                        const saveSlot = await newSlot.save()
                        const workSlot = new WorkSlot({
                            slot_id: saveSlot.id,
                            staff_id: acc_id
                        })
                        const saveWorkSlot = await workSlot.save()
                        await saveSlot.updateOne({$push: {work_slot: saveWorkSlot.id}})
                        await existedSchedule.updateOne({$push: {slots: saveSlot.id}})
                        await Account.findByIdAndUpdate({_id: acc_id}, {$push: {workslot_id: saveWorkSlot.id}})
                        message.push({Success: "Đăng kí slot làm việc ngày " + date + " slot " + slot + " thành công"})

                    }
                }
                else {
                    const newSchedule = new Schedule({
                        date: date
                    })
                    const saveSchedule = await newSchedule.save()
                    const newSlot = new Slot({
                        slot,
                        start,
                        end,
                        schedule_id: saveSchedule.id
                    })
                    const saveSlot = await newSlot.save()
                    const workSlot = new WorkSlot({
                        slot_id: saveSlot.id,
                        staff_id: acc_id
                    })
                    const saveWorkSlot = await workSlot.save()
                    await saveSlot.updateOne({$push: {work_slot: saveWorkSlot.id}})
                    await saveSchedule.updateOne({$push: {slots: saveSlot.id}})
                    await Account.findByIdAndUpdate({_id: acc_id}, {$push: {workslot_id: saveWorkSlot.id}})
                    message.push({Success: "Đăng kí slot làm việc ngày " + date + " slot " + slot + " thành công"}) 
                }
                }
                res.status(200).json(message)
        } catch (err) {
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
        }
    }

    async showWorkSchedule (req, res) {
        try {
            const workSchedule = await Schedule.aggregate([
                {
                    $match: {
                        slots: {$exists: true}
                    }
                },
                {
                    $lookup: {
                        from: "slots",
                        localField: "slots",
                        foreignField: "_id",
                        as: "slots"
                    }
                },
                {
                    $unwind: "$slots"
                },               
                {
                    $lookup: {
                        from: "workslots",
                        localField: "slots.work_slot",
                        foreignField: "_id",
                        as: "slots.work_slot"
                    }
                },    
                {
                    $group: {
                        _id: "$_id",
                        date: {
                            "$first": "$date"
                        },
                        slots: {
                            "$push": "$slots"
                        },
                        status: {
                            "$first": "$status"
                        },
                        createdAt: {
                            "$first": "$createdAt"
                        },
                        updatedAt: {
                            "$first": "$updatedAt"
                        }
                    }
                }
            ])
            res.status(200).json(workSchedule)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async stillBusyStaff(req, res) {
        try {
            await WorkSlot.findOneAndUpdate({order_id: req.params.id}, {status: 'closed'})
            res.status(200).json("Báo bận thành công")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    
    async assignWorkSlotToOrder (req, res) {
        try {
            const num2hour = hour => hour.toString().replace(/(\d{1,2})(\d{2})$/,"$1")
            const num2minute = minute => minute.toString().replace(/(\d{1,2})(\d{2})$/,"$2")
            const workSlotId = req.body.workSlotId
            const orderId = req.body.orderId
            const order = await Order.findById(orderId).populate("work_slot")
            const availableWorkSlot = await WorkSlot.findById(workSlotId)
            if(order.work_slot && order.status != "Đang chờ") {
                const orderWorkSlot = await WorkSlot.findById(order.work_slot)
                if(orderWorkSlot.status == "closed") {
                    if(availableWorkSlot.status == "busy") {
                        return res.status(400).json("Nhân viên này đang làm việc")
                    }
                    else if(availableWorkSlot.status == "closed") {
                        return res.status(400).json("Nhân viên không còn làm việc ở slot này")
                    }else {
                        await orderWorkSlot.updateOne({$unset: {order_id: 1}, $set: {status: "open"}})
                        await Order.findByIdAndUpdate({_id: orderId}, {$set: {work_slot: workSlotId, status: 'Đang xử lí'}})
                        await WorkSlot.findByIdAndUpdate({_id: workSlotId}, {$set: {order_id: orderId}, $set: {status: "busy"}})
                        const workSlot = await WorkSlot.findById(workSlotId)
                        const slot = await Slot.findById(workSlot.slot_id)
                        const schedule = await Schedule.findById(slot.schedule_id)
                        const newDate = await add(schedule.date, {hours: num2hour(slot.start)-7, minutes: num2minute(slot.start)})     
                        await Booking.findOneAndUpdate({order_id: order.id}, {$set: {time: newDate}})              
                        return res.status(200).json("Cử nhân viên thành công")
                    }
                } else {
                    return res.status(400).json("Slot này nhân viên vẫn đang làm việc")
                }               
            } else {
                if(availableWorkSlot.status == "open") {
                    await Order.findByIdAndUpdate({_id: orderId}, {$set: {work_slot: workSlotId, status: 'Đang xử lí'}})
                    await WorkSlot.findByIdAndUpdate({_id: workSlotId}, {$set: {order_id: orderId}, $set: {status: "busy"}})
                    const workSlot = await WorkSlot.findById(workSlotId)
                    const slot = await Slot.findById(workSlot.slot_id)
                    const schedule = await Schedule.findById(slot.schedule_id)
                    const newDate = await add(schedule.date, {hours: num2hour(slot.start)-7, minutes: num2minute(slot.start)})    
                    await Booking.findOneAndUpdate({order_id: order.id}, {$set: {time: newDate}}) 
                    return res.status(200).json("Cử nhân viên thành công")
                } else {
                    return res.status(400).json("Nhân viên hiện đang không còn làm việc slot này hoặc đang bận")
                }
            }
        } catch (err) {
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
        }     
    }

    async showWorkSlotForAssign (req, res) {
        try {
            const {dateString} = req.query
            const date = parse(dateString, 'yyyy-MM-dd', new Date())    
            const schedule = await Schedule.aggregate([
                {
                    $match: {
                        date: date,
                        slots: {$exists: true}
                    }
                },
                {
                    $lookup: {
                        from: "slots",
                        localField: "slots",
                        foreignField: "_id",
                        as: "slots"
                    }
                },
                {
                    $unwind: "$slots"
                },
                {
                    $lookup: {
                        from: "workslots",
                        localField: "slots.work_slot",
                        foreignField: "_id",
                        as: "slots.work_slot"
                    }
                },    
                {
                    $group: {
                        _id: "$_id",
                        date: {
                            "$first": "$date"
                        },
                        slots: {
                            "$push": "$slots"
                        },
                        status: {
                            "$first": "$status"
                        },
                        createdAt: {
                            "$first": "$createdAt"
                        },
                        updatedAt: {
                            "$first": "$updatedAt"
                        }
                    }
                },
                

            ])
            res.status(200).json(schedule)
        } catch (err) {
            res.status(500).json(err)
        }
    }
    //GET /oneweekschedule (customer)
    async getOneWeekSchedule(req, res) {
        try {
            const scheduleOneWeekFromNow = await Schedule.find({
                date: {
                    $gte: new Date(),
                    $lte: new Date(new Date().valueOf() + 604800000)
                }
            }).sort({date: 1}).populate("slots")
            res.status(200).json(scheduleOneWeekFromNow)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async showOrderWorkingHistory(req, res) {
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
        const ordersCompleted = _.reject(orders, ['order_id', null])
            res.status(200).json(ordersCompleted)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async showWorkSlotStaff(req, res) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const workSlots = await WorkSlot.find({staff_id:acc_id}).populate([{
                path: 'slot_id',
                model: 'slot',
                select: 'slot start end status schedule_id',
                populate: {
                    path: 'schedule_id',
                    model: 'schedule',                    
                    select: 'date status'
                }
            },
            {
                path: 'order_id',
                model: 'order',
                select: 'booking_id',
                populate: {
                    path:'booking_id',
                    model:'booking',
                    select:'cus_name services description type cus_address phonenum'
                }
            }
        ])
            res.status(200).json(workSlots)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async showWorkSlotByStaffId(req, res) {
        try {
            const staffId = req.params.id
            const workSlot = await WorkSlot.find({staff_id: staffId})
            res.status(200).json(workSlot)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async showOneWeekWorkStaff(req, res) {
        try {
            const start = format(startOfWeek(new Date(), {weekStartsOn: 1}),'yyyy-MM-dd')
            const end = format(endOfWeek(new Date(), {weekStartsOn: 1}), 'yyyy-MM-dd')
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const workSlots = await WorkSlot.find({staff_id:acc_id}).populate([{
                path: 'slot_id',
                model: 'slot',
                select: 'slot start end status schedule_id',   
                populate: {
                    path: 'schedule_id',                 
                    model: 'schedule',
                    select: 'date status ',
                    match: {
                        date: {
                            $gte: start,
                            $lte: end
                        }
                    }
                },
            },
            {
                path: 'order_id',
                model: 'order',
                select: 'booking_id',
                populate: {
                    path:'booking_id',
                    model:'booking',
                    select:'cus_name services description type cus_address phonenum'
                }
            }
        ])
            const filter = _.filter(workSlots, function(o){
                return o.slot_id
            })
            res.status(200).json(filter)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async showScheduleForAssign(req,res) {
        try {
            const schedule = await Schedule.find().populate([{
                path: 'slots',
                model: 'slot',
                select: 'slot start end status max_per work_slot',
                populate: {
                    path: 'work_slot',
                    model: 'workslot',
                    select: 'staff_id order_id',
                    populate: {
                        path: 'staff_id',
                        model: 'account',
                        select: 'user_id',
                        populate: {
                            path: 'user_id',
                            model: 'user',
                            select: 'name email address phonenum birth'
                        }
                    }
                }
            }])
            res.status(200).json(schedule)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async showScheduleWithoutOrder(req, res) {
        try {
            const schedule = await Schedule.find().populate([{
                path: 'slots',
                model: 'slot',
                select: 'slot start end status max_per work_slot',
                populate: {
                    path: 'work_slot',
                    model: 'workslot',
                    select: 'staff_id order_id',
                    match: {
                        order_id: {$exists: false}
                    },
                    populate: {
                        path: 'staff_id',
                        model: 'account',
                        select: 'user_id',
                        populate: {
                            path: 'user_id',
                            model: 'user',
                            select: 'name'
                        }
                    }
                }
            }])
            res.status(200).json(schedule)
        } catch (err) {
            res.status(500).json(err)
        }
    }
}

module.exports = new ScheduleController()
