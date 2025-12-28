const multer = require('multer');

const storage = multer.memoryStorage(); // Keeps file in RAM temporarily
const upload = multer({ storage: storage });

module.exports = upload;