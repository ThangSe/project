const agencyController = require("../app/controllers/AgencyController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all", middlewareController.verifyTokenAdmin, agencyController.showAllAgency)
router.post("/create", middlewareController.verifyTokenAdmin, agencyController.createNewAgency)
module.exports = router
