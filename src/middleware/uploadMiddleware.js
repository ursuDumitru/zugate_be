import multer from 'multer';
import path from 'path';


const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.pdf') {
        cb(new Error('Doar fișiere PDF sunt permise'), false);
    } else {
        cb(null, true);
    }
};

const upload = multer({ storage, fileFilter });

export default upload;