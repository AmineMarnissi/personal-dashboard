// dashboard.js - Dashboard functionality
import { addExpense } from "./expenses.js";

// Global chart variables
let expensesChart, projectsChart;

// Dashboard Functions
export async function renderDashboard() {
    document.getElementById('current-date').textContent = window.electronAPI.formatDate(new Date());
    await renderExpensesChart();
    await renderProjectsChart();
    await renderActivityLog();
    await renderExchangeCharts();
}

async function renderExpensesChart() {
    try {
        const categoryData = await window.electronAPI.dbGetExpenseCategories();
        
        const ctx = document.getElementById('expenses-chart').getContext('2d');
        
        // Destroy previous chart if it exists
        if (expensesChart) {
            expensesChart.destroy();
        }
        
        expensesChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categoryData.map(item => item.category),
                datasets: [{
                    data: categoryData.map(item => item.total),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                        '#9966FF', '#FF9F40', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = window.electronAPI.formatCurrency(context.raw);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering expenses chart:', error);
    }
}

async function renderProjectsChart() {
    try {
        const statusData = await window.electronAPI.dbGetProjectStatusCounts();
        const statusCounts = {
            todo: 0,
            progress: 0,
            done: 0
        };
        
        statusData.forEach(item => {
            statusCounts[item.status] = item.count;
        });
        
        const ctx = document.getElementById('projects-chart').getContext('2d');
        
        // Destroy previous chart if it exists
        if (projectsChart) {
            projectsChart.destroy();
        }
        
        projectsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['To Do', 'In Progress', 'Done'],
                datasets: [{
                    data: [statusCounts.todo, statusCounts.progress, statusCounts.done],
                    backgroundColor: ['#FF6384', '#FFCE56', '#36A2EB']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering projects chart:', error);
    }
}

async function renderActivityLog() {
    try {
        const activities = await window.electronAPI.dbGetRecentActivities(10);
        const activityLog = document.getElementById('activity-log');
        activityLog.innerHTML = '';
        
        activities.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${window.electronAPI.formatDate(activity.date)}</td>
                <td>${activity.category}</td>
                <td>${activity.description}</td>
            `;
            activityLog.appendChild(row);
        });
    } catch (error) {
        console.error('Error rendering activity log:', error);
    }
}
async function renderExchangeCharts() {
    try {
        const btcChart = new Chart(document.getElementById('btc-chart'), await getChartConfig('BTC/USD'));
        const eurUsdChart = new Chart(document.getElementById('eurusd-chart'), await getChartConfig('EUR/USD'));
        const dzdChart = new Chart(document.getElementById('dzd-chart'), await getChartConfig('USD/DZD')); // 👈 USD vers DZD
    } catch (err) {
        console.error("Erreur chargement taux de change :", err);
    }
}


async function getChartConfig(symbol) {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&apikey=de8053b8c5d249d2bd25509a5a0b3004&outputsize=30`;
    const res = await fetch(url);
    const data = await res.json();

    console.log("Réponse de l'API pour", symbol, data); // 👈 debug ici

    if (!data.values) {
        throw new Error(`Données introuvables pour ${symbol}. Message: ${data.message || 'Aucun message retourné'}`);
    }

    const labels = data.values.map(val => val.datetime).reverse();
    const prices = data.values.map(val => parseFloat(val.close)).reverse();

    return {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: symbol,
                data: prices,
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.3,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            }
        }
    };
}


// Sample data and charts
export function populateSampleData() {
    // Add sample activity log
    const activityLog = document.getElementById('activity-log');
    const sampleActivities = [
        { date: new Date(), category: 'Task', description: 'Completed project review' },
        { date: new Date(Date.now() - 86400000), category: 'Meeting', description: 'Team standup completed' },
        { date: new Date(Date.now() - 172800000), category: 'Expense', description: 'Added office supplies expense' },
        { date: new Date(Date.now() - 259200000), category: 'Project', description: 'Started new website redesign' },
        { date: new Date(Date.now() - 345600000), category: 'Training', description: 'Completed 45-minute workout' }
    ];
    
    sampleActivities.forEach(activity => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${activity.date.toLocaleDateString()}</td>
            <td>${activity.category}</td>
            <td>${activity.description}</td>
        `;
        activityLog.appendChild(row);
    });
}

