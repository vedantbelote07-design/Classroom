// Shared helpers: dates, escaping, toasts, confirm modal

function localDate(d = new Date()) {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

function setToday(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.min = localDate();
    if (!input.value) input.value = localDate();
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const UI = {
    toast(msg, type) {
        let c = $("#toasts");
        if (!c.length) c = $('<div id="toasts"></div>').appendTo("body");
        const el = $('<div class="toast-ux ' + (type || "ok") + '">' + esc(msg) + "</div>").appendTo(c);
        setTimeout(() => el.fadeOut(300, () => el.remove()), 2800);
    },
    confirm(title, text) {
        return new Promise(res => {
            const m = $('<div class="modal fade" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content" style="border-radius:18px"><div class="modal-body p-4"><h5 class="fw-bold">' + esc(title) + '</h5><p class="text-muted mb-4">' + esc(text) + '</p><div class="text-end"><button class="btn btn-light me-2" data-no>No, keep</button><button class="btn btn-danger" data-yes>Yes, continue</button></div></div></div></div></div>').appendTo("body");
            let ok = false;
            const bm = new bootstrap.Modal(m[0]);
            m.on("click", "[data-yes]", () => { ok = true; bm.hide(); })
             .on("click", "[data-no]", () => bm.hide())
             .on("hidden.bs.modal", () => { m.remove(); res(ok); });
            bm.show();
        });
    }
};
