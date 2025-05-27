import { addActivity } from './activity.js';
import { renderDashboard } from './dashboard.js';

// Expenses Functions
let monthlyExpensesChart;
export async function renderExpenses() {
    try {
        const expenses = await window.electronAPI.dbGetAll('expenses');
        const expenseTable = document.getElementById('expense-table');
        expenseTable.innerHTML = '';
        
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${window.electronAPI.formatDate(expense.date)}</td>
                <td><span class="badge category-${expense.category.toLowerCase()}">${expense.category}</span></td>
                <td>${expense.description}</td>
                <td>${window.electronAPI.formatCurrency(expense.amount)}</td>
                <td>
                    <button class="action-btn edit-expense" data-id="${expense.id}">Edit</button>
                    <button class="action-btn delete-btn delete-expense" data-id="${expense.id}">Delete</button>
                </td>
            `;
            expenseTable.appendChild(row);
        });
        
        await renderMonthlyExpensesChart();
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.edit-expense').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editExpense(id);
            });
        });
        
        document.querySelectorAll('.delete-expense').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteExpense(id);
            });
        });
    } catch (error) {
        console.error('Error rendering expenses:', error);
    }
}
export async function renderMonthlyExpensesChart() {
    try {
        const monthlyData = await window.electronAPI.dbGetMonthlyExpenses();
        
        const monthLabels = monthlyData.map(item => {
            const [year, month] = item.month.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        
        const ctx = document.getElementById('monthly-expenses-chart').getContext('2d');
        
        if (monthlyExpensesChart) {
            monthlyExpensesChart.destroy();
        }
        
        monthlyExpensesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Monthly Expenses',
                    data: monthlyData.map(item => item.total),
                    backgroundColor: '#3a7bd5'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return window.electronAPI.formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return window.electronAPI.formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering monthly expenses chart:', error);
    }
}

export function openExpenseModal(editing = false) {
    document.getElementById('expense-modal-title').textContent = editing ? 'Edit Expense' : 'Add Expense';
    document.getElementById('expense-modal').style.display = 'block';
}

export function closeExpenseModal() {
    document.getElementById('expense-modal').style.display = 'none';
    document.getElementById('expense-form').reset();
    document.getElementById('expense-id').value = '';
}

export async function addExpense(expense) {
    try {
        await window.electronAPI.dbInsert('expenses', expense);
        
        // Add to activity log
        await addActivity('Expense', `Added expense: ${expense.description} (${window.electronAPI.formatCurrency(expense.amount)})`);
        
        await renderExpenses();
        await renderDashboard();
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Error adding expense. Please try again.');
    }
}

export async function editExpense(id) {
    try {
        const expense = await window.electronAPI.dbGetById('expenses', id);
        
        if (expense) {
            document.getElementById('expense-id').value = expense.id;
            document.getElementById('expense-date').value = expense.date;
            document.getElementById('expense-category').value = expense.category;
            document.getElementById('expense-description').value = expense.description;
            document.getElementById('expense-amount').value = expense.amount;
            
            openExpenseModal(true);
        }
    } catch (error) {
        console.error('Error loading expense for edit:', error);
    }
}

export async function updateExpense(updatedExpense) {
    try {
        await window.electronAPI.dbUpdate('expenses', updatedExpense.id, {
            date: updatedExpense.date,
            category: updatedExpense.category,
            description: updatedExpense.description,
            amount: updatedExpense.amount
        });
        
        // Add to activity log
        await addActivity('Expense', `Updated expense: ${updatedExpense.description} (${window.electronAPI.formatCurrency(updatedExpense.amount)})`);
        
        await renderExpenses();
        await renderDashboard();
    } catch (error) {
        console.error('Error updating expense:', error);
        alert('Error updating expense. Please try again.');
    }
}

export async function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        try {
            await window.electronAPI.dbDelete('expenses', id);
            
            // Add to activity log
            await addActivity('Expense', 'Deleted an expense');
            
            await renderExpenses();
            await renderDashboard();
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Error deleting expense. Please try again.');
        }
    }
}