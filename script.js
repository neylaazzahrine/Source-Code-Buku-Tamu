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

// Handle form submission
document.getElementById('guestForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    const category = document.getElementById('category').value;
    const message = document.getElementById('message').value.trim();

    if (!name) {
        showNotification('Nama wajib diisi!', 'error');
        return;
    }

    const guestsRef = database.ref('guests');
    const newGuestRef = guestsRef.push();
    
    newGuestRef.set({
        name,
        address,
        category,
        message,
        attendance_count: 1,
        created_at: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        console.log('Data berhasil tersimpan dengan ID:', newGuestRef.key);
        showNotification('Terima kasih! Data Anda telah tersimpan.', 'success');
        document.getElementById('guestForm').reset();
    }).catch((error) => {
        console.error('Error adding data:', error.code, error.message);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    });
});

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}
