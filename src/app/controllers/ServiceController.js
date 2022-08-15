const Accessory = require('../models/Accessory')
const Service = require('../models/Service')
const Supplier = require('../models/Supplier')

class ServiceController {
    //GET /service/all-service
    showAllService(req, res, next) {
        Service.find({})
         .then(services => {
             res.json(services)
         })
         .catch(next)
    }

    //POST /service/create-service
    async createNewService(req, res) {
        try {
            const serName = req.body.name
            const existedService = await Service.findOne({name: serName})
            if(existedService) {
                res.status(404).json("Service is existed")
            }
            else {
                const service = new Service(req.body)
                const saveService = await service.save()
                res.status(200).json(saveService)
            } 
        } catch (err) {
            res.status(500).json(err)
        }
        
    }
    async getService(req,res) {
        try {
            const serviceId = req.params.serviceId
            const service= await Accessory.findById(serviceId)
            res.status(200).json(service)
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async updateService (req, res) {
        try {
            const filter = {_id: req.params.id}
            const update = {$set: req.body}
            const updateService = await Service.findByIdAndUpdate(filter, update, {new: true})
            res.status(200).json(updateService)
        } catch (err) {
            res.status(500).json(err)
        }
    }
    
 
}

module.exports = new ServiceController()
