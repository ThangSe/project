const router = require("express").Router()
const bookingController = require('../app/controllers/BookingController')
const middlewareController = require("../app/controllers/MiddlewareController")

router.get('/all', bookingController.show)
router.get('/:id', bookingController.search)
router.post('/create', middlewareController.verifyToken, bookingController.create)
router.put('/:id', bookingController.updateBookingById)
module.exports = router