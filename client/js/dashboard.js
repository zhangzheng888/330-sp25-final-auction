document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const logoutButton = document.getElementById('logoutButton');

    if (!token || !user) {
        // If no token or user info, redirect to login
        window.location.href = 'index.html';
        return; // Stop further execution
    }

    // Personalize the dashboard (optional)
    const welcomeMessage = document.querySelector('.container h1');
    if (welcomeMessage && user.username) {
        welcomeMessage.textContent = `Welcome, ${user.username}!`;
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html'; // Redirect to login page
        });
    }

    // You can add more dashboard-specific JavaScript here
    // For example, fetching user-specific data from the server using the stored token
    console.log('Token:', token);
    console.log('User:', user);
}); 