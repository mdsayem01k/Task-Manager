
const express = require('express');
const { adminOnly } = require('../middlewares/authMiddleware');

const router=express.Router();


// user management routes

router.get("/",protect,adminOnly, getUsers);
router.get("/:id",protect,adminOnly, getUserById);
router.put("/:id",protect,adminOnly, updateUserById);
router.delete("/:id",protect,adminOnly, deleteUserById);

module.exports=router;