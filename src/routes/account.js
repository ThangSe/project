const accountController = require("../app/controllers/AccountController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all", /*middlewareController.verifyTokenManager, */accountController.getAllAccounts)
router.get("/:id", accountController.getAccountById)
router.delete("/:id", middlewareController.verifyTokenAdmin, accountController.deleteAccount)
router.put('/:id', accountController.updateAccountById)
router.patch("/:id/restore", accountController.restoreAccount)
module.exports = router
