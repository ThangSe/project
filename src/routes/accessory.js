const accessoriesController = require("../app/controllers/AccessoriesController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all-accessories", accessoriesController.showAllAccessory)
router.post("/create-accessory", accessoriesController.createNewAccessory)
router.post("/create-supplier", accessoriesController.createSupplier)
module.exports = router
