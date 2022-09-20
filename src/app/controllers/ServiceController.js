const Service = require('../models/Service')
const {rightTime} = require('../../config/helper/index')

class ServiceController {
    //GET /service/all-service
    async showAllService(req, res) {
        try {
            const token = req.headers.token
            const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
            const acc_role = accountInfo.role
            if(acc_role == 'customer' || acc_role == 'staff') {
                const services = await Service.find()
                res.status(200).json(services)
            } else {
                const services = await Service.findWithDeleted()
                res.status(200).json(services)
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }

    //POST /service/create-service
    async createNewService(req, res) {
        try {
            const data = req.body
            const existedService = await Service.findOneWithDeleted({name: data.name})
            if(existedService) {
                res.status(404).json("Service is existed")
            }
            else {
                const service = new Service(data)
                const saveService = await service.save()
                res.status(200).json(saveService)  
            } 
        } catch (err) {
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
        }
        
    }
    async updateService(req, res) {
        try {
            const existedService = await Service.findOne({name: req.body.name})
            if(existedService && existedService.id != req.params.id) {
                res.status(400).json("Tên dịch vụ đã tồn tại")
            } else{
                const update = {$set: req.body}
                const service = await Service.findById(req.params.id)
                if(service){
                    await service.updateOne(update)
                    res.status(200).json("Cập nhật dịch vụ thành công")
                }else {
                    res.status(400).json("Dịch vụ không còn khả dụng")
                }
            }        
        } catch (err) {
            if(err.name === "ValidationError") {
                res.status(500).json(Object.values(err.errors).map(val => val.message))
            } else {
                res.status(500).json(err)
            }
        }
    }

    async getService(req,res) {
        try {
            const serviceId = req.params.id
            const service= await Service.findById(serviceId)
            res.status(200).json(service)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async getServiceManager(req, res) {
        try {
            const service = await Service.findOneWithDeleted({_id: req.params.id})
            res.status(200).json(service)
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async deleteService(req, res) {
        try {
            if(rightTime()) {
                const existedService = await Service.findById(req.params.id)
                if(existedService) {
                    await existedService.delete()
                    res.status(200).json("Xóa dịch vụ thành công")
                } else {
                    res.status(400).json("Dịch vụ không hoạt động")
                }
            } else {
                res.status(400).json("Không thể xóa trong giờ làm việc")
            }            
        } catch (err) {
            res.status(500).json(err)
        }
    }

    async restoreService(req, res) {
        try {
            const existedService = await Service.findById(req.params.id)
            if(existedService) {
                res.status(400).json("Dịch vụ vẫn còn hoạt động")
            } else {
                await Service.restore({_id: req.params.id})
                res.status(200).json("Khôi phục dữ liệu thành công")
            }
        } catch (err) {
            res.status(500).json(err)
        }
    }
 
}

module.exports = new ServiceController()
