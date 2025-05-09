
const { exportTaskReport, exportUserReport } = require('../controllers/reportController');
const express = require('express');
const { route } = require('./taskRoutes');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get("/export/taks",protect,adminOnly,exportTaskReport);
router.get("/export/users",protect,adminOnly,exportUserReport);


module.exports = router;