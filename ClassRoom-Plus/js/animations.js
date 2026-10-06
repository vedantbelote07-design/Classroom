// ClassRoom+ animations & interactions (jQuery)
(function ($) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scroll progress bar + navbar shrink
    $("body").append('<div id="progress"></div>');
    $(window).on("scroll", function () {
        const y = $(this).scrollTop(), h = $(document).height() - $(this).height();
        $("#progress").width((h > 0 ? (y / h) * 100 : 0) + "%");
        $(".navbar").toggleClass("scrolled", y > 20);
    }).trigger("scroll");

    // Scroll-reveal with stagger (also picks up dynamically rendered cards)
    const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { $(e.target).addClass("in"); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    const SEL = ".stat-card,.feature-card,.room-card,.slot-card,.booking-card,.dashboard-stat,.table-card,.filter-box,.form-card,.empty-state,.page-header .container>*,.hero .col-7>*,.section-padding .text-center";
    function prep(root) {
        let i = 0;
        $(root).find(SEL).addBack(SEL).not(".reveal").each(function () {
            this.style.setProperty("--d", (i++ % 8) * 0.08 + "s");
            $(this).addClass("reveal");
            io.observe(this);
        });
    }
    prep(document.body);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && prep(n))))
        .observe(document.body, { childList: true, subtree: true });

    // Count-up numbers (fired by setCount in booking.js)
    const cio = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target, to = +el.dataset.count || 0, t0 = performance.now();
        if (reduce || !to) { el.textContent = to; return; }
        (function f(t) {
            const p = Math.min((t - t0) / 1100, 1);
            el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(f);
        })(t0);
    }));
    document.addEventListener("ux:count", e => { e.target.textContent = 0; cio.observe(e.target); });

    // Button ripple
    $(document).on("click", ".btn", function (e) {
        const r = this.getBoundingClientRect();
        $('<span class="ripple"></span>').css({ left: e.clientX - r.left, top: e.clientY - r.top })
            .appendTo(this).on("animationend", function () { $(this).remove(); });
    });

    // Smooth page transitions
    $(document).on("click", "a[href]", function (e) {
        const h = this.getAttribute("href");
        if (e.ctrlKey || e.metaKey || this.target || h[0] === "#" || /^(https?:|mailto)/.test(h)) return;
        e.preventDefault();
        $("body").addClass("leaving");
        setTimeout(() => (location.href = h), 230);
    });
    $(window).on("pageshow", () => $("body").removeClass("leaving"));

    // Whole slot card is clickable; booked slot gives feedback
    $(document).on("click", ".slot-card.available", function (e) {
        if (!$(e.target).closest("a").length) location.href = $(this).find("a").attr("href");
    });
    $(document).on("click", ".slot-card.booked", () => UI.toast("This slot is not available", "err"));
})(jQuery);
