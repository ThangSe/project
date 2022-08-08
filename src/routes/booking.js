const router = require("express").Router()
const bookingController = require('../app/controllers/BookingController')
const middlewareController = require("../app/controllers/MiddlewareController")

router.get('/all', middlewareController.verifyTokenManager, bookingController.showAll)
router.get('/all/bookings-account', middlewareController.verifyToken, bookingController.showAllBookingByAccount)
router.get('/search/:id', middlewareController.verifyTokenStaff, bookingController.searchBookingById)
router.post('/create', middlewareController.verifyToken, bookingController.createBookingCustomer)
router.post('/create-booking-manager', middlewareController.verifyTokenManager, bookingController.createBookingManager)
router.put('/:id', middlewareController.verifyTokenManager, bookingController.updateBookingById)
router.patch('/accpet-booking', middlewareController.verifyTokenManager, bookingController.acceptBooking)
router.patch('/cancel-booking', middlewareController.verifyToken, bookingController.cancelBooking)
module.exports = router
