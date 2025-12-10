// public/js/api.js

// Simple mock login: test / test
function mockLogin(event) {
  event.preventDefault();

  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");

  const username = (usernameEl?.value || "").trim();
  const password = (passwordEl?.value || "").trim();

  if (username === "test" && password === "test") {
    // store fake auth info
    localStorage.setItem("token", "mock-token");
    localStorage.setItem("userId", "mock-user-1");
    localStorage.setItem("username", username);

    // always go to profile setup FIRST
    window.location.href = "/pages/profile.html";
  } else {
    alert("Invalid credentials. Use username: test and password: test");
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  window.location.href = "/pages/login.html";
}

// expose globally for inline handlers
window.mockLogin = mockLogin;
window.logout = logout;
