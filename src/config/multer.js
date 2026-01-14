// config/multer
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// دالة لإنشاء مجلدات multer حسب النوع
const createUploadConfig = (uploadType) => {
  const uploadDirs = {
    // hero: "storage/uploads/hero",
    // about: "storage/uploads/about",
    // services: "storage/uploads/services",
    // portfolio: "storage/uploads/portfolio",
    // clients: "storage/uploads/clients",
    // settings: "storage/uploads/settings",
    // themeSettings: "storage/uploads/themes",
    // blog: "storage/uploads/blog",
    // // aboutcompany: "storage/uploads/about-company",
  };

  const uploadDir = uploadDirs[uploadType] || "storage/uploads/default";

  // إنشاء المجلد إذا لم يكن موجود
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const prefix = uploadType || "file";
      cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`Only image files are allowed (jpeg, jpg, png, gif, webp)`));
    }
  };

  return multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: fileFilter,
  });
};

module.exports = createUploadConfig;
