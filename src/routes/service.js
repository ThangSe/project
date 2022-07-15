const serviceController = require("../app/controllers/ServiceController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all-service", serviceController.show)
router.post("/create-service", serviceController.create)
module.exports = router
