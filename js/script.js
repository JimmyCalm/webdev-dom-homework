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
    getComments()
        .then(data => {
            comments = data;
            renderComments();
            hideInitialLoading();
        })
        .catch(error => {
            showError('Не удалось загрузить комментарии');
            console.error(error);
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
            showError('Не удалось добавить комментарий');
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
    if (!elements.nameInput.value.trim()) {
        showError('Введите имя');
        elements.nameInput.focus();
        return false;
    }
    if (!elements.textInput.value.trim()) {
        showError('Введите комментарий');
        elements.textInput.focus();
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