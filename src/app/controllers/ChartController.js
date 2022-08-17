const parse = require('date-fns/parse')
const isDate = require('date-fns/isDate')
const format = require('date-fns/format')
const startOfDay = require('date-fns/startOfDay')
const endOfDay = require('date-fns/endOfDay')   
const startOfMonth = require('date-fns/startOfMonth')
const endOfMonth = require('date-fns/endOfMonth')
const startOfYear = require('date-fns/startOfYear')
const endOfYear = require('date-fns/endOfYear')
const Booking = require('../models/Booking')
const Account = require('../models/Account')
const Order = require('../models/Order')
class ChartController {
    async dataToChart (req, res) {
        try {
            const datesStrs = req.body.dates
            const types = req.body.types    
            const filter = req.body.filter
            const dates = datesStrs.map(date => parse(date, 'yyyy-MM-dd', new Date()))
            const data = []
            if(types.indexOf("totalbooking") > -1 && filter == 'bydate') {
                const counts = []
                for (var i = 0; i < dates.length; i++) {
                    const count = await Booking.find({updatedAt:{$gte: startOfDay(dates[i]),$lt: endOfDay(dates[i])}}).count()    
                    counts.push(count)
                }
                const totalBooking = {label: "Tổng số lịch hẹn theo ngày", data: counts}
                data.push(totalBooking)
            } else if (types.indexOf("totalbooking") > -1 && filter == 'bymonth') {
                const counts = []
                for (var i = 0; i < dates.length; i++) {
                    const count = await Booking.find({updatedAt:{$gte: startOfMonth(dates[i]),$lt: endOfMonth(dates[i])}}).count()
                    counts.push(count)
                } 
                const totalBooking = {label: "Tổng số lịch hẹn theo tháng", data: counts}
                data.push(totalBooking)
            } else if (types.indexOf("totalbooking") > -1 && filter == 'byyear') {
                const counts = []
                for (var i = 0; i < dates.length; i++) {
                    const count = await Booking.find({updatedAt:{$gte: startOfYear(dates[i]),$lt: endOfYear(dates[i])}}).count()
                    counts.push(count)
                } 
                const totalBooking = {label: "Tổng số lịch hẹn theo năm", data: counts}
                data.push(totalBooking)
            }
            if(types.indexOf("newcustomer") > -1 && filter == 'bydate') {
                const counts = []
                for (var i = 0; i < dates.length; i++) {
                    const count = await Account.find({createdAt:{$gte: startOfDay(dates[i]),$lt: endOfDay(dates[i])}}).count()    
                    counts.push(count)   
                }
                const totalNewCus = {label: "Số khách hàng mới theo ngày", data: counts}
                data.push(totalNewCus)
            } else if(types.indexOf("newcustomer") > -1 && filter == 'bymonth') {
                const counts = []
                for (var i = 0; i < dates.length; i++) {
                    const count = await Account.find({createdAt:{$gte: startOfMonth(dates[i]),$lt: endOfMonth(dates[i])}}).count()    
                    counts.push(count)   
                }
                const totalNewCus = {label: "Số khách hàng mới theo tháng", data: counts}
                data.push(totalNewCus)
            } else if(types.indexOf("newcustomer") > -1 && filter == 'byyear') {
                const counts = []
                for (var i = 0; i < dates.length; i++) {
                    const count = await Account.find({createdAt:{$gte: startOfYear(dates[i]),$lt: endOfYear(dates[i])}}).count()    
                    counts.push(count)   
                }
                const totalNewCus = {label: "Số khách hàng mới theo năm", data: counts}
                data.push(totalNewCus)
            }
            if(types.indexOf("completedorder") > -1 && filter == 'bydate') {
                const counts = []
                for (var i = 0; i < dates.length; i++) {
                    const count = await Order.find({status: 'Hoàn thành', updatedAt:{$gte: startOfDay(dates[i]),$lt: endOfDay(dates[i])}}).count()    
                    counts.push(count)
                }
                const totalCompleteOrder = {label: "Số đơn hoàn thành theo ngày", data: counts}
                data.push(totalCompleteOrder)
            } else if(types.indexOf("completedorder") > -1 && filter == 'bymonth') {
                const counts = []
                for (var i = 0; i < dates.length; i++) {
                    const count = await Order.find({status: 'Hoàn thành', updatedAt:{$gte: startOfMonth(dates[i]),$lt: endOfMonth(dates[i])}}).count()    
                    counts.push(count)
                }
                const totalCompleteOrder = {label: "Số đơn hoàn thành theo tháng", data: counts}
                data.push(totalCompleteOrder)
            } else if(types.indexOf("completedorder") > -1 && filter == 'byyear') {
                const counts = []
                for (var i = 0; i < dates.length; i++) {
                    const count = await Order.find({status: 'Hoàn thành', updatedAt:{$gte: startOfYear(dates[i]),$lt: endOfYear(dates[i])}}).count()    
                    counts.push(count)
                }
                const totalCompleteOrder = {label: "Số đơn hoàn thành theo năm", data: counts}
                data.push(totalCompleteOrder)
            }
            res.status(200).json(data)
        } catch (err) {
            res.status(500).json(err)
        }
        
    }
    async dataForDashboard(req, res) {
        try {
            const toDay =  new Date()
            const datas = []
            const countnewBooking = await Booking.find({createdAt: {$gte: startOfDay(toDay), $lt: endOfDay(toDay)}}).count()
            const countNewCompleteOrder = await Order.find({status: 'Hoàn thành', createdAt: {$gte: startOfDay(toDay), $lt: endOfDay(toDay)}}).count()
            const countNewCustomer = await Account.find({createdAt:{$gte: startOfMonth(toDay),$lt: endOfMonth(toDay)}}).count() 
            datas.push(countnewBooking, countNewCompleteOrder, countNewCustomer)
            res.status(200).json(datas)
        } catch (err) {
            res.status(500).json(err)
        }
    }

}

module.exports = new ChartController()
