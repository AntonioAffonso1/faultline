const missionNames = {
    1: "O Despertar",
    2: "Zona Morta",
    3: "Falha Terminal"
};

const missionNumber = Number(
    localStorage.getItem("faultline_completed_level")
);

const summaryRaw = localStorage.getItem("faultline_victory_summary");

const missionNameElement = document.getElementById(
    "victory-mission-name"
);
const enemiesElement = document.getElementById("victory-enemies");
const teamCountElement = document.getElementById("victory-team-count");
const teamElement = document.getElementById("victory-team");
const feedbackElement = document.getElementById("victory-feedback");

function showMissingSummary() {
    missionNameElement.textContent =
        missionNames[missionNumber] ?? "Missão";

    enemiesElement.textContent = "Indisponível";
    teamCountElement.textContent = "—";

    feedbackElement.textContent =
        "Resumo de combate não encontrado. Os dados serão exibidos após uma missão concluída.";
}

function renderVictorySummary(summary) {
    missionNameElement.textContent =
        summary.missionName ?? missionNames[missionNumber] ?? "Missão";

    enemiesElement.textContent =
        `${summary.defeatedEnemies} / ${summary.totalEnemies}`;

    teamCountElement.textContent = summary.team.length;

    teamElement.replaceChildren();

    for (const character of summary.team) {
        const card = document.createElement("article");
        card.className = "victory-character";

        const image = document.createElement("img");
        image.src = character.appearance ||
            "src/assets/images/characters/personagem-01.png";
        image.alt = `Retrato de ${character.name}`;

        image.onerror = () => {
            image.onerror = null;
            image.src = "src/assets/images/characters/personagem-01.png";
        };

        const info = document.createElement("div");
        info.className = "victory-character-info";

        const name = document.createElement("h3");
        name.textContent = character.name;

        const healthText = document.createElement("p");
        healthText.textContent =
            `Vida: ${character.health} / ${character.maxHealth}`;

        const healthTrack = document.createElement("div");
        healthTrack.className = "victory-health-track";

        const healthFill = document.createElement("div");
        healthFill.className = "victory-health-fill";

        const healthPercent = character.maxHealth > 0
            ? Math.max(0, Math.min(
                100,
                (character.health / character.maxHealth) * 100
            ))
            : 0;

        healthFill.style.width = `${healthPercent}%`;

        healthTrack.append(healthFill);
        info.append(name, healthText, healthTrack);
        card.append(image, info);
        teamElement.append(card);
    }
}

try {
    const summary = summaryRaw ? JSON.parse(summaryRaw) : null;

    if (
        summary &&
        Array.isArray(summary.team) &&
        summary.team.length > 0
    ) {
        renderVictorySummary(summary);
    } else {
        showMissingSummary();
    }
} catch (error) {
    console.error("Erro ao carregar o resumo da vitória:", error);
    showMissingSummary();
}

document.getElementById("campaign-button").addEventListener("click", () => {
    window.location.href = "campaign.html";
});

document.getElementById("menu-button").addEventListener("click", () => {
    window.location.href = "index.html";
});