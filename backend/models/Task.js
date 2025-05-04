const mongoose = require('mongoose');


const todoSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    Completed: {
        type: Boolean,
        default: false,
    },
});


const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
    },
    status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed'],
        default: 'Not Started',
    },
    dueDate: {
        type: Date,
        required: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    attachments: [{ 
        type: String,
    }],
    todoChecklist: [todoSchema],
    progress: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });



module.exports = mongoose.model('Task', taskSchema);