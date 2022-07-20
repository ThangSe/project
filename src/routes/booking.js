const router = require("express").Router()
const bookingController = require('../app/controllers/BookingController')
const middlewareController = require("../app/controllers/MiddlewareController")

router.get('/all', bookingController.showAll)
router.get('/all/bookings-account', middlewareController.verifyToken, bookingController.showAllBookingByAccount)
router.get('/:id', bookingController.searchBookingById)
router.post('/create', middlewareController.verifyToken, bookingController.create)
router.put('/:id', bookingController.updateBookingById)
router.patch('/accpet-booking', bookingController.acceptBooking)
module.exports = router
