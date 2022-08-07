const router = require("express").Router()
const scheduleController = require('../app/controllers/ScheduleController')
const middlewareController = require("../app/controllers/MiddlewareController")

router.post('/assignslot', middlewareController.verifyTokenStaff, scheduleController.assignWorkSlot)
router.get('/allschedule', scheduleController.showWorkSchedule)
router.get('/schedule-no-order', scheduleController.showScheduleWithoutOrder)
router.get('/show-slot', scheduleController.showWorkSlotForAssign)
router.get('/oneweekschedule', scheduleController.getOneWeekSchedule)
router.patch('/assign-slot-to-order', middlewareController.verifyTokenManager, scheduleController.assignWorkSlotToOrder)
router.get('/show-workslot-for-assign', middlewareController.verifyTokenManager, scheduleController.showWorkSlotForAssign)
router.get('/show-workslot', middlewareController.verifyTokenStaff, scheduleController.showWorkSlotStaff)
router.get('/show-schedule-for-assign', scheduleController.showScheduleForAssign)
module.exports = router
