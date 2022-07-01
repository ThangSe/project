const Account = require("../models/Account")
const bcrypt = require("bcrypt")
class AccountController {
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
    getAccountById(req, res, next) {
        Account.findById(req.params.id).populate("booking")
            .then(account => {
                res.status(200).json(account)
            })
            .catch(next)
    }
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
}

module.exports = new AccountController()
