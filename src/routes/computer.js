const computerController = require("../app/controllers/ComputerController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all-computers", middlewareController.verifyTokenManager, computerController.showAllComputer)
router.get("/computer-by-id/:id", middlewareController.verifyTokenManager, computerController.getComputerById)
router.get("/computer-by-code/:ccode", middlewareController.verifyTokenStaff, computerController.getComputerByCode)
router.post("/new-computer", middlewareController.verifyTokenManager, computerController.createComputer)

module.exports = router
