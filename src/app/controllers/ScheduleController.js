const parse = require('date-fns/parse')
const isDate = require('date-fns/isDate')
const Schedule = require('../models/Schedule')
const Slot = require('../models/Slot')
const WorkSlot = require('../models/WorkSlot')
const Account = require('../models/Account')
const Buffer = require('buffer/').Buffer

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
                            return res.status(500).json('Already assign this slot')
                        }
                        else {
                            const workSlot = new WorkSlot({
                                slot_id: existedSlot.id,
                                staff_id: acc_id
                            })
                            const saveWorkSlot = await workSlot.save()
                            await existedSlot.updateOne({$push: {work_slot: saveWorkSlot.id}})
                            await Account.findByIdAndUpdate({_id: acc_id}, {$push: {workslot_id: saveWorkSlot.id}})
                            return res.status(200).json('Assign successful')
                        }                        
                    }
                    else {
                        return res.status(500).json('slot full')
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
                    return res.status(200).json('Assign successful')

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
                return res.status(200).json('Assign successful')
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
                }
            ])
            res.status(200).json(workSchedule)
        } catch (err) {
            res.status(500).json(err)
        }
    }
    
    async assignWorkSlotToOrder (req, res) {

    }

    async showWorkSlotForAssign (req, res) {
        try {
            const {dateString} = req.query
            const date = parse(dateString, 'yyyy-MM-dd', new Date())    
            let schedule = await Schedule.findOne({date: date}).populate("slots")
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

}

module.exports = new ScheduleController()
