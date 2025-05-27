// crypto.js - gestion du suivi crypto (with error handling)

let trades = [];

async function loadTrades() {
  try {
    trades = await window.electronAPI.dbGetAll('crypto_trades');
    populateFilters();
    renderTrades();
  } catch (error) {
    console.error('Error loading trades:', error);
    
    // If it's a column error, try to handle gracefully
    if (error.message.includes('no such column')) {
      console.log('Database schema issue detected. Please update your database.');
      
      // Show user-friendly error message
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `
        <div style="background: #ffebee; border: 1px solid #f44336; padding: 15px; margin: 10px 0; border-radius: 4px;">
          <h4 style="color: #d32f2f; margin: 0 0 10px 0;">Database Schema Update Required</h4>
          <p>Your database needs to be updated to work with this version of the app.</p>
          <button onclick="fixDatabase()" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            Fix Database
          </button>
        </div>
      `;
      
      // Insert error message at the top of the page
      const container = document.querySelector('.container') || document.body;
      container.insertBefore(errorDiv, container.firstChild);
      
      // Initialize empty state
      trades = [];
      renderTrades();
    }
  }
}

// Add this function to handle database fixing from frontend
window.fixDatabase = async function() {
  try {
    // Call a new IPC method to fix the database
    await window.electronAPI.fixDatabase();
    
    // Remove error message and reload
    const errorDiv = document.querySelector('[style*="background: #ffebee"]')?.parentElement;
    if (errorDiv) {
      errorDiv.remove();
    }
    
    // Reload the trades
    await loadTrades();
    
    // Show success message
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
      <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 15px; margin: 10px 0; border-radius: 4px;">
        <p style="color: #2e7d32; margin: 0;">Database updated successfully! ✅</p>
      </div>
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(successDiv, container.firstChild);
    
    // Remove success message after 3 seconds
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
    
  } catch (error) {
    console.error('Error fixing database:', error);
    alert('Failed to fix database. Please restart the application.');
  }
}

async function saveTrade(trade) {
  try {
    const id = await window.electronAPI.dbInsert('crypto_trades', trade);
    trade.id = id;
    trades.push(trade);
  } catch (error) {
    console.error('Error saving trade:', error);
    alert('Failed to save trade. Please try again.');
  }
}

function updateSummary(data = trades) {
  let win = 0, loss = 0, revenue = 0, sumPercent = 0;
  data.forEach(t => {
    revenue += t.buyPrice * t.quantity;
    sumPercent += parseFloat(t.percent);
    if (t.profit >= 0) win += t.profit;
    else loss += Math.abs(t.profit);
  });
  document.getElementById("totalWin").textContent = win.toFixed(2);
  document.getElementById("totalLoss").textContent = loss.toFixed(2);
  document.getElementById("revenue").textContent = revenue.toFixed(2);
  document.getElementById("avgReturn").textContent = (data.length ? (sumPercent / data.length).toFixed(2) : 0);
}

