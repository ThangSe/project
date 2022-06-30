const Account = require("../models/Account")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const dotenv = require('dotenv')
const Buffer = require('buffer/').Buffer
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

    generateAccessToken(account) {
        return jwt.sign({
            id: account.id,
            username: account.username,
            role: account.role
        },process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: "60s"}
        )
    }
    generateRefreshToken(account) {
        return jwt.sign({
            id: account.id,
            username: account.username,        
            role: account.role
        },process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: "1d"}
        )
    }

    async requestRefreshToken(req, res) {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) return res.status(401).json("You're not authenicated")
        const existedToken = await Account.findOne({refreshToken: refreshToken})
        if(!existedToken) return res.status(403).json("Token is not valid")
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, account) => {
            if(err) {
                console.log(err)
            }
            // create new accessToken, refreshToken
            const authController = new AuthController()
            const newAccessToken = authController.generateAccessToken(account)
            const newRefreshToken = authController.generateRefreshToken(account)
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure:false,
                path: "/",
                sameSite:"strict"
            })
            res.status(200).json({accessToken: newAccessToken})
        })
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
            const authController = new AuthController() 
            const accessToken = authController.generateAccessToken(account)
            const refreshToken = authController.generateRefreshToken(account)
            const filter = {username: account.username}
            const update = {refreshToken: refreshToken}
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure:false,
                path: "/",
                sameSite:"strict"
            })
            const {password, ...others} = account._doc
            Account.findOneAndUpdate(filter, update, {
                new: true            
            })
            .then(() => res.status(200).json({...others, accessToken}))
            .catch(next)
        }
    }
    async logout(req, res, next) {
        res.clearCookie("refreshToken")
        const token = req.headers.token
        const account = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        Account.findOneAndUpdate({username: account.username}, {refreshToken: ""}, {new: true})
                .then(() => res.status(200).send("Logout success"))
                .catch(next)
    }
}

module.exports = new AuthController()