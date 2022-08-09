const Accessory = require('../models/Accessory')
const Supplier = require('../models/Supplier')

class AccessoriesController {
    //GET /accessory/all-accessories
    showAllAccessory(req, res, next) {
        Accessory.find({}).populate("service_id").populate("supplier_id")
         .then(accessories => {
             res.json(accessories)
         })
         .catch(next)
    }

    //POST /accessory/create
    async createNewAccessory(req, res) {
        try {
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
            const accessoryId = req.body.accessoryId
            const accessory = await Accessory.findById({accessoryId})
            res.status(200).json(accessory)
        } catch (err) {
            res.status(500).json(err)
        }
    }
}

module.exports = new AccessoriesController()
