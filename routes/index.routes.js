const express = require('express');
const router = express.Router();
const upload = require('../config/multer.config');
const supabase = require('../config/supabase.config');
const fileModel = require('../models/files.models');
const authMiddleware = require('../middlewares/auth');

// --- HOME ROUTE ---
router.get('/home', authMiddleware, async (req, res) => {
    try {
        // Use the flexible ID check here too
        const userId = req.user.user_id || req.user.userId || req.user._id;

        const userFiles = await fileModel.find({
            user: userId 
        });

        res.render('home', {
            files: userFiles
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// --- UPLOAD ROUTE ---
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No file selected" });
        }
        
        const fileName = `${Date.now()}_${file.originalname}`;

        // 1. Upload to Supabase
        const { data, error } = await supabase.storage
            .from('drive') 
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
            });

        if (error) throw error;

        // 2. FLEXIBLE ID CHECK: This prevents the "User is required" error
        const userId = req.user.user_id || req.user.userId || req.user._id;

        // 3. Save to MongoDB
        await fileModel.create({
            path: data.path, 
            originalName: file.originalname,
            user: userId
        });

        res.redirect('/home');

    } catch (err) {
        console.error("Upload Logic Error:", err);
        res.status(500).json({ message: "Upload failed", error: err.message });
    }
});

// --- DOWNLOAD ROUTE (FORCED DOWNLOAD) ---
router.get('/download/:path', authMiddleware, async (req, res) => {
    try {
        const path = req.params.path;
        const userId = req.user.user_id || req.user.userId || req.user._id;

        // 1. Find the file in MongoDB to get its original name
        const fileRecord = await fileModel.findOne({
            user: userId,
            path: path
        });

        if (!fileRecord) return res.status(401).json({ message: 'Unauthorized' });

        // 2. Generate Signed URL with 'download' option
        const { data, error } = await supabase.storage
            .from('drive')
            .createSignedUrl(path, 60, {
                download: fileRecord.originalName // This forces the browser to download
            });

        if (error) throw error;

        // 3. Redirect to the download link
        res.redirect(data.signedUrl);
    } catch (err) {
        console.error(err);
        res.status(500).send("Could not generate download link");
    }
});

// --- DELETE ROUTE ---
router.get('/delete/:path', authMiddleware, async (req, res) => {
    try {
        const path = req.params.path;
        const userId = req.user.user_id || req.user.userId || req.user._id;

        // 1. Find the file in MongoDB to ensure it belongs to the logged-in user
        const fileRecord = await fileModel.findOne({
            user: userId,
            path: path
        });

        if (!fileRecord) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // 2. Delete the physical file from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from('drive')
            .remove([path]);

        if (storageError) throw storageError;

        // 3. Delete the record from MongoDB
        await fileModel.deleteOne({
            _id: fileRecord._id
        });

        // 4. Redirect back to home to see the updated list
        res.redirect('/home');

    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).send("Could not delete file");
    }
});

module.exports = router;