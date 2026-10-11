const levelButtons = document.querySelectorAll(".level-button");

for (const button of levelButtons) {
    button.addEventListener("click", () => {
        const levelNumber = button.id.replace("level-", "");

        console.log(`Nível ${levelNumber} selecionado.`);
    });
}