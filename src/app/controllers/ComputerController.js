const Computer = require('../models/Computer')
class ServiceController {
    //GET 
    showAllComputer(req, res, next) {
        Computer.find({})
         .then(computers => {
             res.json(computers)
         })
         .catch(next)
    }

    async getComputerById(req, res) {
        try {
            const computer = await Computer.findById(req.params.id)
            res.status(200).json(computer)
        } catch (err) {
            res.status(500).json(err)
        }
        
    }

    async getComputerByCode(req, res) {
        try {
            const computer = await Computer.findOne({code: req.params.code})
            res.status(200).json(computer)
        } catch (err) {
            res.status(500).json(err)
        }
        
    }

    async createComputer(req, res) {
        try {
            const computer = new Computer(req.body)
            const existedComputer = await Computer.findOne({code: req.body.code})
            if(existedComputer) {
                return res.status(400).json("Đã có dữ liệu của máy tính này")
            }else {
                const saveComputer = await computer.save()
                return res.status(200).json(saveComputer)
            }
        } catch (err) {
            res.status(500).json(err)
        }
        
    }

    //POST 
    
}

module.exports = new ServiceController()
