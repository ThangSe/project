const chartController = require("../app/controllers/ChartController")
const middlewareController = require("../app/controllers/MiddlewareController")
const router = require("express").Router()

router.post("/data-chart", chartController.dataToChart)
module.exports = router
