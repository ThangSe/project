const Account = require("../models/Account")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const dotenv = require('dotenv')
dotenv.config()

class AuthController {
    async register(req, res, next) {
        const pass = req.body.password
        const hashed = await bcrypt.hash(pass, 10)
        const username = req.body.username
        const existedAccount = await Account.findOne({username: username})
        if(existedAccount) return res.status(404).json("user is existed")
        const newAccount = await new Account({
            username: username,
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
        if(account && validPassword) {
            const accessToken = jwt.sign({
                id: account.id,
                role: account.role
            },process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: "60s"}
            )
            const {password, ...others} = account._doc
            return res.status(200).json({...others, accessToken})
        }
    }
}

module.exports = new AuthController()