const _ = require('lodash')
const Accessory = require('../models/Accessory')
const Supplier = require('../models/Supplier')
const multer = require('multer')
const {storage, fileFind, deletedFile} = require('../../config/db/upload')

class AccessoriesController {
    //GET /accessory/all-accessories
    showAllAccessory(req, res, next) {
        Accessory.findWithDeleted().populate("supplier_id")
        .then(accessories => {
            res.json(accessories)
        })
        .catch(next)
    }
    
    async showAllAccessoryByType(req, res) {
        try {
            const type = req.body.type
            const accessories = await Accessory.find({type: type}).populate({
                path: 'supplier_id',
                model: 'supplier',
                select: 'name'
            })
            res.status(200).json(accessories)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    //POST /accessory/
    async createNewAccessory(req, res) {
        try {
            const name = req.body.name
            const existedAccessory = await Accessory.findOneWithDeleted({name: name})
            if(existedAccessory) {
                res.status(404).json("Linh kiện đã tồn tại. Xin thử lại")
            }
            else {
                const accessory = new Accessory(req.body)
                const saveAccessory = await accessory.save()
                if(req.body.supplier_id) {
                const filter = {_id: req.body.supplier_id}
                const update = {$push: {accessories_id: saveAccessory._id}}
                await Supplier.findOneAndUpdate(filter, update, {
                    new: true
                }) 
                }
                res.status(200).json(saveAccessory)                
            }
        } catch (err) {
            res.status(500).json(err)
        }  
    }

    async deleteImgAccessories(req, res, next) {
        try {
            const accessoryId = req.params.id
            const accessory = await Accessory.findById(accessoryId)
            if(accessory.imgURL){
                const filename = accessory.imgURL.replace("https://computer-services-api.herokuapp.com/accessory/accessory-img/","")
                const file = await fileFind(filename)
                if(file){
                    await deletedFile(file)
                }
                next()
            }else {
                next()
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async updateImgAccessories(req, res) {
        try {
            const upload = multer({
                storage,
                limits: {fileSize: 1 * 1024 * 1024 },
                fileFilter: (req, file, cb) => {
                    if(file.mimetype == "image/png" || file.mimetype == "image/jpeg" || file.mimetype == "image/jpg"){
                        cb(null, true)
                    }else {
                        cb(null, false)
                        const err = new Error('Chỉ nhận định dạng .png, .jpg và .jpeg')
                        err.name = 'ExtensionError'
                        return cb(err)
                    }
                }
            }).single('img')
            upload(req, res, async(err) => {
                if(err instanceof multer.MulterError) {
                    res.status(500).json(`Multer uploading error: ${err.message}`).end()
                    return
                } else if(err) {
                    if(err.name == 'ExtensionError') {
                        res.status(413).json(err.message).end()
                    } else {
                        res.status(500).json(`unknown uploading error: ${err.message}`).end()
                    }
                    return
                }
                const AccessoryId = req.params.id
                const URL = "https://computer-services-api.herokuapp.com/accessory/accessory-img/"+req.file.filename
                await Accessory.findByIdAndUpdate({_id: AccessoryId}, {$set: {imgURL: URL}})
                res.status(200).json('Tải ảnh thành công')   
            })    
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async createSupplier(req, res) {
        try {
            const supplier = new Supplier(req.body)
            const saveSupplier = await supplier.save()
            res.status(200).json(saveSupplier)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async getAccessory(req,res) {
        try {
            const accessoryId = req.params.id
            const accessory = await Accessory.findById(accessoryId)
            res.status(200).json(accessory)
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async getAllAccessoryForCus(req, res) {
        try {
            //sort by price
            const {page = 1, limit = 20, sort = "asc", name, type, isHot = "asc"} = req.query
            let accessories
            let count = await Accessory.find().count()/10
            const isHotAcc = (accessories) => {
                const a = _.orderBy(accessories, [function(accessory) {
                    return accessory.orderdetail_id.length
                }, 'price'], [isHot, sort])
                return a
            }
            let sortedAcc
            if(name && type) {
                accessories = await Accessory.find({type: type, name : { $regex: name, $options: 'i'}}).limit(limit * 1).skip((page - 1) * limit)
                sortedAcc = isHotAcc(accessories)
                return res.status(200).json({count: Math.ceil(count), sortedAcc})
            }else if(name) {
                accessories = await Accessory.find({name : { $regex: name, $options: 'i'}}).limit(limit * 1).skip((page - 1) * limit)
                sortedAcc = isHotAcc(accessories)
                return res.status(200).json({count: Math.ceil(count), sortedAcc})
            }else if(type){
                accessories = await Accessory.find({type: type}).limit(limit * 1).skip((page - 1) * limit)
                sortedAcc = isHotAcc(accessories)
                return res.status(200).json({count: Math.ceil(count), sortedAcc})
            }else{
                accessories = await Accessory.find().limit(limit * 1).skip((page - 1) * limit)
                sortedAcc = isHotAcc(accessories)
                return res.status(200).json({count: Math.ceil(count), sortedAcc})
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async updateAccessory (req, res) {
        try {
            const existedAccessory = await Accessory.findOne({name: req.body.name})
            if(existedAccessory && existedAccessory.id != req.params.id) {
                res.status(400).json("Tên linh kiện đã tồn tại")
            } else{
                const update = {$set: req.body}
                const accessory = await Accessory.findById(req.params.id)
                if(accessory){
                    await accessory.updateOne(update)
                    res.status(200).json("Cập nhật linh kiện thành công")
                }else {
                    res.status(400).json("Linh kiện không còn khả dụng")
                }
            }        
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async getAccessoryManager(req, res) {
        try {
            const accessory = await Accessory.findOneWithDeleted({_id: req.params.id}).populate("supplier_id")
            res.status(200).json(accessory)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async deleteAccessory(req, res) {
        try {
            const existedAccessory = await Accessory.findById(req.params.id)
            if(existedAccessory) {
                await existedAccessory.delete()
                res.status(200).json("Xóa linh kiện thành công")
            } else {
                res.status(400).json("Linh kiện không hoạt động")
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async restoreAccessory(req, res) {
        try {
            const existedAccessory = await Accessory.findById(req.params.id)
            if(existedAccessory) {
                res.status(400).json("Linh kiện vẫn còn hoạt động")
            } else {
                await Accessory.restore({_id: req.params.id})
                res.status(200).json("Khôi phục dữ liệu thành công")
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }
}

module.exports = new AccessoriesController()
