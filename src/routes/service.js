const serviceController = require("../app/controllers/ServiceController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all-service", serviceController.showAllService)
router.post("/create-service", serviceController.createNewService)
module.exports = router
