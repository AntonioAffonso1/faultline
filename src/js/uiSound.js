
(() => {
    const HOVER_SOUND = "src/assets/audio/mouse/mouse_hover.mp3";
    const CLICK_SOUND = "src/assets/audio/mouse/mouse_click.mp3";

    const hoverAudio = new Audio(HOVER_SOUND);
    const clickAudio = new Audio(CLICK_SOUND);

    // Volume entre 0.0 e 1.0
    hoverAudio.volume = 0.35;
    clickAudio.volume = 0.5;

    // Evita sons sobrepostos excessivamente.
    let lastHoverTarget = null;

    function playSound(audio) {
        // Reinicia o áudio para permitir cliques rápidos.
        audio.currentTime = 0;

        const playback = audio.play();

        // Trata eventuais bloqueios ou falhas de reprodução.
        if (playback) {
            playback.catch(() => {});
        }
    }

    // Som ao entrar com o mouse em um botão.
    document.addEventListener("pointerover", (event) => {
        const button = event.target.closest(
            "button, input[type='button'], input[type='submit'], [role='button'], .button"
        );

        if (!button || button.disabled) return;

        // Não repetir o som ao passar por elementos internos
        // do mesmo botão, como ícones ou textos.
        if (button === lastHoverTarget) return;

        lastHoverTarget = button;
        playSound(hoverAudio);
    });

    // Som ao clicar em um botão.
    document.addEventListener("click", (event) => {
        const button = event.target.closest(
            "button, input[type='button'], input[type='submit'], [role='button'], .button"
        );

        if (!button || button.disabled) return;

        playSound(clickAudio);
    });

    // Permite que o som de hover toque novamente
    // quando o mouse sair e retornar ao mesmo botão.
    document.addEventListener("pointerout", (event) => {
        const button = event.target.closest(
            "button, input[type='button'], input[type='submit'], [role='button'], .button"
        );

        if (!button) return;

        const nextTarget = event.relatedTarget;

        if (!nextTarget || !button.contains(nextTarget)) {
            if (lastHoverTarget === button) {
                lastHoverTarget = null;
            }
        }
    });
})();
