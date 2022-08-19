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
                    brand: data.brand,
                    hasAccessory: data.hasAccessory
                })
                const saveService = await service.save()
                if(saveService.hasAccessory) {
                    for(const d of data.accessories) {
                        const serviceAccessory = new ServiceAccessory({
                            typeCom: d.typeCom,
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
    async deleteAllDetailService(req, res, next) {
        try {
            const service = await Service.findById(req.params.id)
            if(service.serHasAcc.lengh>0){
                for(const bridgeId of service.serHasAcc) {
                    const bridge = await ServiceAccessory.findById(bridgeId)
                    await Accessory.findByIdAndUpdate({_id: bridge.accessory_id}, {$pull: {serHasAcc: bridge.id}})
                    await ServiceAccessory.deleteOne({_id: bridgeId})
                    await service.updateOne({$pull: {serHasAcc: bridge.id}})
                }
                next()
            } else {
                next()
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }
    async updateNewDetailService(req, res) {
        try {
            const serId = req.params.id
            const data = req.body
            const service = await Service.findById(serId)
            if(service.hasAccessory) {
                await service.updateOne({
                    name: data.name,
                    description: data.description,
                    type: data.type,
                    price: data.price,
                    brand: data.brand
                })
                for(const d of data.accessories) {
                    const serviceAccessory = new ServiceAccessory({
                        typeCom: d.typeCom,
                        service_id: saveService.id,
                        accessory_id: d.accessory_id
                    })
                    await serviceAccessory.save()
                    await service.updateOne({$push: {serHasAcc: serviceAccessory.id}}, {new: true})
                    await Accessory.findByIdAndUpdate({_id: d.accessory_id}, {$push: {serHasAcc: serviceAccessory.id}})
                }
                res.status(200).json("Cap nhat thanh cong")                  
            } else {
                await service.updateOne(data)
                res.status(200).json("Cap nhat thanh cong")
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
    async addMoreAccessoriesToService(req, res) {
        try {
            const serId = req.params.serviceId
            const data  = req.body
            for(const d of data.accessories) {
                const existedBridge = await ServiceAccessory.find({service_id: serId, accessory_id: d.accessory_id})
                if(!existedBridge) {
                    const serviceAccessory = new ServiceAccessory({
                        typeCom: d.typeCom,
                        service_id: saveService.id,
                        accessory_id: d.accessory_id
                    })
                    await serviceAccessory.save()
                    await Service.findByIdAndUpdate({_id: serId},{$push: {serHasAcc: serviceAccessory.id}})
                    await Accessory.findByIdAndUpdate({_id: d.accessory_id}, {$push: {serHasAcc: serviceAccessory.id}})
                }
            }
            res.status(200).json("Cap nhat thanh cong")
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async showAllAccessoriesOfSerive(req, res) {
        try {
            const serId = req.params.serviceId
            const serHasAccessory = await Service.findOne({_id: serId, hasAccessory: true}).populate([
                {
                    path: 'serHasAcc',
                    model: 'serviceaccessory',
                    select: 'accessory_id',
                    populate: {
                        path: 'accessory_id',
                        model: 'accessory',
                        select: 'name price type component description insurance',
                    }
                }
            ])
            res.status(200).json(serHasAccessory)
        } catch (err) {
            res.status(500).json(err)
        }
    }
 
}

module.exports = new ServiceController()
