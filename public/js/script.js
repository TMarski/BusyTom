$(document).ready(() => {
    // Add task
    $('#task-form').on('submit', (event) => {
        event.preventDefault();
        const taskText = $('#task-input').val().trim();

        if (taskText) {
            $.ajax({
                type: 'POST',
                url: '/task',
                data: { task: taskText },
                success: (data) => {
                    location.reload();
                },
                error: (error) => {
                    console.error('Error adding task:', error);
                },
            });
        }
    });

    // Add subtask
    $('#task-list').on('click', '.add-subtask', (event) => {
        const parentTaskIndex = $(event.target).closest('li').data('task-index');
        const subtaskText = prompt('Enter a subtask:').trim();

        if (subtaskText) {
            $.ajax({
                type: 'POST',
                url: '/subtask',
                data: { parentTaskIndex, subtask: subtaskText },
                success: (data) => {
                    location.reload();
                },
                error: (error) => {
                    console.error('Error adding subtask:', error);
                },
            });
        }
    });

    // Click to edit task or subtask
    $('#task-list').on('click', '.task-text, .subtask-text', (event) => {
        const isSubtask = $(event.target).hasClass('subtask-text');
        const taskElement = $(event.target);
        const oldText = taskElement.text();
        const newText = prompt('Edit task:', oldText).trim();

        if (newText && newText !== oldText) {
            const url = isSubtask ? '/edit-subtask' : '/edit-task';
            const dataIndex = $(event.target).closest('li').data('index');

            $.ajax({
                type: 'POST',
                url,
                data: { index: dataIndex, text: newText },
                success: (data) => {
                    location.reload();
                },
                error: (error) => {
                    console.error('Error editing task:', error);
                },
            });
        }
    });

    // Complete task or subtask
    $('#task-list').on('click', '.complete-task, .complete-subtask', (event) => {
        const isSubtask = $(event.target).hasClass('complete-subtask');
        const url = isSubtask ? '/complete-subtask' : '/complete-task';

        let dataIndex;

        if (isSubtask) {
            const taskIndex = $(event.target).closest('.task-container').data('task-index');
            const subtaskIndex = $(event.target).closest('li').data('subtask-index');
            dataIndex = taskIndex + '-' + subtaskIndex;
        } else {
            dataIndex = $(event.target).closest('li').data('index');
        }

        $.ajax({
            type: 'POST',
            url,
            data: { index: dataIndex },
            success: (data) => {
                location.reload();
            },
            error: (error) => {
                console.error('Error completing task:', error);
            },
        });
    });

    $("#task-list").sortable({
        stop: (event, ui) => {
            const newIndex = ui.item.index();
            const oldIndex = ui.item.attr('data-task-index');
    
            if (newIndex !== oldIndex) {
                $.ajax({
                    type: 'POST',
                    url: '/reorder-task',
                    data: {
                        oldIndex: oldIndex,
                        newIndex: newIndex
                    },
                    success: (data) => {
                        location.reload();
                    },
                    error: (error) => {
                        console.error('Error reordering task:', error);
                    },
                });
            }
        },
        update: (event, ui) => {
            $('#task-list li').each(function (index) {
                $(this).data('task-index', index);
            });
        }
    });
    
    // Make the task list sortable and disable the selection of text
    $("#task-list").disableSelection();
    });
    