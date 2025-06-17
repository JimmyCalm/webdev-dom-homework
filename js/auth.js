"use strict";

import { login, setAuthToken } from "./api.js";

export function renderLoginForm(container, onSuccess) {
  const loginForm = document.createElement("div");
  loginForm.className = "login-form";
  loginForm.innerHTML = `
    <h2>Авторизация</h2>
    <form>
        <div class="form-group">
            <input type="text" class="login-input" placeholder="Логин" required>
        </div>
        <div class="form-group">
            <input type="password" class="password-input" placeholder="Пароль" required>
        </div>
        <button type="submit" class="login-button">Войти</button>
    </form>
    <div class="login-error" style="color: red; display: none;"></div>
  `;

  const form = loginForm.querySelector("form");
  const errorElement = loginForm.querySelector(".login-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const loginInput = loginForm.querySelector(".login-input").value.trim();
    const passwordInput = loginForm
      .querySelector(".password-input")
      .value.trim();

    try {
      const response = await login({
        login: loginInput,
        password: passwordInput,
      });

      setAuthToken(response.user.token);
      localStorage.setItem("authToken", response.user.token);
      localStorage.setItem("userName", response.user.name);

      loginForm.remove();
      onSuccess();
    } catch (error) {
      errorElement.textContent = error.message;
      errorElement.style.display = "block";
    }
  });

  const existingAuthLink = container.querySelector(".auth-link");
  if (existingAuthLink) existingAuthLink.remove();

  container.appendChild(loginForm);
}
