"use strict";

import { getComments, postComment, setAuthToken } from './api.js';
import { renderLoginForm } from './auth.js';

const elements = {
    commentsList: document.querySelector('.comments'),
    nameInput: document.querySelector('.add-form-name'),
    textInput: document.querySelector('.add-form-text'),
    addButton: document.querySelector('.add-form-button'),
    loadingIndicator: document.querySelector('.loading-indicator'),
    initialLoading: document.querySelector('.initial-loading'),
    addForm: document.querySelector('.add-form'),
    container: document.querySelector('.container')
};

let comments = [];
let isAddingComment = false;
let isAuthorized = false;

function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        setAuthToken(token);
        isAuthorized = true;
    }
    updateUI();
}

function updateUI() {
    if (isAuthorized) {
        elements.addForm.style.display = 'block';
        elements.nameInput.readOnly = true;
        elements.nameInput.value = localStorage.getItem('userName') || 'Пользователь';
    } else {
        elements.addForm.style.display = 'none';
        elements.nameInput.readOnly = false;
        elements.nameInput.value = '';
        renderAuthLink();
    }
}

function renderAuthLink() {
    const authLink = document.createElement('div');
    authLink.className = 'auth-link';
    authLink.innerHTML = `
    <p>Чтобы добавить комментарий, <a href="#" class="login-link">авторизуйтесь</a></p>
    `;

    authLink.querySelector('.login-link').addEventListener('click', (e) => {
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
    showInitialLoading();
    loadComments();
    setupEventListeners();
}

function showInitialLoading() {
    elements.initialLoading.style.display = 'block';
    elements.commentsList.style.display = 'none';
}

function hideInitialLoading() {
    elements.initialLoading.style.display = 'none';
    elements.commentsList.style.display = 'block';
}

function loadComments() {
    if (!navigator.onLine) {
        showError("Нет интернета. Комментарии не загружены.");
        hideInitialLoading();
        return;
    }

    getComments()
        .then(data => {
            comments = data;
            renderComments();
            hideInitialLoading();
        })
        .catch(error => {
            showError("Ошибка загрузки комментариев: " + error.message);
            hideInitialLoading();
        });
}

function renderComments() {
    elements.commentsList.innerHTML = comments.map(comment => `
    <li class="comment" data-id="${comment.id}">
      <div class="comment-header">
        <div>${escapeHtml(comment.author.name)}</div>
        <div>${comment.date}</div>
      </div>
      <div class="comment-body">
        <div class="comment-text">${escapeHtml(comment.text)}</div>
      </div>
      <div class="comment-footer">
        <div class="likes">
          <span class="likes-counter">${comment.likes}</span>
          <button class="like-button ${comment.isLiked ? '-active-like' : ''}" data-id="${comment.id}"></button>
        </div>
      </div>
    </li>`).join('');

    document.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', handleLike);
    });

    document.querySelectorAll('.comment').forEach(comment => {
        comment.addEventListener('click', handleCommentClick);
    });
}

function setupEventListeners() {
    elements.addButton.addEventListener('click', handleAddComment);
    elements.textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
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

    if (!navigator.onLine) {
        showError("Нет интернета. Комментарий не отправлен.");
        return;
    }

    if (!validateForm() || isAddingComment) return;

    const commentData = {
        text: elements.textInput.value.trim()
    };

    isAddingComment = true;
    disableForm(true);

    postComment(commentData)
        .then(() => {
            elements.textInput.value = '';
            return loadComments();
        })
        .catch(error => {
            if (error.message === 'auth_error') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userName');
                isAuthorized = false;
                updateUI();
                renderLoginForm(elements.container, () => {
                    isAuthorized = true;
                    updateUI();
                    loadComments();
                });
                return;
            }
            showError("Не удалось добавить комментарий: " + error.message);
            console.error(error);
        })
        .finally(() => {
            disableForm(false);
            isAddingComment = false;
        });
}

function handleLike(event) {
    event.stopPropagation();
    const commentId = event.target.dataset.id;
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    comment.isLiked = !comment.isLiked;
    comment.likes += comment.isLiked ? 1 : -1;
    renderComments();
}

function handleCommentClick(event) {
    if (event.target.closest('.like-button')) return;
    const comment = comments.find(c => c.id === event.currentTarget.dataset.id);
    elements.textInput.value = `> ${comment.author.name} писал(а): ${comment.text}\n\n`;
    elements.nameInput.focus();
}

function validateForm() {
    const text = elements.textInput.value.trim();

    if (!isAuthorized) {
        const name = elements.nameInput.value.trim();
        if (!name) {
            showError('Введите имя');
            return false;
        }
        if (name.length < 3) {
            showError('Имя должно быть не короче 3 символов');
            return false;
        }
    }

    if (!text) {
        showError('Введите комментарий');
        return false;
    }
    if (text.length < 3) {
        showError('Комментарий должен быть не короче 3 символов');
        return false;
    }
    return true;
}

function escapeHtml(unsafe) {
    return unsafe
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function disableForm(state) {
    elements.addButton.disabled = state;
    elements.nameInput.disabled = state;
    elements.textInput.disabled = state;
    elements.addButton.textContent = state ? 'Добавление...' : 'Добавить';
}

function showError(message) {
    alert(message);
}

init();
