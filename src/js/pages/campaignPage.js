
const levelButtons = document.querySelectorAll(".level-button");

for (const button of levelButtons) {
    button.addEventListener("click", () => {
        const levelNumber = Number(
            button.id.replace("level-", "")
        );

        if (![1, 2, 3].includes(levelNumber)) {
            return;
        }

        window.location.href =
            `team-selection.html?level=${levelNumber}`;
    });
}
