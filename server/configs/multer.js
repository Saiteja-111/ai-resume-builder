import multer from "multer";

const storage = multer.memoryStorage(); // ✅ REQUIRED

const upload = multer({ storage });

export default upload;