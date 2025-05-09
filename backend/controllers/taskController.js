const Task = require('../models/Task');

const getTasks = async (req, res) => {
    try {
        const {status} = req.query;
        let filter = {};
        if(status){
            filter.status = status;
        }

        let tasks;
        if(req.user.role === "admin"){
            tasks = await Task.find(filter).populate(
                "assignedTo",
                "name email profileImageUrl");
        } else {
            tasks = await Task.find({
                assignedTo: req.user._id,
                ...filter
            }).populate(
                "assignedTo",
                "name email profileImageUrl"
            );
        }   
        
        // add completedCount and totalCount to each task
        tasks = await Promise.all(
            tasks.map(async (task) => {
                const completedCount = task.todoChecklist.filter(
                    (item) => item.completed).length;
                    return {
                        ...task._doc,
                        completedCount,
                        totalCount: task.todoChecklist.length,
                    };
            })
        );    

        // Status summary counts
        const allTasks = await Task.countDocuments(
            req.user.role === "admin" ? {} : {
                assignedTo: req.user._id
            }
        );

        const pendingCount = await Task.countDocuments({
            ...filter,
            status: "Pending",
            ...(req.user.role !== "admin" && {
                assignedTo: req.user._id
            })
        });

        const inProgressCount = await Task.countDocuments({
            ...filter,
            status: "In Progress",
            ...(req.user.role !== "admin" && {
                assignedTo: req.user._id
            })
        });

        const completedCount = await Task.countDocuments({
            ...filter,
            status: "Completed",
            ...(req.user.role !== "admin" && {
                assignedTo: req.user._id
            })
        });

        res.json({
            tasks,
            statusSummary: {
                all: allTasks,
                pendingCount,
                inProgressCount,
                completedCount,
            }, 
        });
        
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate("assignedTo", "name email profileImageUrl")
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if the user has permission to view this task
        if (req.user.role !== "admin" && 
            !task.assignedTo.some(user => user._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'You do not have permission to view this task' });
        }

      res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            status,
            dueDate,
            assignedTo,
            attachments,
            todoChecklist,
        } = req.body;

        if(!Array.isArray(assignedTo)){
            return res.status(400).json({ message: 'assignedTo should be an array of User IDs' });
        }

        const task = await Task.create({
            title,
            description,
            priority,
            status,
            dueDate,
            assignedTo,
            createdBy: req.user._id, // Assuming req.user is set by your auth middleware
            attachments,
            todoChecklist,
        });
        
        res.status(201).json({message: 'Task created successfully', task});

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
       const task=await Task.findById(req.params.id);

        if (!task) {    
            return res.status(404).json({ message: 'Task not found' });
        }

        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;    
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
        task.attachments = req.body.attachments || task.attachments;

        if (req.body.assignedTo) {
            if (!Array.isArray(req.body.assignedTo)) {
                return res.status(400).json({ message: 'assignedTo should be an array of User IDs' });
            }
            task.assignedTo = req.body.assignedTo;
        }

        const updatedTask = await task.save();
        res.json({ message: 'Task updated successfully', task: updatedTask });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user has permission to delete
        if (req.user.role !== "admin" && 
            task.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You do not have permission to delete this task' });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const isAssigned = Array.isArray(task.assignedTo) && 
        task.assignedTo.some((userId) => 
            userId.toString() === req.user._id.toString()
        );

        if (req.user.role !== "admin" && !isAssigned) {
            return res.status(403).json({ message: 'You do not have permission to update this task' });
        }

        task.status = status;
        if (status === 'Completed') {
            task.todoChecklist.forEach(item => {
                item.completed = true; // Mark all checklist items as completed
            });
            task.progress = 100; 

        }
        await task.save();
        res.json({ message: 'Task status updated successfully', task });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const updateTaskChecklist = async (req, res) => {
    try {
        const { todoChecklist} = req.body;
        
  
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin") {
        //     return res.status(403).json({ message: 'You do not have permission to update this task' });
        // }

        task.todoChecklist = todoChecklist;
        const completedCount = task.todoChecklist.filter(item => item.completed).length;
        const totalCount = task.todoChecklist.length;   
        task.progress = totalCount>0 ? Math.round((completedCount / totalCount) * 100) : 0; // Calculate progress percentage
        if (task.progress === 100) {
            task.status = 'Completed'; 
        }else if (task.progress>0){
            task.status = 'In Progress';
        }else {
            task.status = 'Pending'; 
        }

        await task.save();
        const updatedTask = await Task.findById(req.params.id).populate(
            "assignedTo", 
            "name email profileImageUrl"
        );
        
        res.json({ message: 'Task checklist updated successfully', task: updatedTask });


    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
 
const getDashboardData = async (req, res) => {
    try {
        // Only admin can access overall dashboard data
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        // Get task statistics
        const totalTasks = await Task.countDocuments();
        const pendingTasks = await Task.countDocuments({ status: 'Pending' });
        const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        
    
        // Get overdue tasks
        const overdueTasks = await Task.find({
            dueDate: { $lt: new Date() },
            status: { $ne: 'Completed' }
        }).populate("assignedTo", "name email");

        const taskStatuses=['Pending', 'In Progress', 'Completed'];
        const taskDistributionRaw = await Task.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
            
        ]);

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedkey = status.replace(/\s+/g, '');
            acc[formattedkey] = 
                taskDistributionRaw.find(item => item._id === status)?.count || 0;
            return acc;
        }, {});

        taskDistribution["All"]=totalTasks;
        const taskPriorities=['High', 'Medium', 'Low'];
        const taskPriorityDistributionRaw = await Task.aggregate([
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 }
                }
            }
        ]);

        const taskPriorityDistribution = taskPriorities.reduce((acc, priority) => {
            acc[priority] = 
                taskPriorityDistributionRaw.find(item => item._id === priority)?.count || 0;
            return acc;
        }, {});

        //fetch recent 10 tasks
        const recentTasks = await Task.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select("title description status priority dueDate createdAt");  

        
        res.status(200).json({  
            statistics:{
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityDistribution,
            },
            recentTasks,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.params.id;

        const totalTasks = await Task.countDocuments({
            assignedTo: userId
        }); 
        const pendingTasks = await Task.countDocuments({
            assignedTo: userId,
            status: 'Pending'
        });
        const inProgressTasks = await Task.countDocuments({
            assignedTo: userId,
            status: 'In Progress'
        });
        const completedTasks = await Task.countDocuments({
            assignedTo: userId,
            status: 'Completed'
        });
        const overdueTasks = await Task.countDocuments({
            assignedTo: userId,
            dueDate: { $lt: new Date() },
            status: { $ne: 'Completed' }
        });

        //Task distribution by ID
        const taskStatuses=['Pending', 'In Progress', 'Completed'];
        const taskDistributionRaw = await Task.aggregate([
            {
                $match: { assignedTo: userId }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedkey = status.replace(/\s+/g, '');
            acc[formattedkey] = 
                taskDistributionRaw.find(item => item._id === status)?.count || 0;
            return acc;
        }, {});
        taskDistribution["All"]=totalTasks;
        const taskPriorities=['High', 'Medium', 'Low']; 
        const taskPriorityLevels=taskPriorities.reduce((acc, priority) => {
            acc[priority] = taskDistributionRaw.find(item => item._id === priority)?.count || 0;
            return acc;
        }, {});

        //fetch recent 10 tasks for the logged in user
        const recentTasks = await Task.find({
            assignedTo: userId
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("title description status priority dueDate createdAt"); 
        
        res.status(200).json({
            statistics:{
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData
};