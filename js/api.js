"use strict";

const BASE_URL = "https://wedev-api.sky.pro/api/v1/Timur/comments";

export function getComments() {
    return fetch(BASE_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error("Ошибка сервера");
            }
            return response.json();
        })
        .then(data => {
            return data.comments.map(comment => ({
                name: comment.author.name,
                date: formatDate(comment.date),
                text: comment.text,
                likes: 0,
                isLiked: false
            }));
        });
}

export function postComment({ name, text }) {
    return fetch(BASE_URL, {
        method: "POST",
        body: JSON.stringify({
            name,
            text,
            forceError: false
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Ошибка добавления");
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