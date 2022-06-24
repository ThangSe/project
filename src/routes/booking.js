const router = require("express").Router()
const bookingController = require('../app/controllers/BookingController')

router.get('/all', bookingController.show)
router.get('/:id', bookingController.search)
router.post('create', bookingController.create)
module.exports = router