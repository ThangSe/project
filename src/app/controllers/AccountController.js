const Account = require("../models/Account")

class AccountController {
    //GET /account
    getAllAccounts(req, res, next) {
        Account.find()
            .then(accounts => {
                res.json(accounts)
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
}

module.exports = new AccountController()
