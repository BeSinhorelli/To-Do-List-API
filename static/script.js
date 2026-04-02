// API Endpoints
const API_BASE_URL = '/api';

// Estado da aplicação
let tasks = [];
let currentFilter = 'all';

// Elementos DOM
const taskForm = document.getElementById('taskForm');
const tasksList = document.getElementById('tasksList');
const filterBtns = document.querySelectorAll('.filter-btn');

// Carregar tarefas ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
    setupModalEvents();
});

function setupEventListeners() {
    taskForm.addEventListener('submit', handleAddTask);
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => handleFilterChange(btn.dataset.filter));
    });
}

function setupModalEvents() {
    const modal = document.getElementById('editModal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const editForm = document.getElementById('editTaskForm');
    
    closeBtn.onclick = () => modal.style.display = 'none';
    cancelBtn.onclick = () => modal.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
    
    editForm.addEventListener('submit', handleUpdateTask);
}

async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        tasks = await response.json();
        renderTasks();
        updateStats();
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        showError('Erro ao carregar tarefas. Verifique sua conexão.');
    }
}

async function updateStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/stats`);
        const stats = await response.json();
        // Você pode adicionar um elemento para mostrar as estatísticas se quiser
        console.log('Estatísticas:', stats);
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

async function handleAddTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    
    if (!title) {
        showError('Por favor, insira um título para a tarefa.');
        return;
    }
    
    const newTask = { title, description };
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });
        
        const task = await response.json();
        tasks.unshift(task);
        renderTasks();
        taskForm.reset();
        updateStats();
        showSuccess('Tarefa adicionada com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
        showError('Erro ao adicionar tarefa. Tente novamente.');
    }
}

async function handleToggleTask(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/toggle`, {
            method: 'PATCH'
        });
        
        const updatedTask = await response.json();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = updatedTask;
            renderTasks();
            updateStats();
            
            const message = updatedTask.completed ? 
                'Tarefa marcada como concluída! 🎉' : 
                'Tarefa marcada como pendente!';
            showSuccess(message);
        }
    } catch (error) {
        console.error('Erro ao alternar status:', error);
        showError('Erro ao atualizar tarefa.');
    }
}

async function handleDeleteTask(taskId) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    try {
        await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        tasks = tasks.filter(t => t.id !== taskId);
        renderTasks();
        updateStats();
        showSuccess('Tarefa excluída com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        showError('Erro ao excluir tarefa.');
    }
}

async function openEditModal(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
        const task = await response.json();
        
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description || '';
        document.getElementById('editTaskCompleted').checked = task.completed;
        
        const modal = document.getElementById('editModal');
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao carregar tarefa:', error);
        showError('Erro ao carregar dados da tarefa');
    }
}

async function handleUpdateTask(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const completed = document.getElementById('editTaskCompleted').checked;
    
    if (!title) {
        showError('O título é obrigatório');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, completed })
        });
        
        if (!response.ok) throw new Error('Erro ao atualizar');
        
        const updatedTask = await response.json();
        const index = tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
            tasks[index] = updatedTask;
        }
        
        document.getElementById('editModal').style.display = 'none';
        renderTasks();
        updateStats();
        showSuccess('Tarefa atualizada com sucesso!');
        
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        showError('Erro ao atualizar tarefa.');
    }
}

function handleFilterChange(filter) {
    currentFilter = filter;
    
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderTasks();
}

function getFilteredTasks() {
    switch (currentFilter) {
        case 'pending':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>Nenhuma tarefa encontrada</p>
                <small>Adicione sua primeira tarefa acima!</small>
            </div>
        `;
        return;
    }
    
    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-card ${task.completed ? 'completed' : ''}">
            <div class="task-header">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="openEditModal(${task.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn complete-btn" onclick="handleToggleTask(${task.id})" title="${task.completed ? 'Desmarcar' : 'Concluir'}">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="handleDeleteTask(${task.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-date">
                <i class="far fa-calendar-alt"></i> Criado: ${formatDate(task.created_at)}
                ${task.updated_at !== task.created_at ? `<br><i class="fas fa-edit"></i> Editado: ${formatDate(task.updated_at)}` : ''}
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'Data inválida';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
}

function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}