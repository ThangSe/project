const agencyController = require("../app/controllers/AgencyController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all", agencyController.show)
router.post("/create", agencyController.create)
module.exports = router
