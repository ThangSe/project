const accountController = require("../app/controllers/AccountController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.get("/all"/*, middlewareController.verifyTokenManager*/, accountController.getAllAccounts)
router.get("/account-detail", accountController.getAllAccountsDetail)
router.get("/view-profile", middlewareController.verifyToken, accountController.viewOwnedProfile)
router.get("/view-booking-history", middlewareController.verifyToken, accountController.viewBookingHistory)
router.get("/:username", accountController.getAccountByUsername)
router.get("/all/lastest-account", middlewareController.verifyTokenManager, accountController.showLastestAccount)
router.get("/byId/:id", /*middlewareController.verifyTokenManager,*/ accountController.getAccountById)
router.delete("/:id", middlewareController.verifyTokenAdmin, accountController.deleteAccount)
router.patch('/:id', /*middlewareController.verifyTokenManager,*/ accountController.updateAccountById)
router.patch("/:id/restore", middlewareController.verifyTokenManager,  accountController.restoreAccount)
router.patch("/editprofile",  middlewareController.verifyToken, accountController.updateProfileAccount)
router.post("/register-staff", accountController.registerAccountStaff)
router.patch("/editimgprofile", middlewareController.verifyToken, accountController.updateImgProfileAccount)
module.exports = router
