// config/multer
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// دالة لإنشاء مجلدات multer حسب النوع
const createUploadConfig = (uploadType) => {
  const uploadDirs = {
    siteSetting: `${keys.upload_path}/site-sitting`,
    heroSection: `${keys.upload_path}/home/section/hero`,
    usersAvatar: `${keys.upload_path}/users`,
    productMen: `${keys.upload_path}/product-men`,
    productWomens: `${keys.upload_path}/product-womens`,
    // about: `${keys.upload_path}/about`,
    // services: `${keys.upload_path}/services`,
    // portfolio: `${keys.upload_path}/portfolio`,
    // clients: `${keys.upload_path}/clients`,
    // settings: `${keys.upload_path}/settings`,
    // themeSettings: `${keys.upload_path}/themes`,
    // blog: `${keys.upload_path}/blog`,
    // // aboutcompany: `${keys.upload_path}/about-company`,
  };

  const uploadDir = uploadDirs[uploadType] || `${keys.upload_path}/default`;

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
