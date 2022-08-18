const Accessory = require('../models/Accessory')
const ServiceAccessory = require('../models/ServiceAccessory')
const Supplier = require('../models/Supplier')
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

class AccessoriesController {
    //GET /accessory/all-accessories
    showAllAccessory(req, res, next) {
        Accessory.find({}).populate("supplier_id")
         .then(accessories => {
             res.json(accessories)
         })
         .catch(next)
    }
    
    async showAllAccessoryByType(req, res) {
        try {
            const type = req.body.type
            const serId = req.body.serviceId
            const existedBridge = await ServiceAccessory.find({typeCom: type, _id: serId})
            if(existedBridge){
                const existedAccId = []
                for(e of existedBridge) {
                    existedAccId.push(accessory_id)
                }
                const accessories = await Accessory.find().where('_id').nin(existedAccId).populate({
                    path: 'supplier_id',
                    model: 'supplier',
                    select: 'name'
                })
                res.status(200).json(accessories)
            } else {
                const accessories = await Accessory.find({type: type}).populate({
                    path: 'supplier_id',
                    model: 'supplier',
                    select: 'name'
                })
                res.status(200).json(accessories)
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

    //POST /accessory/
    async createNewAccessory(req, res) {
        try {
            const name = req.body.name
            const existedAccessory = await Accessory.findOne({name: name})
            if(existedAccessory) {
                res.status(404).json("Accessory is existed")
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

    async updateImgAccessories(req, res) {
        try {
            const storage = new GridFsStorage({
                url: process.env.DB_CONNECTION,
                file: (req, file) => {
                    return new Promise((resolve, reject) => {
                        if(err) {
                        return reject(err)
                        }
                        const filename = Date.now() + '-' + file.originalname
                        const fileInfo = {
                        filename: filename,
                        bucketName: 'uploads'
                        }
                        resolve(fileInfo)
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
            }).array('uploadedImages', 10)
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
                const AccessoryId = req.params.id
                const URL = "https://computer-services-api.herokuapp.com/accessory-img/"+req.file.filename
                await Accessory.findByIdAndUpdate({_id: AccessoryId}, {imgURL: URL})
                res.status(200).json('Upload success')   
            })    
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async getImg(req, res) {
        try {
            const file = await gfs.file.findOne({ filename: req.params.filename }, (err, file) => {
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
            const accessoryId = req.params.accessoryId
            const accessory = await Accessory.findById({accessoryId})
            res.status(200).json(accessory)
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async getAllAccessoryForCus(req, res) {
        try {
            //sort by price
            const {page = 1, limit = 20, sort, name, type} = req.query
            let accessories = await Accessory.find().limit(limit * 1).skip((page - 1) * limit)
            let count = await Accessory.find().count()/10
            if(sort && name && type) {
                if(sort == "desc") {
                    accessories = await Accessory.find({type: type, name : { $regex: name, $options: 'i'}}).sort({price: -1}).limit(limit * 1).skip((page - 1) * limit)
                    return res.status(200).json({count: Math.ceil(count), accessories})
                }else {
                    accessories = await Accessory.find({type: type, name : { $regex: name, $options: 'i'}}).sort({price: 1}).limit(limit * 1).skip((page - 1) * limit)
                    return res.status(200).json({count: Math.ceil(count), accessories})
                }
            }else if(sort && type) {
                if(sort == "desc") {
                    accessories = await Accessory.find({type: type}).sort({price: -1}).limit(limit * 1).skip((page - 1) * limit)
                    return res.status(200).json({count: Math.ceil(count), accessories})
                }else {
                    accessories = await Accessory.find({type: type}).sort({price: 1}).limit(limit * 1).skip((page - 1) * limit)
                    return res.status(200).json({count: Math.ceil(count), accessories})
                }
            }else if(sort && name) {
                if(sort == "desc") {
                    accessories = await Accessory.find({name : { $regex: name, $options: 'i'}}).sort({price: -1}).limit(limit * 1).skip((page - 1) * limit)
                    return res.status(200).json({count: Math.ceil(count), accessories})
                }else {
                    accessories = await Accessory.find({name : { $regex: name, $options: 'i'}}).sort({price: 1}).limit(limit * 1).skip((page - 1) * limit)
                    return res.status(200).json({count: Math.ceil(count), accessories})
                }
            }else if(sort) {
                if(sort == "desc") {
                    accessories = await Accessory.find().sort({price: -1}).limit(limit * 1).skip((page - 1) * limit)
                    return res.status(200).json({count: Math.ceil(count), accessories})
                }else {
                    accessories = await Accessory.find().sort({price: 1}).limit(limit * 1).skip((page - 1) * limit)
                    return res.status(200).json({count: Math.ceil(count), accessories})
                }
            }else if(name) {
                accessories = await Accessory.find({name : { $regex: name, $options: 'i'}}).sort({price: 1}).limit(limit * 1).skip((page - 1) * limit)
                return res.status(200).json({count: Math.ceil(count), accessories})
            }else if(type){
                accessories = await Accessory.find({type: type}).sort({price: 1}).limit(limit * 1).skip((page - 1) * limit)
                return res.status(200).json({count: Math.ceil(count), accessories})
            }else{
                return res.status(200).json({count: Math.ceil(count), accessories})
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async updateAccessory (req, res) {
        try {
            const filter = {_id: req.params.id}
            const update = {$set: req.body}
            const updateAccessory = await Accessory.findByIdAndUpdate(filter, update, {new: true})
            res.status(200).json(updateAccessory)
        } catch (err) {
            res.status(500).json(err)
        }
    }
}

module.exports = new AccessoriesController()
