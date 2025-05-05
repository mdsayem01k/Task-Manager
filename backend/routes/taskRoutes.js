const express= require('express')

const { getTasks, getTaskById, createTask, deleteTask, updateTaskStatus, updateTaskChecklist, getDashboardData, getUserDashboardData } = require('../controllers/taskController');
const { protect,adminOnly } = require('../middlewares/authMiddleware');
const router = express.Router();


// router.get("/dashboard-data",protect,adminOnly, getDashboardData);
// router.get("/user-dashboard-data/:id",protect,adminOnly, getUserDashboardData);
// router.get("/",protect,getTasks);
// router.get("/:id",protect,getTaskById);
router.post("/",protect,adminOnly,createTask);
// router.delete("/:id",protect,adminOnly,deleteTask);
// router.put("/:id/status",protect,updateTaskStatus);
// router.put("/:id/todo",protect,updateTaskChecklist);

module.exports = router;
