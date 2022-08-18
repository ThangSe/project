const jwt = require("jsonwebtoken")

const middlewareController = {
    //vertify Tokenization
    verifyToken: (req, res, next) => {
        const token = req.headers.token
        if(token) {
            const accessToken = token.split(" ")[1]
            jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, account) => {
                if(err) {
                    return res.status(403).json("Token is not valid")
                }
                req.account = account
                next()
            })
        }
        else {
            res.status(401).json("You're not authenticated")
        }
    },

    verifyTokenAdmin: (req, res, next) => {
        middlewareController.verifyToken(req,res, () => {
            if(req.account.role == "admin") {
                next()
            }
            else {
                res.status(403).json("You're not allowed to do this")
            }
        })
    },
    verifyTokenManager: (req, res, next) => {
        middlewareController.verifyToken(req,res, () => {
            if(req.account.role == "manager" || req.account.role == "admin") {
                next()
            }
            else {
                res.status(403).json("You're not allowed to do this")
            }
        })
    },
    verifyTokenStaff: (req, res, next) => {
        middlewareController.verifyToken(req,res, () => {
            if(req.account.role == "staff" || req.account.role == "manager") {
                next()
            }
            else {
                res.status(403).json("You're not allowed to do this")
            }
        })
    },
    verifyTokenCustomer: (req, res, next) => {
        middlewareController.verifyToken(req,res, () => {
            if(req.account.role == "customer") {
                next()
            }
            else {
                res.status(403).json("You're not allowed to do this")
            }
        })
    }
}

module.exports = middlewareController
