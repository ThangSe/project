const addHours = require('date-fns/addHours')
const startOfDay = require('date-fns/startOfDay')
const endOfDay = require('date-fns/endOfDay')
const isBefore = require('date-fns/isBefore')
const isAfter = require('date-fns/isAfter')

const rightTime = () => {
    const toDay = addHours(new Date(), 7)
    const start = addHours(startOfDay(toDay), 15)
    const end = addHours(endOfDay(toDay), 3)
    if(isBefore(toDay, start) || isAfter(toDay, end)){
        return true
    }else {
        return true
    }
}
module.exports = {rightTime}
