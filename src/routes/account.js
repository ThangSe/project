const accountController = require("../app/controllers/AccountController")
const middlewareController = require("../app/controllers/MiddlewareController")
const imgFunc = require("../config/db/upload")
const router = require("express").Router()

router.get("/all/lastest-account", middlewareController.verifyTokenManager, accountController.showLastestAccount)
router.get("/all", middlewareController.verifyTokenManager, accountController.getAllAccounts)
router.get("/all-customer", middlewareController.verifyTokenManager, accountController.getAllCusAccount)
router.get("/all-staff", middlewareController.verifyTokenManager, accountController.getAllStaffAccount)
router.get("/all-manager", middlewareController.verifyTokenManager, accountController.getAllManagerAccount)
router.get("/account-with-detail", middlewareController.verifyTokenManager, accountController.getAllAccountsDetail)
router.get("/view-profile", middlewareController.verifyToken, accountController.viewOwnedProfile)
router.get("/view-booking-history", middlewareController.verifyToken, accountController.viewBookingHistory)
router.patch("/change-password", middlewareController.verifyToken, accountController.updateAccountById)
router.patch("/editprofile", middlewareController.verifyToken, accountController.updateProfileAccount)
router.post("/register-staff", accountController.registerAccountStaff)
router.post("/editimgprofile",middlewareController.verifyToken,accountController.deleteImgProfileAccount, accountController.updateImgProfileAccount)
router.get("/avatar/:filename", imgFunc.getImg)
router.get("/byId/:id", middlewareController.verifyTokenManager, accountController.getAccountById)
router.patch("/restored-account/:id", middlewareController.verifyTokenManager,  accountController.restoreAccount)
router.delete("deleted-account/:id", middlewareController.verifyTokenManager, accountController.deleteAccount)
router.get("/:username", middlewareController.verifyTokenManager, accountController.getAccountByUsername)
module.exports = router
