const Account = require("../models/Account")
const Agency = require("../models/Agency")
const User = require("../models/User")
const Booking = require("../models/Booking")
const bcrypt = require("bcrypt")
const Buffer = require('buffer/').Buffer
const multer = require('multer')
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
            if (existedAccount) return res.status(404).json("Người dùng đã tồn tại")
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
    //GET /account/all
    getAllAccounts(req, res, next) {
        Account.find({}).populate("booking")
            .then(accounts => {
                res.status(200).json(accounts)
            })
            .catch(next)
    }
    //GET /account/account-detail
    getAllAccountsDetail(req, res, next) {
        Account.find({}).populate("booking").populate("user_id")
            .then(accounts => {
                res.status(200).json(accounts)
            })
            .catch(next)
    }
    //GET /account/username
    getAccountByUsername(req, res, next) {
        Account.findOne({username: req.params.username}).populate("user_id")
            .then(account => {
                res.status(200).json(account)
            })
            .catch(next)
    }
    showLastestAccount (req, res, next) {
        Account.find().sort({_id:-1}).limit(10)
            .then(accounts => {
                res.json(accounts)
            })
            .catch(next)
    }
    //DELETE /account/:id
    deleteAccount(req, res, next) {
        Account.delete({_id: req.params.id})
            .then(() => res.json("Xóa tài khoản thành công"))
            .catch(next)
    }
    //PATCH /account/:id/restore
    restoreAccount(req, res, next) {
        Account.restore({_id: req.params.id})
            .then(() => res.json("Khôi phục tài khoản thành công"))
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
    //PATCH /change-password change password(customer)
    async updateAccountById(req, res) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const oldPass = req.body.oldpass
            const repeatPass = req.body.repeatpass
            const newPass = req.body.newpass
            const account = await Account.findById(acc_id)
            const validOldPass = await bcrypt.compare(
                oldPass,
                account.password
            )
            const validRepeatPass  = await bcrypt.compare(
                repeatPass,
                account.password
            )
            if(oldPass.localeCompare(repeatPass)) {
                return res.status(404).json("Mật khẩu nhập lại không trùng khớp")
            }
            else if(!validOldPass) {
                return res.status(404).json("Sai mật khẩu")
            }
            else if (validOldPass && validRepeatPass) {
                const hashed = await bcrypt.hash(newPass, 10)     
                await account.updateOne({$set: {"password": hashed}})
                res.status(200).json("Cập nhật thành công")
            }    
        } catch (err) {
            res.status(500).json(err)
        }
    }
    //GET /account/view-profile (customer)
    async viewOwnedProfile(req, res) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const account = await Account.findById(acc_id).populate("user_id")
            res.status(200).json(account.user_id)
        } catch (err) {
            res.status(500).json(err)
        }
    }
    //PATCH /account/editprofile (customer)
    async updateProfileAccount(req, res) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const user = User.findOne({acc_id: acc_id})
            await user.updateOne({$set: req.body})
            res.status(200).json("Cập nhật trang cá nhân thành công")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    //PATCH /account/editimgprofile (customer)
    async updateImgProfileAccount(req, res) {
        try {
            const storage = multer.diskStorage({
                destination: "uploads",
                filename: (req, file, cb) => {
                    cb(null, file.originalname)
                }
            })
            const upload = multer({
                storage: storage
            }).single('img')
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const user = await User.findOne({acc_id: acc_id})
            upload(req, res, (err)=>{
                if(err) {
                    return res.status(500).json(err)
                }
                else {
                    user.updateOne({$set: {img: {data: req.file.filename, contentType: "image/png"}}})
                    return res.status(200).json("Upload success")
                }
            })       
        } catch (err) {
            res.status(500).json(err)
        }
    }
    //GET /account/view-booking-history (customer)
    async viewBookingHistory(req, res) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const account = await Account.findById(acc_id).populate("booking")
            res.status(200).json(account.booking)
        } catch (err) {
            res.status(500).json(err)
        }
    }
}

module.exports = new AccountController()
