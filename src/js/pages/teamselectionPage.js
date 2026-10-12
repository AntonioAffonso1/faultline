
const missionParams = new URLSearchParams(window.location.search);
const requestedLevel = Number(missionParams.get("level"));

const selectedLevel = [1, 2, 3].includes(requestedLevel)
    ? requestedLevel
    : 1;

const missions = {
    1: {
        title: "O Despertar",
        description: "Primeiro contato com a ruptura."
    },
    2: {
        title: "Zona Morta",
        description: "Algo permanece ativo sob a cidade."
    },
    3: {
        title: "Falha Terminal",
        description: "O limite entre os mundos está cedendo."
    }
};

const skillIcons = {
    "percepcao": {
        name: "Percepção",
        icon: "percepcao.png"
    },
    "estocada-corrompida": {
        name: "Estocada Corrompida",
        icon: "estocada-corrimpida.png"
    },
    "condenacao": {
        name: "Condenação",
        icon: "condenacao.png"
    },
    "bencao-abissal": {
        name: "Benção Abissal",
        icon: "bencao-abissal.png"
    }
};

const selectedCharacters = [];
const MAX_TEAM_SIZE = 3;

const teamSlotsElement = document.getElementById("team-slots");
const rosterElement = document.getElementById("character-roster");
const teamCountElement = document.getElementById("team-count");
const feedbackElement = document.getElementById("team-feedback");
const confirmButton = document.getElementById("confirm-team-button");

const mission = missions[selectedLevel];

document.getElementById("mission-title").textContent = mission.title;
document.getElementById("mission-description").textContent =
    mission.description;

function getSavedCharacters() {
    if (
        typeof CharacterManager === "undefined" ||
        typeof CharacterManager.getAll !== "function"
    ) {
        console.error(
            "CharacterManager.getAll() não está disponível. Verifique os scripts."
        );
        return [];
    }

    return CharacterManager.getAll() ?? [];
}

function getPortraitPath(character) {
    return character.appearance ||
        "src/assets/images/characters/personagem-01.png";
}

function createPortrait(character) {
    const image = document.createElement("img");

    image.className = "character-portrait";
    image.src = getPortraitPath(character);
    image.alt = `Retrato de ${character.name}`;
    image.loading = "lazy";

    image.addEventListener("error", () => {
        image.onerror = null;
        image.src = "src/assets/images/characters/personagem-01.png";
    });

    return image;
}

function createSkillIcons(character) {
    const container = document.createElement("div");
    container.className = "character-skills";
    container.setAttribute("aria-label", "Habilidades equipadas");

    const skills = Array.isArray(character.skills)
        ? character.skills
        : [];

    if (skills.length === 0) {
        const empty = document.createElement("span");
        empty.className = "no-skills";
        empty.textContent = "Sem habilidades";
        container.append(empty);
        return container;
    }

    for (const skillId of skills.slice(0, 3)) {
        const skill = skillIcons[skillId];

        if (!skill) {
            continue;
        }

        const image = document.createElement("img");
        image.className = "skill-mini-icon";
        image.src = `src/assets/images/icons/skills/${skill.icon}`;
        image.alt = skill.name;
        image.title = skill.name;
        image.loading = "lazy";

        image.addEventListener("error", () => {
            image.remove();
        });

        container.append(image);
    }

    return container;
}

