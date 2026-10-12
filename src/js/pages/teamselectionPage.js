
const missionParams = new URLSearchParams(window.location.search);

const requestedLevel = Number(missionParams.get("level"));
const selectedLevel = [1, 2, 3].includes(requestedLevel)
    ? requestedLevel
    : 1;

const missionDefinitions = {
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

const mission = missionDefinitions[selectedLevel];

const teamSlotsElement = document.getElementById("team-slots");
const rosterElement = document.getElementById("character-roster");
const teamCountElement = document.getElementById("team-count");
const feedbackElement = document.getElementById("team-feedback");
const confirmButton = document.getElementById("confirm-team-button");

const selectedCharacters = [];
const MAX_TEAM_SIZE = 3;

document.getElementById("mission-title").textContent = mission.title;
document.getElementById("mission-description").textContent =
    mission.description;

function getSavedCharacters() {
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

        info.append(name, characterClass);

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
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "empty-roster";
        emptyMessage.textContent =
            "Nenhuma ficha encontrada. Crie um personagem antes de iniciar uma missão.";

        const createLink = document.createElement("a");
        createLink.className = "manage-link";
        createLink.href = "character-creator.html";
        createLink.textContent = "Criar ficha →";

        emptyMessage.append(
            document.createElement("br"),
            createLink
        );

        rosterElement.append(emptyMessage);
        return;
    }

    for (const character of characters) {
        const isSelected = selectedCharacters.includes(character.id);
        const teamIsFull = selectedCharacters.length >= MAX_TEAM_SIZE;

        const card = document.createElement("article");
        card.className = `roster-card${isSelected ? " selected" : ""}`;

        card.append(createPortrait(character));

        const info = document.createElement("div");
        info.className = "roster-info";

        const name = document.createElement("h3");
        name.textContent = character.name;

        const characterClass = document.createElement("p");
        characterClass.textContent = character.characterClass;

        const stats = document.createElement("p");
        const attributes = character.attributes ?? {};
        stats.textContent =
            `VIT ${attributes.vitality ?? 0} · FOR ${attributes.strength ?? 0}`;

        info.append(name, characterClass, stats);

        const action = document.createElement("button");
        action.type = "button";
        action.className = "roster-action";
        action.textContent = isSelected ? "Selecionado" : "Adicionar";
        action.disabled = !isSelected && teamIsFull;

        action.addEventListener("click", () => {
            if (isSelected) {
                removeCharacter(character.id);
            } else {
                addCharacter(character.id);
            }
        });

        card.append(info, action);
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
            "Esta ficha não foi encontrada. Atualize a lista.";
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

    // Confere novamente se todas as fichas continuam existindo.
    const savedCharacters = getSavedCharacters();

    const validTeam = selectedCharacters.filter(id =>
        savedCharacters.some(character => character.id === id)
    );

    if (validTeam.length !== selectedCharacters.length) {
        feedbackElement.textContent =
            "Uma das fichas não está mais disponível. Revise a equipe.";
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

    // A fase só é aberta após a confirmação.
    window.location.href = `level.html?level=${selectedLevel}`;
});

renderAll();
