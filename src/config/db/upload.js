const {GridFsStorage} = require('multer-gridfs-storage')
const storage = new GridFsStorage({
    url: process.env.DB_CONNECTION,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const filename = Date.now() + '-' + file.originalname
            const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
            }
            resolve(fileInfo)
        })
    }
    })
    const getImg = async (req, res) => {
        try {
            await gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
                // Check if file
                if (!file || file.length === 0) {
                  return res.status(404).json({
                    err: 'Ảnh không tồn tại'
                  });
                }
                
                // Check if image
                if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
                  // Read output to browser
                  const readstream = gridfsBucket.openDownloadStream(file._id);
                  readstream.pipe(res)
                } else {
                  res.status(404).json({
                    err: 'Không phải là ảnh'
                  })
                 }
                })
        } catch (err) {
            res.status(500).json(err)
        }
    }
module.exports = {storage, getImg}
