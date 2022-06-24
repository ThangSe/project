const Booking = require('../models/Booking')

class BookingController {
    show(req, res, next) {
       Booking.find({})
        .then(bookings => {
            res.json(bookings)
        })
        .catch(next)
    }

    search(req, res, next) {
        Booking.findById(req.params.id)
            .then(booking => {
                res.json(booking)
            })
            .catch(next)
    }

    create(req, res, next) {
        const booking = new Booking(req.body)
        booking.save()
            .then(() => res.send('success'))
            .catch(next)
    }
}

module.exports = new BookingController()