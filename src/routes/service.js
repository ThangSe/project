const serviceController = require("../app/controllers/ServiceController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all-service", middlewareController.verifyToken, serviceController.showAllService)
router.post("/new-service", middlewareController.verifyTokenManager, serviceController.createNewService)
router.patch("/restored-service", middlewareController.verifyTokenManager,  serviceController.restoreService)
router.delete("deleted-service", middlewareController.verifyTokenManager, serviceController.deleteService)
router.get("/detail-service/:id", middlewareController.verifyTokenStaff, serviceController.getService)
router.patch("/:id", middlewareController.verifyTokenManager, serviceController.updateService)
module.exports = router