function renderTeamSlots() {
    teamSlotsElement.replaceChildren();

    for (let index = 0; index < MAX_TEAM_SIZE; index++) {
        const characterId = selectedCharacters[index];

        const character = characterId
            ? getSavedCharacters().find(item => item.id === characterId)
            : null;

        if (!character) {
            const slot = document.createElement("div");
            slot.className = "team-slot empty";
            slot.textContent = `Espaço ${index + 1} — vazio`;
            teamSlotsElement.append(slot);
            continue;
        }

        const slot = document.createElement("article");
        slot.className = "team-slot filled";

        slot.append(createPortrait(character));

        const info = document.createElement("div");
        info.className = "slot-info";

        const name = document.createElement("h3");
        name.textContent = character.name;

        const characterClass = document.createElement("p");
        characterClass.textContent = character.characterClass;

        info.append(name, characterClass, createSkillIcons(character));

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-member-button";
        removeButton.textContent = "×";
        removeButton.setAttribute(
            "aria-label",
            `Remover ${character.name} da equipe`
        );

        removeButton.addEventListener("click", () => {
            removeCharacter(character.id);
        });

        slot.append(info, removeButton);
        teamSlotsElement.append(slot);
    }

    teamCountElement.textContent =
        `${selectedCharacters.length} / ${MAX_TEAM_SIZE}`;

    confirmButton.disabled = selectedCharacters.length === 0;
}

function renderRoster() {
    rosterElement.replaceChildren();

    const characters = getSavedCharacters();

    if (characters.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-roster";
        empty.textContent =
            "Nenhuma ficha foi encontrada. Crie uma ficha antes de iniciar a missão.";

        const link = document.createElement("a");
        link.href = "characters.html";
        link.className = "manage-link";
        link.textContent = "Abrir fichas de personagens →";

        empty.append(document.createElement("br"), link);
        rosterElement.append(empty);
        return;
    }

    for (const character of characters) {
        const isSelected = selectedCharacters.includes(character.id);
        const isFull = selectedCharacters.length >= MAX_TEAM_SIZE;

        const card = document.createElement("article");
        card.className =
            `roster-card${isSelected ? " selected" : ""}`;

        card.append(createPortrait(character));

        const info = document.createElement("div");
        info.className = "roster-info";

        const name = document.createElement("h3");
        name.textContent = character.name;

        const characterClass = document.createElement("p");
        characterClass.textContent = character.characterClass;

        info.append(name, characterClass, createSkillIcons(character));

        const button = document.createElement("button");
        button.type = "button";
        button.className = "roster-action";
        button.textContent = isSelected ? "Selecionado" : "Adicionar";
        button.disabled = !isSelected && isFull;

        button.addEventListener("click", () => {
            if (selectedCharacters.includes(character.id)) {
                removeCharacter(character.id);
            } else {
                addCharacter(character.id);
            }
        });

        card.append(info, button);
        rosterElement.append(card);
    }
}

function addCharacter(characterId) {
    if (selectedCharacters.includes(characterId)) {
        return;
    }

    if (selectedCharacters.length >= MAX_TEAM_SIZE) {
        feedbackElement.textContent =
            "A equipe já possui três integrantes.";
        return;
    }

    const exists = getSavedCharacters().some(
        character => character.id === characterId
    );

    if (!exists) {
        feedbackElement.textContent =
            "A ficha não foi encontrada. Atualize a página e tente novamente.";
        return;
    }

    selectedCharacters.push(characterId);
    feedbackElement.textContent = "";
    renderAll();
}

function removeCharacter(characterId) {
    const index = selectedCharacters.indexOf(characterId);

    if (index !== -1) {
        selectedCharacters.splice(index, 1);
    }

    feedbackElement.textContent = "";
    renderAll();
}

function renderAll() {
    renderTeamSlots();
    renderRoster();
}

confirmButton.addEventListener("click", () => {
    if (selectedCharacters.length === 0) {
        feedbackElement.textContent =
            "Selecione pelo menos um personagem.";
        return;
    }

    const savedCharacters = getSavedCharacters();

    const validTeam = selectedCharacters.filter(id =>
        savedCharacters.some(character => character.id === id)
    );

    if (validTeam.length !== selectedCharacters.length) {
        feedbackElement.textContent =
            "Uma ficha não está mais disponível. Revise a equipe.";
        return;
    }

    const pendingMission = {
        level: selectedLevel,
        teamIds: [...validTeam],
        confirmedAt: new Date().toISOString()
    };

    localStorage.setItem(
        "faultline_pending_mission",
        JSON.stringify(pendingMission)
    );

    window.location.href = `level.html?level=${selectedLevel}`;
});

renderAll();
