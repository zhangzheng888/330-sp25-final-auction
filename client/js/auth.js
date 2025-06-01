// const API_BASE_URL = 'http://localhost:3000/api/v1'; // Adjust if your port is different
// This line is now removed, as API_BASE_URL will be defined in config.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            loginMessage.textContent = ''; // Clear previous messages

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    loginMessage.style.color = 'green';
                    loginMessage.textContent = 'Login successful! Redirecting...';
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                    window.location.href = 'dashboard.html'; // Redirect to dashboard
                } else {
                    loginMessage.style.color = 'red';
                    loginMessage.textContent = data.message || 'Login failed. Please check your credentials.';
                }
            } catch (error) {
                loginMessage.style.color = 'red';
                loginMessage.textContent = 'An error occurred. Please try again.';
                console.error('Login error:', error);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const leagueCode = registerForm.leagueCode.value || undefined; // Send undefined if empty
            registerMessage.textContent = ''; // Clear previous messages

            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password, leagueCode }),
                });

                const data = await response.json();

                if (response.status === 201) {
                    registerMessage.style.color = 'green';
                    registerMessage.textContent = 'Registration successful! Redirecting to login...';
                    // Optionally store token and user info if registration logs them in directly
                    // localStorage.setItem('token', data.token);
                    // localStorage.setItem('user', JSON.stringify(data.data.user));
                    setTimeout(() => {
                         window.location.href = 'index.html'; // Redirect to login page after a short delay
                    }, 2000);
                } else {
                    registerMessage.style.color = 'red';
                    registerMessage.textContent = data.message || 'Registration failed. Please check your input.';
                    if (data.errors) {
                        let errorText = data.message;
                        for (const key in data.errors) {
                            errorText += `\n- ${data.errors[key].message}`;
                        }
                        registerMessage.textContent = errorText;
                    }
                }
            } catch (error) {
                registerMessage.style.color = 'red';
                registerMessage.textContent = 'An error occurred during registration. Please try again.';
                console.error('Registration error:', error);
            }
        });
    }
}); 