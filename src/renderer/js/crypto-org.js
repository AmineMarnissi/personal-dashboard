// crypto.js - gestion du suivi crypto

let trades = JSON.parse(localStorage.getItem("trades") || "[]");

function saveTrades() {
  localStorage.setItem("trades", JSON.stringify(trades));
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
  document.querySelector("#tradesTable tbody").innerHTML = "";
  data.forEach(t => addTradeToTable(t));
  updateSummary(data);
  updateChart(data);
}

function populateFilters() {
  let uniqueCryptos = [...new Set(trades.map(t => t.crypto))];
  const filter = document.getElementById("cryptoFilter");
  filter.innerHTML = `<option value="">All</option>` + uniqueCryptos.map(c => `<option value="${c}">${c}</option>`).join('');
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "crypto_trades.csv";
  a.click();
  URL.revokeObjectURL(url);
}

let chart;
function updateChart(data = trades) {
  const labels = data.map(t => t.sellDate);
  const profits = data.map(t => t.profit);
  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("profitChart"), {
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

function initCryptoTracker() {
  document.getElementById("calculatePositionBtn")?.addEventListener("click", calculatePositionSize);

  document.getElementById("tradeForm")?.addEventListener("submit", e => {
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

    if (Math.abs(trade.profit) > parseFloat(document.getElementById("maxLoss").value)) {
      document.getElementById("riskAlert").textContent = `⚠️ Loss ${Math.abs(trade.profit).toFixed(2)} exceeds limit!`;
    } else {
      document.getElementById("riskAlert").textContent = "";
    }

    trades.push(trade);
    saveTrades();
    populateFilters();
    renderTrades();
    document.getElementById("tradeForm").reset();
  });

  document.getElementById("applyFilterBtn")?.addEventListener("click", applyFilters);
  document.getElementById("resetFilterBtn")?.addEventListener("click", resetFilters);
  document.getElementById("exportJsonBtn")?.addEventListener("click", downloadJSON);
  document.getElementById("exportCsvBtn")?.addEventListener("click", downloadCSV);

  populateFilters();
  renderTrades();
}


export { initCryptoTracker };
