const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
    window.location.href = '../pages/login.html';
}

// Tab switching
document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = tab.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabId}Tab`).classList.add('active');
        if (tabId === 'loans') loadLoans();
        if (tabId === 'users') loadUsers();
        if (tabId === 'fund') loadSystemFund();
    });
});

// Filter buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-filter')) {
        document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        loadLoans(e.target.dataset.filter);
    }
});

async function loadLoans(filter = 'all') {
    try {
        const res = await fetch('http://localhost:5000/api/loan/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            let loans = data.data;
            if (filter !== 'all') loans = loans.filter(l => l.status === filter);
            
            const container = document.getElementById('loansList');
            container.innerHTML = '';
            loans.forEach(loan => {
                const card = document.createElement('div');
                card.className = 'loan-card';
                card.innerHTML = `
                    <h4>Inguzanyo ya ${loan.amount.toLocaleString()} RWF</h4>
                    <span class="status ${loan.status}">${loan.status}</span>
                    <p><strong>👤:</strong> ${loan.userId?.email || loan.userId}</p>
                    <p><strong>📝:</strong> ${loan.purpose || '-'}</p>
                    <p><strong>📅:</strong> ${new Date(loan.dueDate).toLocaleDateString()}</p>
                    ${loan.status === 'pending' ? `<button onclick="approveLoan('${loan._id}')" class="btn-small btn-primary">✅ Emeza</button>` : ''}
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        document.getElementById('loansList').innerHTML = '<p>Error loading loans</p>';
    }
}

window.approveLoan = async (loanId) => {
    try {
        const res = await fetch(`http://localhost:5000/api/loan/approve/${loanId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ Inguzanyo yemejwe!');
            loadLoans();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

async function loadUsers() {
    try {
        const res = await fetch('http://localhost:5000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const container = document.getElementById('usersList');
            container.innerHTML = '';
            data.data.forEach(user => {
                const card = document.createElement('div');
                card.className = 'user-card';
                card.innerHTML = `
                    <h4>${user.name || 'Anonymous'}</h4>
                    <p><strong>📧:</strong> ${user.email}</p>
                    <p><strong>👑:</strong> ${user.role || 'user'}</p>
                    <p><strong>💰:</strong> ${(user.balance || 0).toLocaleString()} RWF</p>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        document.getElementById('usersList').innerHTML = '<p>Error loading users</p>';
    }
}

async function loadSystemFund() {
    try {
        const res = await fetch('http://localhost:5000/api/system-fund', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const f = data.data;
            document.getElementById('systemFund').innerHTML = `
                <p><strong>💰 Total:</strong> $${f.totalSupply.toLocaleString()}</p>
                <p><strong>🏦 Loans:</strong> $${f.reservedForLoans.toLocaleString()}</p>
                <p><strong>🤝 Community:</strong> $${f.communityFund.toLocaleString()}</p>
            `;
        }
    } catch (error) {
        document.getElementById('systemFund').innerHTML = '<p>Error</p>';
    }
}

document.getElementById('mintForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseInt(document.getElementById('mintAmount').value);
    const to = document.getElementById('mintTo').value;
    try {
        const res = await fetch('http://localhost:5000/api/system-fund/mint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount, to })
        });
        const data = await res.json();
        const msg = document.getElementById('mintMessage');
        msg.innerHTML = data.success ? '<p style="color:green;">✅ Done</p>' : '<p style="color:red;">❌ Error</p>';
        if (data.success) loadSystemFund();
    } catch (error) {
        document.getElementById('mintMessage').innerHTML = '<p style="color:red;">❌ Error</p>';
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../../index.html';
});

loadLoans();
loadSystemFund();
