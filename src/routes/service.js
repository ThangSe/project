const serviceController = require("../app/controllers/ServiceController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all-service", middlewareController.verifyToken, serviceController.showAllService)
router.post("/new-service", middlewareController.verifyTokenManager, serviceController.createNewService)
router.get("/all-accessories-service/:serviceId", serviceController.showAllAccessoriesOfSerive)
router.get("/accessories-to-service/:serviceId", middlewareController.verifyTokenManager ,serviceController.addMoreAccessoriesToService)
router.post("/update-service/:id", middlewareController.verifyTokenManager,serviceController.deleteAllDetailService, serviceController.updateNewDetailService)
router.get("/:serviceId", middlewareController.verifyTokenStaff, serviceController.getService)
router.patch("/:id", middlewareController.verifyTokenManager, serviceController.updateService)
module.exports = router
