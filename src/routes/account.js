const accountController = require("../app/controllers/AccountController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all", middlewareController.verifyTokenManager, accountController.getAllAccounts)
router.get("/:id", /*middlewareController.verifyTokenManager,*/ accountController.getAccountById)
router.delete("/:id", middlewareController.verifyTokenAdmin, accountController.deleteAccount)
router.patch('/:id', middlewareController.verifyTokenManager, accountController.updateAccountById)
router.patch("/:id/restore", middlewareController.verifyTokenManager,  accountController.restoreAccount)
router.put("/editprofile",  accountController.updateProfileAccount)
router.post("/register-staff", accountController.register)
module.exports = router
