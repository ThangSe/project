const Computer = require('../models/Computer')
class ComputerController {
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
            const computer = await Computer.findById(req.params.id).populate([
                {
                    path: 'order',
                    model: 'order',
                    select: 'totalPrice status imgComUrls orderDetails_id',
                    populate: {
                        path: 'orderDetails_id',
                        model: 'orderdetail'
                    }

                }
            ])
            res.status(200).json(computer)
        } catch (err) {
            res.status(500).json(err)
        }
        
    }

    async getComputerByCode(req, res) {
        try {
            const computer = await Computer.findOne({code: req.params.code}).populate([
                {
                    path: 'order',
                    model: 'order',
                    select: 'totalPrice status imgComUrls orderDetails_id',
                    populate: {
                        path: 'orderDetails_id',
                        model: 'orderdetail'
                    }

                }
            ])
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
    async updateComputer(req, res) {
        try {
            const existedComputer = await Computer.findOne({code: req.body.code})
            if(existedComputer && existedComputer.id != req.params.id) {
                res.status(400).json("Code máy này đã có trên hệ thống")
            }else {
                const filter = {_id: req.params.id}
                const update = {$set: req.body}
                await Computer.findByIdAndUpdate(filter, update, {new: true})
                res.status(200).json("Cập nhật máy tính thành công")
            }
        } catch (err) {
            res.status(500).json(err)
        }
        
    }

    //POST 
    
}

module.exports = new ComputerController()
