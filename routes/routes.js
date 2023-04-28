const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const tasksFile = path.join(__dirname, 'tasks.txt');
const completedFile = path.join(__dirname, 'completed.txt');

// Utility function to read and parse tasks and subtasks from the file
function readTasksFromFile() {
    const fileContent = fs.readFileSync(tasksFile, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    let tasks = [];
    let subtasks = [];

    lines.forEach(line => {
        if (line.startsWith('>')) {
            subtasks[subtasks.length - 1].push(line.substring(1).trim());
        } else {
            tasks.push(line.trim());
            subtasks.push([]);
        }
    });

    return { tasks, subtasks };
}

module.exports = function(app) {
    app.get('/', (req, res) => {
        const { tasks, subtasks } = readTasksFromFile(); // Destructure the object to get tasks and subtasks arrays
        res.render('index', { tasks, subtasks });
    });
    
    

    app.post('/task', (req, res) => {
        console.log('Received task:', req.body.task); // Debug line
        const task = req.body.task;
        fs.appendFileSync(tasksFile, task + '\n', 'utf8');
        res.sendStatus(200);
    });

    app.post('/subtask', (req, res) => {
        const parentTaskIndex = parseInt(req.body.parentTaskIndex);
        const subtask = req.body.subtask;
        const { tasks, subtasks } = readTasksFromFile();

        subtasks[parentTaskIndex].push(subtask);

        const newContent = tasks.map((task, index) => {
            const taskSubtaskLines = subtasks[index].map(sub => `> ${sub}`).join('\n');
            return task + (taskSubtaskLines ? '\n' + taskSubtaskLines : '');
        }).join('\n');

        fs.writeFileSync(tasksFile, newContent + '\n', 'utf8');
        res.sendStatus(200);
    });

    app.post('/edit-task', (req, res) => {
        const taskIndex = parseInt(req.body.index);
        const newText = req.body.text;
        const { tasks, subtasks } = readTasksFromFile();

        tasks[taskIndex] = newText;

        const newContent = tasks.map((task, index) => {
            const taskSubtaskLines = subtasks[index].map(sub => `> ${sub}`).join('\n');
            return task + (taskSubtaskLines ? '\n' + taskSubtaskLines : '');
        }).join('\n');

        fs.writeFileSync(tasksFile, newContent + '\n', 'utf8');
        res.sendStatus(200);
    });

    app.post('/reorder-task', (req, res) => {
        console.log('Reorder request received'); // Add this line
        const oldIndex = parseInt(req.body.oldIndex);
        const newIndex = parseInt(req.body.newIndex);
        const { tasks, subtasks } = readTasksFromFile(); // Destructure the object to get tasks and subtasks arrays
    
        console.log('Old index:', oldIndex);
        console.log('New index:', newIndex);
        console.log('Tasks before reordering:', tasks);
        console.log('Subtasks before reordering:', subtasks);
    
        const movedTask = tasks.splice(oldIndex, 1)[0];
        tasks.splice(newIndex, 0, movedTask);
    
        const movedSubtasks = subtasks.splice(oldIndex, 1)[0];
        subtasks.splice(newIndex, 0, movedSubtasks);
    
        console.log('Tasks after reordering:', tasks);
        console.log('Subtasks after reordering:', subtasks);
    
        const updatedData = tasks
            .map((task, index) => {
                const taskSubtaskLines = subtasks[index].map(sub => `> ${sub}`).join('\n');
                return task + (taskSubtaskLines ? '\n' + taskSubtaskLines : '');
            })
            .join('\n') + '\n';
    
        // Output the new tasks.txt content to the console
        console.log('New tasks.txt content:');
        console.log(updatedData);
    
        fs.writeFile(tasksFile, updatedData, 'utf8', err => {
            if (err) {
                console.error(err);
                res.status(500).send('Error updating task order');
                return;
            }
    
            res.status(200).send('Task order updated');
        });
    });
    

    
    module.exports = router;
    

    app.post('/edit-subtask', (req, res) => {
        const subtaskIndex = parseInt(req.body.index);
        const newText = req.body.text;
        const { tasks, subtasks } = readTasksFromFile();

        let parentTaskIndex = -1;
        let subtaskCounter = 0;

        for (let i = 0; i < subtasks.length; i++) {
            subtaskCounter += subtasks[i].length;

            if (subtaskCounter > subtaskIndex) {
                parentTaskIndex = i;
                break;
            }
        }

        const subtaskPosition = subtaskIndex - subtaskCounter + subtasks[parentTaskIndex].length;
        subtasks[parentTaskIndex][subtaskPosition] = newText;

        const newContent = tasks.map((task, index) => {
            const taskSubtaskLines = subtasks[index].map(sub => `> ${sub}`).join('\n');
            return task + (taskSubtaskLines ? '\n' + taskSubtaskLines : '');
        }).join('\n');

        fs.writeFileSync(tasksFile, newContent + '\n', 'utf8');
        res.sendStatus(200);
    });

    app.post('/complete-task', (req, res) => {
        const taskIndex = parseInt(req.body.index);
        const { tasks, subtasks } = readTasksFromFile();

        const completedTask = tasks.splice(taskIndex, 1)[0];
        const completedSubtasks = subtasks.splice(taskIndex, 1)[0];

        fs.appendFileSync(completedFile, completedTask + '\n', 'utf8');
        completedSubtasks.forEach(subtask => {
            fs.appendFileSync(completedFile, '> ' + subtask + '\n', 'utf8');
        });

        const newContent = tasks.map((task, index) => {
            const taskSubtaskLines = subtasks[index].map(sub => `> ${sub}`).join('\n');
            return task + (taskSubtaskLines ? '\n' + taskSubtaskLines : '');
        }).join('\n');

        fs.writeFileSync(tasksFile, newContent + '\n', 'utf8');
        res.sendStatus(200);
    });

    app.post('/complete-subtask', (req, res) => {
        const taskIndex = parseInt(req.body.index.split('-')[0]);
        const subtaskIndex = parseInt(req.body.index.split('-')[1]);
        console.log('Task index:', taskIndex);
        console.log('Subtask index:', subtaskIndex);
        console.log('req.body.index:', req.body.index);

        const { tasks, subtasks } = readTasksFromFile();

        // Add the debug lines here
        console.log('Subtasks:', subtasks);
        console.log('Subtask index:', subtaskIndex);

        const subtaskPosition = subtaskIndex;

        const completedSubtask = subtasks[taskIndex].splice(subtaskIndex, 1)[0];

        fs.appendFileSync(completedFile, '> ' + completedSubtask + '\n', 'utf8');

        const newContent = tasks.map((task, index) => {
            const completedSubtaskLines = subtasks[index].map(sub => `> ${sub}`).join('\n');
            return task + (completedSubtaskLines ? '\n' + completedSubtaskLines : '');
        }).join('\n');

        fs.writeFileSync(tasksFile, newContent + '\n', 'utf8');
        res.sendStatus(200);
    });
};
