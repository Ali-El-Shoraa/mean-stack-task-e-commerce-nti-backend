const { Router } = require("express");
const {
  //   getTopSellers,
  getTopSellersByGender,
} = require("../controllers/topSellers.controller");

const router = Router();

// router.get("/", getTopSellers);
router.get("/", getTopSellersByGender);

module.exports = router;
