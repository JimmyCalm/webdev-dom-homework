"use strict";

import { getComments, postComment } from './api.js';

const elements = {
    commentsList: document.querySelector('.comments'),
    nameInput: document.querySelector('.add-form-name'),
    textInput: document.querySelector('.add-form-text'),
    addButton: document.querySelector('.add-form-button'),
    loadingIndicator: document.querySelector('.loading-indicator'),
    initialLoading: document.querySelector('.initial-loading')
};

let comments = [];
let isAddingComment = false;

function init() {
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
            if (error.message === "Failed to fetch") {
                showError("Нет подключения к интернету.");
            } else {
                showError("Не удалось загрузить комментарии");
            }
            hideInitialLoading();
        });
}

function renderComments() {
    elements.commentsList.innerHTML = comments.map((comment, index) => `
        <li class="comment" data-index="${index}">
            <div class="comment-header">
                <div>${escapeHtml(comment.name)}</div>
                <div>${comment.date}</div>
            </div>
            <div class="comment-body">
                <div class="comment-text">${escapeHtml(comment.text)}</div>
            </div>
            <div class="comment-footer">
                <div class="likes">
                    <span class="likes-counter">${comment.likes}</span>
                    <button class="like-button ${comment.isLiked ? '-active-like' : ''}" 
                            data-index="${index}"></button>
                </div>
            </div>
        </li>`
    ).join('');

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
    if (!navigator.onLine) {
        showError("Нет интернета. Комментарий не отправлен.");
        return;
    }

    if (!validateForm() || isAddingComment) return;

    const commentData = {
        name: elements.nameInput.value.trim(),
        text: elements.textInput.value.trim()
    };

    isAddingComment = true;
    disableForm(true);

    postComment(commentData)
        .then(() => {
            elements.nameInput.value = '';
            elements.textInput.value = '';
            return loadComments();
        })
        .catch(error => {
            if (error.message === "network_error") {
                showError("Нет интернет-соединения. Проверьте подключение.");
            } else if (error.message === "server_error_500") {
                showError("Ошибка сервера. Пожалуйста, попробуйте позже.");
            } else {
                showError("Не удалось добавить комментарий: " + error.message);
            }
            console.error(error);
        })
        .finally(() => {
            disableForm(false);
            isAddingComment = false;
        });
}

function handleLike(event) {
    event.stopPropagation();
    const index = event.target.dataset.index;
    const comment = comments[index];

    comment.isLiked = !comment.isLiked;
    comment.likes += comment.isLiked ? 1 : -1;

    renderComments();
}

function handleCommentClick(event) {
    if (event.target.closest('.like-button')) return;

    const index = event.currentTarget.dataset.index;
    const comment = comments[index];

    elements.textInput.value = `> ${comment.name} писал(а): ${comment.text}\n\n`;
    elements.nameInput.focus();
}

function validateForm() {
    const name = elements.nameInput.value.trim();
    const text = elements.textInput.value.trim();

    if (!name) {
        showError('Введите имя');
        return false;
    }
    if (name.length < 3) {
        showError('Имя должно быть не короче 3 символов');
        return false;
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