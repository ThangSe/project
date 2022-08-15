const Accessory = require('../models/Accessory')
const Supplier = require('../models/Supplier')

class AccessoriesController {
    //GET /accessory/all-accessories
    showAllAccessory(req, res, next) {
        Accessory.find({}).populate("supplier_id")
         .then(accessories => {
             res.json(accessories)
         })
         .catch(next)
    }

    //POST /accessory/create
    async createNewAccessory(req, res) {
        try {
            const accName = req.body.name
            const existedAccessory = await Accessory.findOne({name: accName})
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
