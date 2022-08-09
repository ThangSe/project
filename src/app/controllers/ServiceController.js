const Accessory = require('../models/Accessory')
const Service = require('../models/Service')
const Supplier = require('../models/Supplier')

class ServiceController {
    //GET /service/all-service
    showAllService(req, res, next) {
        Service.find({}).populate("accessories_id")
         .then(services => {
             res.json(services)
         })
         .catch(next)
    }

    //POST /service/create-service
    async createNewService(req, res) {
        try {
            const serName = req.body.servicename
            const existedService = await Service.findOne({name: serName})
            if(existedService) {
                res.status(404).json("Service is existed")
            }
            else {
                const service = new Service(req.body)
                const saveService = await service.save()
                if(saveService.hasAccessory) {
                const filter = {_id: req.body.accessories_id}
                const update = {$set: {service_id: saveService._id}}
                await Accessory.findOneAndUpdate(filter, update, {
                    new: true
                }) 
                }
                res.status(200).json(saveService)
            } 
        } catch (err) {
            res.status(500).json(err)
        }
        
    }
    async getService(req,res) {
        try {
            
        } catch (err) {
            
        }
    }
    async updateService (req, res) {
        const filter = {_id: req.params.id}
        const update ={}
    }
    
 
}

module.exports = new ServiceController()
