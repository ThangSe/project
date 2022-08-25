const router = require("express").Router()
const orderController = require('../app/controllers/OrderController')
const imgFunc = require("../config/db/upload")
const middlewareController = require("../app/controllers/MiddlewareController")

router.get('/show-service-to-choose',middlewareController.verifyTokenStaff, orderController.showAllServiceToChoose)
router.get('/show/order-staff', orderController.showOrderForStaff)
router.get('/order-with-detail/:id',orderController.viewOrderWithDetail)
router.get('/all', middlewareController.verifyTokenManager, orderController.showAllOrder)
router.patch('/accept-order', middlewareController.verifyTokenManager, orderController.acceptOrder)
router.patch('/computer-to-order/:id', middlewareController.verifyTokenStaff, orderController.addComputerToOrderById)
router.patch('/customer-confirm', middlewareController.verifyTokenCustomer, orderController.acceptOrderByCus)
router.patch('/complete-order', middlewareController.verifyTokenStaff, orderController.completeOrder)
router.patch('/cancel-order', middlewareController.verifyTokenStaff, orderController.cancelOrder)
router.get('/staff/:id', middlewareController.verifyTokenStaff, orderController.getOrderByStaff)
router.get('/detail-order/:id',mideddlewareController.verifyToken, orderController.viewDetailOrder)
router.post("/upload-img/:id", middlewareController.verifyTokenStaff, orderController.deleteImgOrder, orderController.addImageComputerToOrder)
router.post('/add-detail-order/:id', middlewareController.verifyTokenStaff, orderController.deleteAllDetailOrder, orderController.addDetailOrder)
router.get('/cus/:id', middlewareController.verifyToken, orderController.getOrderByIdForCus)
router.get("/order-img/:filename", imgFunc.getImg)
router.get('/get-order-total-price/:id', middlewareController.verifyTokenStaff, orderController.getTotalPrice)
router.patch('/:id', middlewareController.verifyTokenStaff, orderController.updateOrderById, orderController.getTotalPrice)
router.get('/:id', middlewareController.verifyTokenManager, orderController.searchOrderById)
module.exports = router
    