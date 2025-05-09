
const Task=require('../models/Task');
const User=require('../models/User');
const excelJS = require('exceljs');



const exportTaskReport = async (req, res) => {  
    try {

        const tasks = await Task.find({}).populate('user', 'name email'); // Fetch all tasks with user details

        // Create a new workbook and worksheet
        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tasks Report');

        // Define columns
        worksheet.columns = [
            { header: 'Task ID', key: '_id', width: 20 },
            { header: 'Title', key: 'title', width: 30 },
            { header: 'Description', key: 'description', width: 50 },
            { header: 'Priority', key: 'priority', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Due Date', key: 'dueDate', width: 20 },
            { header: 'Assigned To', key: 'assignedTo', width: 20 },           
        ];

        // Add rows to the worksheet
        tasks.forEach(task => {
            const assignedTo = task.assignedTo
            .map(user => `${user.name} (${user.email})`)
            .join(', '); // Join user names and emails

            worksheet.addRow({
                _id: task._id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate.toISOString().split('T')[0], // Format date
                assignedTo: assignedTo, // Use the joined string
            });
        });

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=tasks_report_${Date.now()}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res).then(() => {
            res.end();
        });
    
    }catch (error) {
      
        res.status(500).json({ message: 'Error Exporting Task', error: error.message }); 
    }
};


const exportUserReport = async (req, res) => {
    try{

        const users = await User.find({}).select('name email_id').lean();
        const userTasks=await Task.find({}).populate(
            'assignedTo', 
            'name email_id'
        )

        const userTaskMap = {};
        userTasks.forEach(task => { 
            userTaskMap[user._id] = {
                name: user.name,
                email: user.email_id,
                taskCount: 0,
                pendingTasks: 0,
                completedTasks: 0,
            };
        });
        userTasks.forEach(task => {
            const assignedTo = task.assignedTo;
            if (assignedTo) {
                assignedTo.forEach(user => {
                    if (userTaskMap[user._id]) {
                        userTaskMap[user._id].taskCount++;
                        if (task.status === 'Pending') {
                            userTaskMap[user._id].pendingTasks++;
                        } else if (task.status === 'In Progress') {
                            userTaskMap[user._id].inProgressTasks++;
                        }
                        else if (task.status === 'Completed') {
                            userTaskMap[user._id].completedTasks++;
                        }
                    }
                });
            }
        });    

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('Users Task Report');

        worksheet.columns = [
            { header: 'User Name', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Total Asssigned Task', key: 'taskCount', width: 15 },
            { header: 'Pending Tasks', key: 'pendingTasks', width: 15 },
            { header: 'In Progress Tasks', key: 'inProgressTasks', width: 15 },
            { header: 'Completed Tasks', key: 'completedTasks', width: 15 },
        ];

        Object.values(userTaskMap).forEach(user => {
            worksheet.addRow(user);
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=users_tasks_report_${Date.now()}.xlsx`);
        await workbook.xlsx.write(res).then(() => {
            res.end();
        });
    }catch (error) {    
        res.status(500).json({ message: 'Error Exporting User Report', error: error.message }); 
    }
};    


module.exports = {
    exportTaskReport,
    exportUserReport
};
