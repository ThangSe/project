const format = require('date-fns/format')
const parse = require('date-fns/parse')
const isDate = require('date-fns/isDate')
const Schedule = require('../models/Schedule')
const Slot = require('../models/Slot')
const WorkSlot = require('../models/WorkSlot')
const Booking = require('../models/Booking')
const Account = require("../models/Account")
const Order = require("../models/Order")
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
                const existedSlot = await Slot.findOne({slot: slot})
                if(existedSlot) {
                    if(existedSlot.workslot.length < existedSlot.max_per) {
                        const workSlot = new WorkSlot({
                            slot_id: existedSlot.id,
                            staff_id: acc_id
                        })
                        const saveWorkSlot = await workSlot.save()
                        await existedSlot.updateOne({$push: {work_slot: saveWorkSlot.id}})
                        return res.status(200).json('Assign successful')
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
                return res.status(200).json('Assign successful')
            }

        } catch (err) {
            res.status(500).json(err)
        }
    }

}

module.exports = new ScheduleController()
