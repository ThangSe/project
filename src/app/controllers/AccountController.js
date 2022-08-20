const Account = require("../models/Account")
const Agency = require("../models/Agency")
const User = require("../models/User")
const bcrypt = require("bcrypt")
const Buffer = require('buffer').Buffer
const mongoose = require('mongoose')
const multer = require('multer')
const {GridFsStorage} = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const crypto = require('crypto')
const path = require('path')

const conn = mongoose.createConnection(process.env.DB_CONNECTION)
let gfs, gridfsBucket
conn.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
      })
    gfs = Grid(conn.db, mongoose.mongo)
    gfs.collection('uploads')
})

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
    //GET
    getAllCusAccount(req, res, next) {
        Account.find({role: "customer"}).populate("user_id")
            .then(accounts => {
                res.status(200).json(accounts)
            })
            .catch(next)
    }
    //GET
    getAllStaffAccount(req, res, next) {
        Account.find({role: "staff"}).populate("user_id")
            .then(accounts => {
                res.status(200).json(accounts)
            })
            .catch(next)
    }
    //GET
    getAllManagerAccount(req, res, next) {
        Account.find({role: "manager"}).populate("user_id")
            .then(accounts => {
                res.status(200).json(accounts)
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
            const newPass = req.body.newpass
            const repeatPass = req.body.repeatpass
            const account = await Account.findById(acc_id)
            const validOldPass = await bcrypt.compare(
                oldPass,
                account.password
            )
            const validRepeatPass  = await bcrypt.compare(
                repeatPass,
                newPass
            )
            if(newPass.localeCompare(repeatPass)) {
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
            const user = await User.findOne({acc_id: acc_id})
            await user.updateOne({$set: req.body})
            res.status(200).json("Cập nhật trang cá nhân thành công")
        } catch (err) {
            res.status(500).json(err)
        }
    }
    //PATCH /account/editimgprofile (customer)
    async deleteImgProfileAccount(req, res, next) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const user = await User.findOne({acc_id:acc_id})
            if(user.imgURL){
                const filename = user.imgURL.replace("https://computer-services-api.herokuapp.com/account/avatar/","")
                // const file = await gfs.files.findOne({filename: filename})
                // console.log(file.id)
                await gfs.files.deleteOne({filename: filename})
                // await gfs.chunks.deleteOne({files_id: file.id})
                next()
            }else {
                next()
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async updateImgProfileAccount(req, res) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_id = accountInfo.id
            const user = await User.findOne({acc_id:acc_id})  
            const storage = new GridFsStorage({
                url: process.env.DB_CONNECTION,
                file: (req, file) => {
                    return new Promise((resolve, reject) => {
                        crypto.randomBytes(16, (err, buf) => {
                            if(err) {
                            return reject(err)
                            }
                            const filename = buf.toString('hex') + path.extname(file.originalname)
                            const fileInfo = {
                            filename: filename,
                            bucketName: 'uploads'
                            }
                            resolve(fileInfo)
                        })
                    })
                }
                })
            const upload = multer({
                storage,
                limits: {fileSize: 1 * 1024 * 1024 },
                fileFilter: (req, file, cb) => {
                    if(file.mimetype == "image/png" || file.mimetype == "image/jpeg" || file.mimetype == "image/jpg"){
                        cb(null, true)
                    }else {
                        cb(null, false)
                        const err = new Error('Only .png, .jpg and .jpeg format allowed')
                        err.name = 'ExtensionError'
                        return cb(err)
                    }
                }
            }).single('img')
            upload(req, res, async(err) => {
                if(err instanceof multer.MulterError) {
                    res.status(500).json({err: { message: `Multer uploading error: ${err.message}` }}).end()
                    return
                } else if(err) {
                    if(err.name == 'ExtensionError') {
                        res.status(413).json({ error: { message: err.message } }).end()
                    } else {
                        res.status(500).json({ error: { message: `unknown uploading error: ${err.message}` } }).end()
                    }
                    return
                }
                const URL = "https://computer-services-api.herokuapp.com/account/avatar/"+req.file.filename
                await user.updateOne({$set: {imgURL: URL}})
                res.status(200).json('Upload success') 
            })                 
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async getAvatar(req, res) {
        try {
            await gfs.files.findOne({ filename: req.params.filename } , (err, file) => {
                // Check if file
                if (!file || file.length === 0) {
                  return res.status(404).json({
                    err: 'No file exists'
                  });
                }
                
                // Check if image
                if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
                  // Read output to browser
                  const readstream = gridfsBucket.openDownloadStream(file._id);
                  readstream.pipe(res)
                } else {
                  res.status(404).json({
                    err: 'Not an image'
                  })
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
