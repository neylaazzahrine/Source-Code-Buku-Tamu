// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDpnIirjZb5QMXVbROCc9e82MazZYBc-m4",
  authDomain: "sbdklp.firebaseapp.com",
  databaseURL: "https://sbdklp-default-rtdb.firebaseio.com",
  projectId: "sbdklp",
  storageBucket: "sbdklp.firebasestorage.app",
  messagingSenderId: "113960528062",
  appId: "1:113960528062:web:6483978a7bcd25cf1216ef"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

let guestsData = [];
let chart;

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadGuestsData();
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }
});

// Login
document.getElementById('loginBtn').addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showLoginNotification('Login berhasil!', 'success');
        })
        .catch((error) => {
            showLoginNotification('Login gagal: ' + error.message, 'error');
        });
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut();
});

// Load guests data
function loadGuestsData() {
    const guestsRef = database.ref('guests');
    guestsRef.on('value', (snapshot) => {
        guestsData = [];
        snapshot.forEach((childSnapshot) => {
            const guest = { id: childSnapshot.key, ...childSnapshot.val() };
            guestsData.push(guest);
        });
        // Sort by created_at desc
        guestsData.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        updateStats();
        renderTable();
        renderChart();
    });
}

// Update statistics
function updateStats() {
    const totalGuests = guestsData.length;
    const totalAttendance = guestsData.reduce((sum, guest) => sum + (guest.attendance_count || 0), 0);
    const familyCount = guestsData.filter(g => g.category === 'keluarga').length;
    const friendCount = guestsData.filter(g => g.category === 'teman').length;
    const colleagueCount = guestsData.filter(g => g.category === 'rekan kerja').length;

    document.getElementById('totalGuests').textContent = totalGuests;
    document.getElementById('totalAttendance').textContent = totalAttendance;
    document.getElementById('familyCount').textContent = familyCount;
    document.getElementById('friendCount').textContent = friendCount;
    document.getElementById('colleagueCount').textContent = colleagueCount;
}

// Render chart
function renderChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const categories = ['keluarga', 'teman', 'rekan kerja'];
    const counts = categories.map(cat => guestsData.filter(g => g.category === cat).length);

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Keluarga', 'Teman', 'Rekan Kerja'],
            datasets: [{
                data: counts,
                backgroundColor: ['#d4af37', '#f4e87c', '#c3cfe2']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Render table
function renderTable(filteredData = guestsData) {
    const tbody = document.getElementById('guestsTableBody');
    tbody.innerHTML = '';

    filteredData.forEach(guest => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${guest.name}</td>
            <td>${guest.address || '-'}</td>
            <td>${guest.category}</td>
            <td>${guest.message || '-'}</td>
            <td>${guest.attendance_count || 1}</td>
            <td>${guest.created_at ? new Date(guest.created_at).toLocaleString('id-ID') : '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Search and filter
document.getElementById('searchInput').addEventListener('input', filterData);
document.getElementById('filterCategory').addEventListener('change', filterData);
document.getElementById('sortBy').addEventListener('change', sortData);

function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;

    let filtered = guestsData.filter(guest =>
        guest.name.toLowerCase().includes(searchTerm) &&
        (categoryFilter === '' || guest.category === categoryFilter)
    );

    renderTable(filtered);
}

function sortData() {
    const sortBy = document.getElementById('sortBy').value;

    guestsData.sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'attendance_count') {
            return (b.attendance_count || 0) - (a.attendance_count || 0);
        } else {
            return b.created_at - a.created_at;
        }
    });

    renderTable();
}

// Export functions
document.getElementById('exportExcel').addEventListener('click', exportToExcel);
document.getElementById('exportPDF').addEventListener('click', exportToPDF);

function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(guestsData.map(guest => ({
        Nama: guest.name,
        Alamat: guest.address || '',
        Kategori: guest.category,
        Pesan: guest.message || '',
        'Jumlah Hadir': guest.attendance_count || 1,
        Waktu: guest.created_at ? new Date(guest.created_at).toLocaleString('id-ID') : ''
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guests');
    XLSX.writeFile(wb, 'daftar_hadir.xlsx');
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Daftar Hadir Tamu', 20, 20);

    let y = 40;
    guestsData.forEach((guest, index) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(12);
        doc.text(`${index + 1}. ${guest.name} - ${guest.category} - ${guest.attendance_count || 1} kali`, 20, y);
        y += 10;
    });

    doc.save('daftar_hadir.pdf');
}

function showLoginNotification(message, type) {
    const notification = document.getElementById('loginNotification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}
