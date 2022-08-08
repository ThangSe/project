const accessoriesController = require("../app/controllers/AccessoriesController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all-accessories", middlewareController.verifyTokenStaff, accessoriesController.showAllAccessory)
router.post("/create-accessory", middlewareController.verifyTokenManager, accessoriesController.createNewAccessory)
router.post("/create-supplier", middlewareController.verifyTokenManager, accessoriesController.createSupplier)
module.exports = router
