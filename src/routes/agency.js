const agencyController = require("../app/controllers/AgencyController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all", agencyController.showAllAgency)
router.post("/create", agencyController.createNewAgency)
module.exports = router
