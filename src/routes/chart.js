const chartController = require("../app/controllers/ChartController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.post("/data-chart", middlewareController.verifyTokenManager, chartController.dataToChart)
router.get("/data-for-dashboard", middlewareController.verifyTokenManager, chartController.dataForDashboard)
module.exports = router
