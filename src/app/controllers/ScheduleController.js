const parse = require('date-fns/parse')
const isDate = require('date-fns/isDate')
const format = require('date-fns/format')
const Schedule = require('../models/Schedule')
const Slot = require('../models/Slot')
const WorkSlot = require('../models/WorkSlot')
const Account = require('../models/Account')
const Order = require('../models/Order')
const Buffer = require('buffer/').Buffer
var startOfWeek = require('date-fns/startOfWeek')
var endOfWeek = require('date-fns/endOfWeek')

class ScheduleController {
    // POST /schedule/assignslot
    async assignWorkSlot(req, res) {
        try {
            const dateString = req.body.date
            const date = parse(dateString, 'yyyy-MM-dd', new Date())            
            // const formatdate = format(date, 'yyyy-MM-dd')
            const slot = req.body.slot
            const start = req.body.start
            const end = req.body.end
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
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
                            return res.status(500).json('Bạn đã đăng kí slot làm việc này rồi')
                        }
                        else {
                            const workSlot = new WorkSlot({
                                slot_id: existedSlot.id,
                                staff_id: acc_id
                            })
                            const saveWorkSlot = await workSlot.save()
                            await existedSlot.updateOne({$push: {work_slot: saveWorkSlot.id}})
                            await Account.findByIdAndUpdate({_id: acc_id}, {$push: {workslot_id: saveWorkSlot.id}})
                            return res.status(200).json('Đăng kí slot làm việc thành công')
                        }                        
                    }
                    else {
                        return res.status(500).json('slot làm việc đã đủ người')
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
                    return res.status(200).json('Đăng kí slot làm việc thành công')

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
                return res.status(200).json('Đăng kí slot làm việc thành công')
            }

        } catch (err) {
            res.status(500).json(err)
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
    
    async assignWorkSlotToOrder (req, res) {
        try {
            const workSlotId = req.body.workSlotId
            const orderId = req.body.orderId
            await Order.findByIdAndUpdate({_id: orderId}, {$set: {work_slot: workSlotId, status: 'Đang xử lí'}})
            await WorkSlot.findByIdAndUpdate({_id: workSlotId}, {$set: {order_id: orderId}})
            res.status(200).json("Cử nhân viên thành công")
        } catch (err) {
            res.status(500).json(err)
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

    test(req,res) {

    }

    async showOneWeekWorkStaff(req, res) {
        try {
            const start = format(startOfWeek(new Date(), {weekStartsOn: 1}),'yyyy-MM-dd')
            const end = format(endOfWeek(new Date(), {weekStartsOn: 1}), 'yyyy-MM-dd')
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const workSlots = await WorkSlot.find({staff_id:acc_id, slot_id: {$ne: null}}).populate([{
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
            res.status(200).json(workSlots)
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
