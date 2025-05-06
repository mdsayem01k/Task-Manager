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

        // Check if user has permission to update
        if (req.user.role !== "admin" && 
            !task.assignedTo.some(id => id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'You do not have permission to update this task' });
        }

        task.status = status;
        
        // Update progress if status is "Completed"
        if (status === "Completed") {
            task.progress = 100;
        } else if (status === "Pending") {
            task.progress = 0;
        }

        await task.save();
        res.json({ message: 'Task status updated successfully', task });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const updateTaskChecklist = async (req, res) => {
    try {
        const { todoId, completed } = req.body;
        
        if (todoId === undefined || completed === undefined) {
            return res.status(400).json({ message: 'Missing todoId or completed status' });
        }

        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user has permission
        if (req.user.role !== "admin" && 
            !task.assignedTo.some(id => id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'You do not have permission to update this task' });
        }

        // Find the todo item
        const todoItem = task.todoChecklist.id(todoId);
        
        if (!todoItem) {
            return res.status(404).json({ message: 'Todo item not found' });
        }

        // Update the completion status
        todoItem.completed = completed;

        // Update progress based on completed items
        const completedCount = task.todoChecklist.filter(item => item.completed).length;
        const totalCount = task.todoChecklist.length;
        task.progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        await task.save();
        res.json({ 
            message: 'Todo item updated successfully', 
            task,
            completedCount,
            totalCount
        });
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
        
        // Get tasks by priority
        const highPriorityTasks = await Task.countDocuments({ priority: 'High' });
        const mediumPriorityTasks = await Task.countDocuments({ priority: 'Medium' });
        const lowPriorityTasks = await Task.countDocuments({ priority: 'Low' });
        
        // Get upcoming due tasks (due in next 7 days)
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        
        const upcomingTasks = await Task.find({
            dueDate: { $gte: new Date(), $lte: oneWeekFromNow },
            status: { $ne: 'Completed' }
        }).populate("assignedTo", "name email");
        
        // Get overdue tasks
        const overdueTasks = await Task.find({
            dueDate: { $lt: new Date() },
            status: { $ne: 'Completed' }
        }).populate("assignedTo", "name email");
        
        res.json({
            taskSummary: {
                total: totalTasks,
                pending: pendingTasks,
                inProgress: inProgressTasks,
                completed: completedTasks
            },
            prioritySummary: {
                high: highPriorityTasks,
                medium: mediumPriorityTasks,
                low: lowPriorityTasks
            },
            upcomingTasks,
            overdueTasks
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getUserDashboardData = async (req, res) => {
    try {
        // Get task statistics for the current user
        const totalTasks = await Task.countDocuments({ assignedTo: req.user._id });
        const pendingTasks = await Task.countDocuments({ 
            assignedTo: req.user._id,
            status: 'Pending' 
        });
        const inProgressTasks = await Task.countDocuments({ 
            assignedTo: req.user._id,
            status: 'In Progress' 
        });
        const completedTasks = await Task.countDocuments({ 
            assignedTo: req.user._id,
            status: 'Completed' 
        });
        
        // Get tasks by priority for current user
        const highPriorityTasks = await Task.countDocuments({ 
            assignedTo: req.user._id,
            priority: 'High' 
        });
        const mediumPriorityTasks = await Task.countDocuments({ 
            assignedTo: req.user._id,
            priority: 'Medium' 
        });
        const lowPriorityTasks = await Task.countDocuments({ 
            assignedTo: req.user._id,
            priority: 'Low' 
        });
        
        // Get upcoming due tasks (due in next 7 days) for current user
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        
        const upcomingTasks = await Task.find({
            assignedTo: req.user._id,
            dueDate: { $gte: new Date(), $lte: oneWeekFromNow },
            status: { $ne: 'Completed' }
        });
        
        // Get overdue tasks for current user
        const overdueTasks = await Task.find({
            assignedTo: req.user._id,
            dueDate: { $lt: new Date() },
            status: { $ne: 'Completed' }
        });
        
        res.json({
            taskSummary: {
                total: totalTasks,
                pending: pendingTasks,
                inProgress: inProgressTasks,
                completed: completedTasks
            },
            prioritySummary: {
                high: highPriorityTasks,
                medium: mediumPriorityTasks,
                low: lowPriorityTasks
            },
            upcomingTasks,
            overdueTasks
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