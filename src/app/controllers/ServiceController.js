const Accessory = require('../models/Accessory')
const Service = require('../models/Service')

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
        } catch (err) {
            res.status(500).json(err)
        }
        
    }


}

module.exports = new ServiceController()
