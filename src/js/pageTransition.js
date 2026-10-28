// transições
const transitionLayer = document.createElement("div");

transitionLayer.id = "page-transition";
transitionLayer.setAttribute("aria-hidden", "true");

document.body.appendChild(transitionLayer);

// Ativa a transição de saída antes de navegar
document.addEventListener("click", (event) => {
    const link = event.target.closest("a");

    if (!link) return;

    const destination = link.getAttribute("href");

    // Ignora links especiais ou que abrem outra aba
    if (
        !destination ||
        destination.startsWith("#") ||
        link.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
    ) {
        return;
    }

    const url = new URL(link.href, window.location.href);

    // Não anima links externos nem a página atual
    if (
        url.origin !== window.location.origin ||
        url.href === window.location.href
    ) {
        return;
    }

    event.preventDefault();

    transitionLayer.classList.add("active");

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    window.setTimeout(() => {
        window.location.href = url.href;
    }, reduceMotion ? 0 : 300);
});
