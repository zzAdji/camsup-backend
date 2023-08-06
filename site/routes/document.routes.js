const router = require('express').Router();
const documentController = require('../controllers/document.controller');
const multer = require('multer');
const upload = multer();

router.get('/', documentController.readDocument);
router.post('/', upload.single('file'), documentController.createDocument);
router.delete('/:id', documentController.deleteDocument);
router.patch('/signet-document/:id', documentController.signetDocument);
router.patch('/unsignet-document/:id', documentController.unsignetDocument);
router.post('/download-document/:id', documentController.downloadDocument);

module.exports = router;
