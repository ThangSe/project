const router = require("express").Router()
const orderController = require('../app/controllers/OrderController')
const middlewareController = require("../app/controllers/MiddlewareController")

router.get('/all', middlewareController.verifyTokenManager, orderController.showAllOrder)
router.get('/:id', orderController.searchOrderById)
router.patch('/:id', orderController.updateOrderById)
router.patch('/accpet-order', orderController.acceptOrder)
module.exports = router
