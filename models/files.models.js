const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    path: {
        type: String,
        required: [true, 'Path is required']
    },
    originalName: {
        type: String,
        required: [true, 'Original name is required']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', // This should match the collection name in your user.model.js
        required: [true, 'User is required']
    }
})

const file = mongoose.model('file', fileSchema);

module.exports = file;