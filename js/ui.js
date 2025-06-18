import { escapeHtml } from "./utils.js";

export function renderComments(
  container,
  comments,
  onLikeClick,
  onCommentClick,
) {
  container.innerHTML = comments
    .map(
      (comment) => `
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
              <button class="like-button ${comment.isLiked ? "-active-like" : ""}" data-id="${comment.id}"></button>
            </div>
          </div>
        </li>`,
    )
    .join("");

  container
    .querySelectorAll(".like-button")
    .forEach((btn) => btn.addEventListener("click", onLikeClick));
  container
    .querySelectorAll(".comment")
    .forEach((el) => el.addEventListener("click", onCommentClick));
}

export function showError(message) {
  alert(message);
}

export function disableForm({ nameInput, textInput, addButton }, state) {
  nameInput.disabled = state;
  textInput.disabled = state;
  addButton.disabled = state;
  addButton.textContent = state ? "Добавление..." : "Добавить";
}
