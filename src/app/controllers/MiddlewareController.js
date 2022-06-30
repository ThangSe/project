const jwt = require("jsonwebtoken")

const middlewareController = {
    //vertify Tokenization
    verifyToken: (req, res, next) => {
        const token = req.headers.token
        if(token) {
            const accessToken = token.split(" ")[1]
            jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, account) => {
                if(err) {
                    res.status(403).json("Token is not valid")
                }
                req.account = account
                next()
            })
        }
        else {
            res.status(401).json("You're not authenticated")
        }
    },

    verifyDeleteTokenAdmin: (req, res, next) => {
        middlewareController.verifyToken(req,res, () => {
            if(req.account.id == req.params.id || req.account.role == "admin") {
                next()
            }
            else {
                res.status(403).json("You're not allowed to delete other")
            }
        })
    }
}

module.exports = middlewareController
