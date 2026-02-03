const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

const dashboardController = require("../controllers/dashboard.controller");

router.use(protect);

// ✅ User Dashboard
router.get("/user", dashboardController.getUserDashboard);

// ✅ Admin Dashboard (محمي)
router.get("/admin", authorize("admin"), dashboardController.getAdminDashboard);

module.exports = router;
