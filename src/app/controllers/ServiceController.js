const Accessory = require('../models/Accessory')
const Service = require('../models/Service')
const ServiceAccessory = require('../models/ServiceAccessory')

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
            const data = req.body
            const existedService = await Service.findOne({name: data.name})
            if(existedService) {
                res.status(404).json("Service is existed")
            }
            else {
                const service = new Service({
                    name: data.name,
                    description: data.description,
                    type: data.type,
                    price: data.price,
                    hasAccessory: data.hasAccessory
                })
                const saveService = await service.save()
                if(saveService.hasAccessory) {
                    for(const d of data.accessories) {
                        const serviceAccessory = new ServiceAccessory({
                            typeCom: d.typeCom,
                            brandCom: d.brandCom,
                            service_id: saveService.id,
                            accessory_id: d.accessory_id
                        })
                        await serviceAccessory.save()
                        await saveService.updateOne({$push: {serHasAcc: serviceAccessory.id}}, {new: true})
                        await Accessory.findByIdAndUpdate({_id: d.accessory_id}, {$push: {serHasAcc: serviceAccessory.id}})
                    }
                    res.status(200).json(saveService)                  
                } else {
                    res.status(200).json(saveService)
                }
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
