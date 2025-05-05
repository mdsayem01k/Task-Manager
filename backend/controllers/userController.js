
const Task=require('../models/Task');
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');


const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        
        //Add task counts to each user
        const usersWithTaskCounts = await Promise.all(users.map(async (user) => {
            const taskCount = await Task.countDocuments({ user: user._id });
            return { ...user.toObject(), taskCount };
        }));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
}



const getUserById = async (req, res) => {
    try {
      
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


const deleteUser = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    deleteUser,
};