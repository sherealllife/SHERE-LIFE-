const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (user && user.role === 'admin') window.location.href = 'admin/index.html';
if (!token || !user) window.location.href = 'login.html';

document.getElementById('userName').textContent = user.name;

let walletData = {};
let trxBalance = 0;
let usdtBalance = 0;
let refreshInterval = null;

async function loadWallet() {
    try {
        const res = await fetch(`${API_URL}/wallet`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            walletData = data.data;
            document.getElementById('balance').textContent = walletData.balance.toLocaleString() + ' RWF';
            document.getElementById('trumpBalance').textContent = (walletData.trumpBalance || 0) + ' TRUMP';
            document.getElementById('usdtBalance').textContent = (walletData.usdtBalance || 0).toLocaleString() + ' USDT';
            if (walletData.tronAddress) document.getElementById('tronAddress').innerText = walletData.tronAddress;
            calculateTotalAsset();
        }
    } catch (error) {
        console.error('Error loading wallet:', error);
    }
}

async function loadTronBalances() {
    try {
        const address = document.getElementById('tronAddress').innerText;
        if (!address || address === 'Loading...') return;
        const res = await fetch(`${API_URL}/tron/balance/${address}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            trxBalance = data.trx?.balance || 0;
            document.getElementById('trxBalance').textContent = trxBalance.toLocaleString() + ' TRX';
            calculateTotalAsset();
        }
    } catch (error) {
        console.error('Error loading Tron balances:', error);
    }
}

function calculateTotalAsset() {
    const rwfBalance = walletData.balance || 0;
    const trumpBalance = walletData.trumpBalance || 0;
    const usdtBalanceVal = walletData.usdtBalance || 0;
    const RWF_TO_USD = 0.001;
    const TRX_TO_USD = 0.32;
    const USDT_TO_USD = 1.0;
    const TRUMP_TO_USD = 0.5;
    const totalUSD = (rwfBalance * RWF_TO_USD) + (trxBalance * TRX_TO_USD) + (usdtBalanceVal * USDT_TO_USD) + (trumpBalance * TRUMP_TO_USD);
    const totalElem = document.getElementById('totalAsset');
    if (totalElem) totalElem.textContent = `$${totalUSD.toFixed(2)}`;
}

async function loadLoans() {
    try {
        const res = await fetch(`${API_URL}/loan/my-loans`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const container = document.getElementById('loansList');
            container.innerHTML = '';
            data.data.forEach(loan => {
                const card = document.createElement('div');
                card.className = 'loan-card';
                card.innerHTML = `<h4>Inguzanyo ya ${loan.amount.toLocaleString()} RWF</h4><span class="status ${loan.status}">${loan.status}</span><p><strong>Intego:</strong> ${loan.purpose || '-'}</p><p><strong>Itariki:</strong> ${new Date(loan.dueDate).toLocaleDateString()}</p><p><strong>Yishyuwe:</strong> ${loan.repaidAmount.toLocaleString()} RWF</p>`;
                container.appendChild(card);
            });
        }
    } catch (error) { console.error(error); }
}

document.getElementById('depositForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseInt(document.getElementById('depositAmount').value);
    const res = await fetch(`${API_URL}/deposit`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ amount, paymentMethod: 'bank_transfer' }) });
    const data = await res.json();
    document.getElementById('depositMessage').innerHTML = data.success ? `<p style="color:green;">✅ ${data.message}</p>` : `<p style="color:red;">❌ ${data.error}</p>`;
    if (data.success) { loadWallet(); document.getElementById('depositForm').reset(); }
});

document.getElementById('withdrawForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    const walletAddress = document.getElementById('withdrawAddress').value;
    if (!walletAddress) { document.getElementById('withdrawMessage').innerHTML = '<p style="color:red;">❌ Wallet address irakenewe!</p>'; return; }
    const res = await fetch(`${API_URL}/withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ amount, paymentMethod: 'tron_wallet', walletAddress }) });
    const data = await res.json();
    document.getElementById('withdrawMessage').innerHTML = data.success ? `<p style="color:green;">✅ ${data.message}</p>` : `<p style="color:red;">❌ ${data.error}</p>`;
    if (data.success) loadWallet();
});

document.getElementById('loanForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseInt(document.getElementById('loanAmount').value);
    const purpose = document.getElementById('loanPurpose').value;
    const dueDate = document.getElementById('loanDueDate').value;
    const res = await fetch(`${API_URL}/loan/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ amount, purpose, dueDate }) });
    const data = await res.json();
    document.getElementById('loanMessage').innerHTML = data.success ? '<p style="color:green;">✅ Inguzanyo yasabwe neza!</p>' : `<p style="color:red;">❌ ${data.error}</p>`;
    if (data.success) { document.getElementById('loanForm').reset(); loadLoans(); }
});

window.sendCrypto = async () => {
    const currency = prompt("Enter currency (TRX/USDT/TRUMP):").toUpperCase();
    const address = prompt("Enter recipient address:");
    const amount = parseFloat(prompt("Enter amount:"));
    if (!currency || !address || !amount) return;
    try {
        const res = await fetch(`${API_URL}/crypto/send`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ currency, toAddress: address, amount }) });
        const data = await res.json();
        alert(data.message);
    } catch (error) { alert('Error: ' + error.message); }
};

window.receiveCrypto = () => { alert(`Your Tron address: ${document.getElementById('tronAddress').innerText}`); };
window.copyAddress = () => { navigator.clipboard.writeText(document.getElementById('tronAddress').innerText); alert('✅ Address copied!'); };
window.filterTransactions = (filter) => { console.log('Filter:', filter); };

document.getElementById('logoutBtn')?.addEventListener('click', () => { localStorage.clear(); window.location.href = '../../index.html'; });

function startLiveRefresh() { if (refreshInterval) clearInterval(refreshInterval); refreshInterval = setInterval(() => { loadTronBalances(); loadWallet(); }, 10000); }
function stopLiveRefresh() { if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; } }

loadWallet(); loadLoans(); loadTronBalances(); startLiveRefresh();
window.addEventListener('beforeunload', () => stopLiveRefresh());

