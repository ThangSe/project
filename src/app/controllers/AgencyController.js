const Account = require("../models/Account")
const Agency  = require("../models/Agency")
class AgencyController {
    //GET /agency/all
    showAllAgency(req, res, next) {
        Agency.find({})
         .then(agencies => {
             res.json(agencies)
         })
         .catch(next)
     }
    async createNewAgency(req, res) {
        try {
             const token = req.headers.token
             const accountInfo = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
             const acc_id = accountInfo.id
             const agency = new Agency(req.body)
             const saveAgency = await agency.save()
             const updateAgency = await Agency.findById(saveAgency.id)
             await updateAgency.updateOne({$push: {admin_id: acc_id}}, {new: true})
             if(acc_id) {
                const filter = {_id: acc_id}
                const update = {$push: {agency_id: saveAgency._id}}
                await Account.findOneAndUpdate(filter, update, {
                    new: true
                }) 
             }
             res.status(200).json(saveAgency)
        } catch (err) {
            res.status(500).json(err)
        }
        
    }
}

module.exports = new AgencyController()
