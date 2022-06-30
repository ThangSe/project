const accountController = require("../app/controllers/AccountController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/", middlewareController.verifyToken, accountController.getAllAccounts)
router.delete("/:id/delete", middlewareController.verifyTokenAdmin, accountController.deleteAccount)
router.patch("/:id/restore", accountController.restoreAccount)
module.exports = router
