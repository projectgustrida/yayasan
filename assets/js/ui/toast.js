export function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const icon = document.getElementById('toast-icon');
    if (!toast) return;
    toastMsg.innerText = msg;
    icon.className = isError
        ? "fa-solid fa-circle-exclamation text-red-400 text-sm"
        : "fa-solid fa-circle-check text-primary text-sm";
    toast.classList.remove('hidden-view');
    toast.classList.add('toast-animate');
    setTimeout(() => {
        toast.classList.add('hidden-view');
        toast.classList.remove('toast-animate');
    }, 3000);
}