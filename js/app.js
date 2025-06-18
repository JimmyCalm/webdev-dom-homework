"use strict";

import { getComments, postComment, setAuthToken } from "./api.js";
import { renderLoginForm } from "./auth.js";
import { renderComments, disableForm, showError } from "./ui.js";
import { validateForm } from "./utils.js";

const elements = {
  commentsList: document.querySelector(".comments"),
  nameInput: document.querySelector(".add-form-name"),
  textInput: document.querySelector(".add-form-text"),
  addButton: document.querySelector(".add-form-button"),
  initialLoading: document.querySelector(".initial-loading"),
  addForm: document.querySelector(".add-form"),
  container: document.querySelector(".container"),
};

let comments = [];
let isAddingComment = false;
let isAuthorized = false;

function checkAuth() {
  const token = localStorage.getItem("authToken");
  if (token) {
    setAuthToken(token);
    isAuthorized = true;
  }
  updateUI();
}

function updateUI() {
  if (isAuthorized) {
    elements.addForm.style.display = "block";
    elements.nameInput.readOnly = true;
    elements.nameInput.value =
      localStorage.getItem("userName") || "Пользователь";
  } else {
    elements.addForm.style.display = "none";
    renderAuthLink();
  }
}

function renderAuthLink() {
  const authLink = document.createElement("div");
  authLink.className = "auth-link";
  authLink.innerHTML = `
    <p>Чтобы добавить комментарий, <a href="#" class="login-link">авторизуйтесь</a></p>
  `;
  authLink.querySelector(".login-link").addEventListener("click", (e) => {
    e.preventDefault();
    renderLoginForm(elements.container, () => {
      isAuthorized = true;
      updateUI();
      loadComments();
    });
  });
  elements.container.appendChild(authLink);
}

function init() {
  checkAuth();
  elements.initialLoading.style.display = "block";
  elements.commentsList.style.display = "none";
  loadComments();
  setupEvents();
}

function loadComments() {
  if (!navigator.onLine) {
    showError("Нет интернета. Комментарии не загружены.");
    return;
  }

  getComments()
    .then((data) => {
      comments = data;
      renderComments(elements.commentsList, comments, handleLike, handleReply);
      elements.initialLoading.style.display = "none";
      elements.commentsList.style.display = "block";
    })
    .catch((error) => {
      showError("Ошибка загрузки: " + error.message);
    });
}

function handleLike(event) {
  event.stopPropagation();
  const id = event.target.dataset.id;
  const comment = comments.find((c) => c.id === id);
  if (!comment) return;
  comment.isLiked = !comment.isLiked;
  comment.likes += comment.isLiked ? 1 : -1;
  renderComments(elements.commentsList, comments, handleLike, handleReply);
}

function handleReply(event) {
  if (event.target.closest(".like-button")) return;
  const comment = comments.find((c) => c.id === event.currentTarget.dataset.id);
  elements.textInput.value = `> ${comment.author.name} писал(а): ${comment.text}\n\n`;
  elements.nameInput.focus();
}

function setupEvents() {
  elements.addButton.addEventListener("click", handleAddComment);
  elements.textInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  });
}

function handleAddComment() {
  if (!isAuthorized) {
    renderLoginForm(elements.container, () => {
      isAuthorized = true;
      updateUI();
      loadComments();
    });
    return;
  }

  const validationError = validateForm({
    isAuthorized,
    name: elements.nameInput.value.trim(),
    text: elements.textInput.value.trim(),
  });
  if (validationError || isAddingComment) {
    showError(validationError);
    return;
  }

  isAddingComment = true;
  disableForm(elements, true);

  postComment({ text: elements.textInput.value.trim() })
    .then(() => {
      elements.textInput.value = "";
      return loadComments();
    })
    .catch((error) => {
      if (error.message === "auth_error") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userName");
        isAuthorized = false;
        updateUI();
        renderLoginForm(elements.container, () => {
          isAuthorized = true;
          updateUI();
          loadComments();
        });
      } else {
        showError("Не удалось добавить комментарий: " + error.message);
      }
    })
    .finally(() => {
      isAddingComment = false;
      disableForm(elements, false);
    });
}

init();
