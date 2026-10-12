
const params = new URLSearchParams(window.location.search);
const levelNumber = Number(params.get("level"));

const missions = {
    1: "O Despertar",
    2: "Zona Morta",
    3: "Falha Terminal"
};

const pendingMission = JSON.parse(
    localStorage.getItem("faultline_pending_mission") || "null"
);

const validMission =
    missions[levelNumber] &&
    pendingMission &&
    pendingMission.level === levelNumber &&
    Array.isArray(pendingMission.teamIds) &&
    pendingMission.teamIds.length >= 1 &&
    pendingMission.teamIds.length <= 3;

if (!validMission) {
    window.location.replace("campaign.html");
} else {
    initializeBattle();
}

function initializeBattle() {
    const allCharacters = CharacterManager.getAll() ?? [];

    const party = pendingMission.teamIds
        .map(id => allCharacters.find(character => character.id === id))
        .filter(Boolean)
        .map(data => ({
            ...data,
            health: new Character(
                data.name,
                data.characterClass,
                data.attributes,
                data.id,
                data.appearance,
                data.skills ?? []
            ).getMaxHealth(),
            energy: Number(data.energy ?? 100),
            defending: false
        }));

    if (party.length !== pendingMission.teamIds.length || party.length === 0) {
        window.location.replace(`team-selection.html?level=${levelNumber}`);
        return;
    }

    const skillDefinitions = {
        percepcao: {
            name: "Percepção",
            icon: "percepcao.png",
            description: "Visualiza o próximo ataque do inimigo.",
            cost: 15
        },
        "estocada-corrompida": {
            name: "Estocada Corrompida",
            icon: "estocada-corrimpida.png",
            description: "Ataque corrompido que causa Confusão por 1 turno.",
            cost: 25
        },
        condenacao: {
            name: "Condenação",
            icon: "condenacao.png",
            description: "Aplica Culpa: 5 de dano por turno e reduz o dano inimigo em 25%.",
            cost: 45
        },
        "bencao-abissal": {
            name: "Benção Abissal",
            icon: "bencao-abissal.png",
            description: "Recupera 15 PV de toda a equipe e aumenta o dano crítico em 15%.",
            cost: 50
        }
    };

    const elements = {
        levelName: document.getElementById("battle-level-name"),
        turnCounter: document.getElementById("turn-counter"),
        announcement: document.getElementById("turn-announcement"),
        announcementText: document.getElementById("turn-announcement-text"),
        party: document.getElementById("battle-party"),
        characterName: document.getElementById("battle-character-name"),
        characterClass: document.getElementById("battle-character-class"),
        characterInitial: document.getElementById("battle-character-initial"),
        healthBar: document.getElementById("health-bar"),
        healthText: document.getElementById("health-text"),
        energyBar: document.getElementById("energy-bar"),
        energyText: document.getElementById("energy-text"),
        targetFeedback: document.getElementById("target-feedback"),
        damageNumber: document.getElementById("damage-number"),
        skillPanel: document.getElementById("skill-panel"),
        skills: document.getElementById("battle-skills"),
        actionStatus: document.getElementById("action-status"),
        confirm: document.getElementById("confirm-action-button"),
        log: document.getElementById("battle-log-content")
    };

    const actionButtons = {
        attack: document.getElementById("attack-button"),
        skill: document.getElementById("skill-button"),
        defend: document.getElementById("defend-button")
    };

    let activeIndex = 0;
    let turn = 1;
    let selectedAction = null;
    let selectedSkill = null;
    let announcementTimer = null;

    elements.levelName.textContent = elements.levelName.textContent =
        missions[levelNumber];

    function getActiveCharacter() {
        return party[activeIndex];
    }

    function logMessage(message) {
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        elements.log.prepend(paragraph);

        while (elements.log.children.length > 6) {
            elements.log.lastElementChild.remove();
        }
    }

    function showAnnouncement() {
        elements.turnCounter.textContent = String(turn).padStart(2, "0");
        elements.announcementText.textContent =
            `TURNO ${String(turn).padStart(2, "0")}`;

        elements.announcement.classList.remove("show");
        void elements.announcement.offsetWidth;
        elements.announcement.classList.add("show");

        clearTimeout(announcementTimer);
        announcementTimer = setTimeout(() => {
            elements.announcement.classList.remove("show");
        }, 1800);
    }

    function clearActionSelection() {
        selectedAction = null;
        selectedSkill = null;

        for (const button of Object.values(actionButtons)) {
            button.classList.remove("selected");
        }

        elements.confirm.disabled = true;
        elements.actionStatus.textContent = "Selecione uma ação.";
        elements.skillPanel.hidden = true;
    }

    function selectAction(action) {
        selectedAction = action;
        selectedSkill = null;

        for (const [key, button] of Object.entries(actionButtons)) {
            button.classList.toggle("selected", key === action);
        }

        elements.confirm.disabled = false;
        elements.skillPanel.hidden = true;

        const labels = {
            attack: "Ataque selecionado.",
            defend: "Defesa selecionada."
        };

        elements.actionStatus.textContent = labels[action] ?? "Ação selecionada.";
    }

    function renderParty() {
        elements.party.replaceChildren();

        party.forEach((character, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className =
                `party-member${index === activeIndex ? " active" : ""}`;

            const image = document.createElement("img");
            image.src = character.appearance ||
                "../../src/assets/images/characters/personagem-01.png";
            image.alt = "";

            image.addEventListener("error", () => {
                image.onerror = null;
                image.style.display = "none";
            });

            const name = document.createElement("span");
            name.textContent = character.name;

            button.append(image, name);
            button.addEventListener("click", () => {
                activeIndex = index;
                clearActionSelection();
                renderAll();
                logMessage(`${character.name} está ativo.`);
            });

            elements.party.append(button);
        });
    }

    function renderCharacterStatus() {
        const character = getActiveCharacter();
        const model = new Character(
            character.name,
            character.characterClass,
            character.attributes,
            character.id,
            character.appearance,
            character.skills ?? []
        );

        const maxHealth = model.getMaxHealth();
        const health = Math.min(character.health, maxHealth);

        elements.characterName.textContent = character.name;
        elements.characterClass.textContent = character.characterClass;
        elements.characterInitial.textContent =
            character.name.trim().charAt(0).toUpperCase() || "?";

        elements.healthBar.style.width =
            `${Math.max(0, health / maxHealth * 100)}%`;

        elements.healthText.textContent =
            `PV ${health} / ${maxHealth}`;

        elements.energyBar.style.width =
            `${Math.max(0, character.energy)}%`;

        elements.energyText.textContent =
            `Energia ${character.energy} / 100`;
    }

    function renderSkills() {
        elements.skills.replaceChildren();

        const character = getActiveCharacter();
        const equippedSkills = Array.isArray(character.skills)
            ? character.skills
            : [];

        if (equippedSkills.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "Este personagem não possui habilidades equipadas.";
            elements.skills.append(empty);
            return;
        }

        for (const skillId of equippedSkills) {
            const skill = skillDefinitions[skillId];

            if (!skill) continue;

            if (
                skillId === "bencao-abissal" &&
                character.characterClass !== "Anômalo"
            ) {
                continue;
            }

            const card = document.createElement("article");
            card.className = "battle-skill";

            const image = document.createElement("img");
            image.src = `images/ícons/skills/${skill.icon}`;
            image.alt = "";

            image.addEventListener("error", () => {
                image.onerror = null;
                image.style.visibility = "hidden";
            });

            const info = document.createElement("div");
            info.className = "battle-skill-info";

            const name = document.createElement("strong");
            name.textContent = skill.name;

            const description = document.createElement("p");
            description.textContent = skill.description;

            const cost = document.createElement("span");
            cost.textContent = `Energia: ${skill.cost}`;

            info.append(name, description, cost);

            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "Selecionar";
            button.disabled = character.energy < skill.cost;

            button.addEventListener("click", () => {
                selectedAction = "skill";
                selectedSkill = skillId;

                for (const actionButton of Object.values(actionButtons)) {
                    actionButton.classList.toggle(
                        "selected",
                        actionButton === actionButtons.skill
                    );
                }

                elements.confirm.disabled = false;
                elements.actionStatus.textContent =
                    `Habilidade: ${skill.name}`;

                elements.skillPanel.hidden = true;
            });

            card.append(image, info, button);
            elements.skills.append(card);
        }

        if (!elements.skills.children.length) {
            const empty = document.createElement("p");
            empty.textContent = "Nenhuma habilidade disponível para esta classe.";
            elements.skills.append(empty);
        }
    }

    function renderAll() {
        renderParty();
        renderCharacterStatus();
    }

    function showDamage(amount) {
        elements.damageNumber.textContent = `-${amount}`;
        elements.damageNumber.classList.remove("show");
        void elements.damageNumber.offsetWidth;
        elements.damageNumber.classList.add("show");
    }

    function executeAction() {
        if (!selectedAction) return;

        const character = getActiveCharacter();

        if (selectedAction === "attack") {
            const model = new Character(
                character.name,
                character.characterClass,
                character.attributes,
                character.id,
                character.appearance,
                character.skills ?? []
            );

            const damage = model.getPhysicalDamage();

            showDamage(damage);
            elements.targetFeedback.textContent =
                `Impacto de teste: ${damage} de dano`;

            logMessage(
                `${character.name} executou um ataque de teste (${damage} de dano).`
            );
        }

        if (selectedAction === "defend") {
            character.defending = true;

            logMessage(
                `${character.name} assumiu postura defensiva. A redução de dano será usada quando houver inimigos.`
            );
        }

        if (selectedAction === "skill") {
            const skill = skillDefinitions[selectedSkill];

            if (!skill || character.energy < skill.cost) {
                elements.actionStatus.textContent =
                    "Energia insuficiente para essa habilidade.";
                return;
            }

            if (
                selectedSkill === "bencao-abissal" &&
                character.characterClass !== "Anômalo"
            ) {
                return;
            }

            character.energy -= skill.cost;

            if (selectedSkill === "bencao-abissal") {
                for (const member of party) {
                    const model = new Character(
                        member.name,
                        member.characterClass,
                        member.attributes,
                        member.id,
                        member.appearance,
                        member.skills ?? []
                    );

                    member.health = Math.min(
                        model.getMaxHealth(),
                        member.health + 15
                    );
                }

                logMessage(
                    `${character.name} usou Benção Abissal: a equipe recuperou até 15 PV e recebeu o bônus crítico de teste.`
                );
            } else {
                logMessage(
                    `${character.name} usou ${skill.name}. Efeito registrado para o protótipo.`
                );
            }

            elements.targetFeedback.textContent = skill.name;
        }

        turn++;
        clearActionSelection();
        renderAll();
        renderSkills();
        showAnnouncement();
    }

    actionButtons.attack.addEventListener("click", () => {
        selectAction("attack");
    });

    actionButtons.defend.addEventListener("click", () => {
        selectAction("defend");
    });

    actionButtons.skill.addEventListener("click", () => {
        elements.skillPanel.hidden = !elements.skillPanel.hidden;

        if (!elements.skillPanel.hidden) {
            renderSkills();
            elements.actionStatus.textContent =
                "Escolha uma habilidade e confirme.";
        }
    });

    document.getElementById("close-skill-panel").addEventListener("click", () => {
        elements.skillPanel.hidden = true;
    });

    elements.confirm.addEventListener("click", executeAction);

    renderAll();
    renderSkills();
    showAnnouncement();
    logMessage(`Operação ${missions[levelNumber]} iniciada.`);
}
