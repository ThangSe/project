const Account = require("../models/Account")
const Agency = require("../models/Agency")
const User = require("../models/User")
const bcrypt = require("bcrypt")
const Buffer = require('buffer/').Buffer
class AccountController {
    //Register manager accounts
    //POST /account/register
    async registerAccountStaff(req, res) {
        try {
            const pass = req.body.password
            const hashed = await bcrypt.hash(pass, 10)
            const username = req.body.username
            const role = req.body.role
            const agency_id  = req.body.agency_id
            const existedAccount = await Account.findOne({ username: username })
            if (existedAccount) return res.status(404).json("user is existed")
            const newAccount = await new Account({
                username,
                password: hashed,
                role,
                agency_id
            })
            const account = await newAccount
            const saveAccount = await account.save()
            const user = new User({phonenum: username})
            const saveUser = await user.save()
            const updateUser = await User.findById(saveUser.id)
            await updateUser.updateOne({$set: {acc_id: saveAccount.id}})
            if(saveAccount.id) {
                const agency = Agency.findById(agency_id)
                const account = Account.findById(saveAccount.id)
                await account.updateOne({$set: {user_id: saveUser._id}})
                await agency.updateOne({$push: {staff_id: saveAccount.id}})
            }
            res.status(200).json(saveAccount)
        } catch (err) {
            res.status(500).json(err)
        }
        
    }
    //GET /account
    getAllAccounts(req, res, next) {
        Account.find({})
            .then(accounts => {
                res.status(200).json(accounts)
            })
            .catch(next)
    }
    //DELETE /account/:id
    deleteAccount(req, res, next) {
        Account.delete({_id: req.params.id})
            .then(() => res.json("Delete successfully"))
            .catch(next)
    }
    //PATCH /account/:id/restore
    restoreAccount(req, res, next) {
        Account.restore({_id: req.params.id})
            .then(() => res.json("Restore successfully"))
            .catch(next)
    }
    //GET /account/:id
    getAccountById(req, res, next) {
        Account.findById(req.params.id).populate("booking").populate("user_id")
            .then(account => {
                res.status(200).json(account)
            })
            .catch(next)
    }
    //PATCH /account/:id
    async updateAccountById(req, res) {
        try {
            const pass = req.body.password
            const hashed = await bcrypt.hash(pass, 10)
            const account = await Account.findById(req.params.id)
            await account.updateOne({$set: {"password": hashed}})
            res.status(200).json("Update successfully")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    //PUT /account/editprofile
    async updateProfileAccount(req, res) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const user = User.findOne({acc_id: acc_id})
            await user.updateOne({$set: req.body})
            res.status(200).json("Update profile successfully")
        } catch (err) {
            res.status(500).json(err)
        }
    }
}

module.exports = new AccountController()
