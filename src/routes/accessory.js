const accessoriesController = require("../app/controllers/AccessoriesController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all-accessories", middlewareController.verifyToken, accessoriesController.showAllAccessory)
router.get("/all-accessories-for-customer", middlewareController.verifyToken, accessoriesController.getAllAccessoryForCus)
router.get("/all-accessories-by-type", middlewareController.verifyToken, accessoriesController.showAllAccessoryByType)
router.get("/accessory-img/:filename", accessoriesController.getAllImg)
router.post("/new-accessory",/* middlewareController.verifyTokenManager,*/ accessoriesController.createNewAccessory)
router.post("/new-supplier", middlewareController.verifyTokenManager, accessoriesController.createSupplier)
router.get("/:id", middlewareController.verifyTokenStaff, accessoriesController.getAccessory)
router.patch("/:id", middlewareController.verifyTokenManager, accessoriesController.updateAccessory)
router.post("/upload-img", accessoriesController.updateImgAccessories)
module.exports = router