function addTradeToTable(t) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${t.crypto}</td>
    <td>${t.buyDate}</td>
    <td>${t.sellDate}</td>
    <td>${t.buyPrice}</td>
    <td>${t.sellPrice}</td>
    <td>${t.quantity}</td>
    <td class="${t.profit >= 0 ? 'profit' : 'loss'}">${t.profit.toFixed(2)}</td>
    <td>${t.percent}%</td>
  `;
  document.querySelector("#tradesTable tbody").appendChild(row);
}

function renderTrades(data = trades) {
  const tbody = document.querySelector("#tradesTable tbody");
  if (tbody) {
    tbody.innerHTML = "";
    data.forEach(t => addTradeToTable(t));
  }
  updateSummary(data);
  updateChart(data);
}

function populateFilters() {
  let uniqueCryptos = [...new Set(trades.map(t => t.crypto))];
  const filter = document.getElementById("cryptoFilter");
  if (filter) {
    filter.innerHTML = `<option value="">All</option>` + uniqueCryptos.map(c => `<option value="${c}">${c}</option>`).join('');
  }
}

function applyFilters() {
  let crypto = document.getElementById("cryptoFilter").value;
  let date = document.getElementById("dateFilter").value;
  let filtered = trades.filter(t => {
    return (!crypto || t.crypto === crypto) && (!date || t.sellDate === date);
  });
  renderTrades(filtered);
}

function resetFilters() {
  document.getElementById("cryptoFilter").value = "";
  document.getElementById("dateFilter").value = "";
  renderTrades();
}

function downloadJSON() {
  const blob = new Blob([JSON.stringify(trades, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "crypto_trades.json";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV() {
  const headers = ["Crypto", "Buy Date", "Sell Date", "Buy Price", "Sell Price", "Quantity", "Profit", "%"];
  const rows = trades.map(t => [t.crypto, t.buyDate, t.sellDate, t.buyPrice, t.sellPrice, t.quantity, t.profit.toFixed(2), t.percent]);
  let csv = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(url);
  const a = document.createElement("a");
  a.href = url;
  a.download = "crypto_trades.csv";
  a.click();
  URL.revokeObjectURL(url);
}

let chart;
function updateChart(data = trades) {
  const chartElement = document.getElementById("profitChart");
  if (!chartElement) return;
  
  const labels = data.map(t => t.sellDate);
  const profits = data.map(t => t.profit);
  if (chart) chart.destroy();
  chart = new Chart(chartElement, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Profit/Loss Over Time',
        data: profits,
        borderColor: 'lime',
        fill: false
      }]
    }
  });
}

function calculatePositionSize() {
  const accountBalance = parseFloat(document.getElementById("accountBalance").value);
  const riskPercent = parseFloat(document.getElementById("riskPercent").value);
  const entryPrice = parseFloat(document.getElementById("entryPrice").value);
  const stopLossPrice = parseFloat(document.getElementById("stopLossPrice").value);
  const result = document.getElementById("positionSizeResult");

  if (entryPrice <= stopLossPrice) {
    result.textContent = "⚠️ Entry price must be greater than stop loss price.";
    return;
  }

  const riskAmount = (riskPercent / 100) * accountBalance;
  const positionSize = riskAmount / (entryPrice - stopLossPrice);
  result.textContent = `📈 Recommended Position Size: ${positionSize.toFixed(4)} units.`;
}

async function initCryptoTracker() {
  await loadTrades();

  document.getElementById("calculatePositionBtn")?.addEventListener("click", calculatePositionSize);

  document.getElementById("tradeForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const trade = {
      crypto: document.getElementById("crypto").value,
      buyDate: document.getElementById("buyDate").value,
      sellDate: document.getElementById("sellDate").value,
      buyPrice: parseFloat(document.getElementById("buyPrice").value),
      sellPrice: parseFloat(document.getElementById("sellPrice").value),
      quantity: parseFloat(document.getElementById("quantity").value),
    };
    trade.profit = (trade.sellPrice - trade.buyPrice) * trade.quantity;
    trade.percent = ((trade.sellPrice - trade.buyPrice) / trade.buyPrice * 100).toFixed(2);

    const maxLossInput = document.getElementById("maxLoss");
    if (maxLossInput && Math.abs(trade.profit) > parseFloat(maxLossInput.value)) {
      const riskAlert = document.getElementById("riskAlert");
      if (riskAlert) {
        riskAlert.textContent = `⚠️ Loss ${Math.abs(trade.profit).toFixed(2)} exceeds limit!`;
      }
    } else {
      const riskAlert = document.getElementById("riskAlert");
      if (riskAlert) {
        riskAlert.textContent = "";
      }
    }

    await saveTrade(trade);
    populateFilters();
    renderTrades();
    const form = document.getElementById("tradeForm");
    if (form) form.reset();
  });

  document.getElementById("applyFilterBtn")?.addEventListener("click", applyFilters);
  document.getElementById("resetFilterBtn")?.addEventListener("click", resetFilters);
  document.getElementById("exportJsonBtn")?.addEventListener("click", downloadJSON);
  document.getElementById("exportCsvBtn")?.addEventListener("click", downloadCSV);

  populateFilters();
  renderTrades();
}

export { initCryptoTracker };