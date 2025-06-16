"use strict";

const COMMENTS_URL = "https://wedev-api.sky.pro/api/v2/Timur/comments";
const LOGIN_URL = "https://wedev-api.sky.pro/api/user/login";
let authToken = null;

export function setAuthToken(token) {
    authToken = token;
}

export function getComments() {
    return fetch(COMMENTS_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error("Ошибка сервера");
            }
            return response.json();
        })
        .then(data => {
            return data.comments.map(comment => ({
                id: comment.id,
                author: comment.author,
                date: formatDate(comment.date),
                text: comment.text,
                likes: comment.likes,
                isLiked: comment.isLiked
            }));
        });
}

export function postComment({ text }) {
    return fetch(COMMENTS_URL, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ text })
    })
    .then(response => {
        if (response.status === 401) {
            throw new Error("auth_error");
        }
        if (!response.ok) {
            throw new Error("server_error");
        }
        return response.json();
    })
    .catch(error => {
        if (error.message.includes("Failed to fetch")) {
            throw new Error("Нет интернет-соединения");
        }
        throw error;
    });
}

export function login({ login, password }) {
    return fetch(LOGIN_URL, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ login, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Неверный логин или пароль");
        }
        return response.json();
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(',', '');
}
