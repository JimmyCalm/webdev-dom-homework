export function escapeHtml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function validateForm({ isAuthorized, name, text }) {
  if (!isAuthorized) {
    if (!name) return "Введите имя";
    if (name.length < 3) return "Имя должно быть не короче 3 символов";
  }

  if (!text) return "Введите комментарий";
  if (text.length < 3) return "Комментарий должен быть не короче 3 символов";

  return null;
}
