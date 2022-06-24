const Account = require("../models/Account")
const bcrypt = require("bcrypt")

class AuthController {
    async register(req, res, next) {
        const pass = req.body.password
        const hashed = await bcrypt.hash(pass, 10)
        const newAccount = await new Account({
            username: req.body.username,
            password: hashed
        })
        const account = await newAccount
        account.save()
            .then(() => res.json(account))
            .catch(next)
    }
    async login(req, res, next) {
        const account = await Account.findOne({username: req.body.username})
        if(!account) {
            return res.status(404).json("User not existed")
        }
        const validPassword = await bcrypt.compare(
            req.body.password,
            account.password
        )
        if(!validPassword) return res.status(404).json("Wrong password")
        if(account && validPassword) return res.status(200).json(account)
    }
}

module.exports = new AuthController()