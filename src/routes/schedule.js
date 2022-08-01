const router = require("express").Router()
const scheduleController = require('../app/controllers/ScheduleController')
const middlewareController = require("../app/controllers/MiddlewareController")

router.post('/assignslot', middlewareController.verifyTokenStaff, scheduleController.assignWorkSlot)
router.get('/allschedule', scheduleController.showWorkSchedule)
module.exports = router
