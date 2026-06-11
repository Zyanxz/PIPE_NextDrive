import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname);

    cb(null, Date.now() + extensao);
  }
});

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(file.mimetype) && allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos de imagem são permitidos."));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: imageFilter
});

export default upload;