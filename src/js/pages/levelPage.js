
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

function resolveImagePath(path, fallback) {
    if (!path) return fallback;

    let normalizedPath = path.replace(/\\/g, "/");

    if (normalizedPath.startsWith("assets/images/")) {
        normalizedPath = `src/${normalizedPath}`;
    } else if (normalizedPath.startsWith("images/")) {
        normalizedPath = `src/assets/${normalizedPath}`;
    }

    return normalizedPath;
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
            icon: "estocada-corrompida.png",
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
        targetFeedback: document.getElementById("action-status"),
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


    const enemyElements = {
        area: document.getElementById("enemy-area"),
        image: document.getElementById("enemy-image"),
        name: document.getElementById("enemy-name"),
        healthBar: document.getElementById("enemy-health-bar"),
        healthText: document.getElementById("enemy-health-text")
    };

    const enemies = [
        {
            name: "Inimigo de treinamento I",
            maxHealth: 100,
            health: 100,
            damage: 12,
            image: "src/assets/images/enemies/training-enemy.png"
        },
        {
            name: "Inimigo de treinamento II",
            maxHealth: 130,
            health: 130,
            damage: 16,
            image: "src/assets/images/enemies/training-enemy.png"
        },
        {
            name: "Inimigo de treinamento III",
            maxHealth: 160,
            health: 160,
            damage: 20,
            image: "src/assets/images/enemies/training-enemy.png"
        }
    ];

    let activeEnemyIndex = 0;
    let battleFinished = false;
    let actionInProgress = false;


    function getActiveEnemy() {
        return enemies[activeEnemyIndex];
    }

    function renderEnemy() {
        const enemy = getActiveEnemy();

        if (!enemy) {
            enemyElements.area.hidden = true;
            return;
        }

        enemyElements.area.hidden = false;
        enemyElements.name.textContent = enemy.name;
        enemyElements.image.src = enemy.image;
        enemyElements.image.alt = enemy.name;

        enemyElements.healthBar.style.width =
            `${Math.max(0, enemy.health / enemy.maxHealth * 100)}%`;

        enemyElements.healthText.textContent =
            `${Math.max(0, enemy.health)} / ${enemy.maxHealth} PV`;
    }

    function defeatCurrentEnemy() {
        const defeatedEnemy = getActiveEnemy();

        logMessage(`${defeatedEnemy.name} foi derrotado!`);

        activeEnemyIndex++;

        if (activeEnemyIndex >= enemies.length) {
            battleFinished = true;
            enemyElements.area.hidden = true;

            elements.actionStatus.textContent =
                "Vitória! Todos os inimigos foram derrotados.";

            logMessage("O Despertar concluído: todos os inimigos foram derrotados.");

            for (const button of Object.values(actionButtons)) {
                button.disabled = true;
            }

            elements.confirm.disabled = true;
            return;
        }

        renderEnemy();

        logMessage(`${getActiveEnemy().name} entrou em combate!`);
    }

    function enemyTurn() {
        if (battleFinished) return;

        const character = getActiveCharacter();
        const enemy = getActiveEnemy();

        if (!character || !enemy) return;

        const damage = character.defending
            ? Math.max(1, Math.floor(enemy.damage * 0.5))
            : enemy.damage;

        character.defending = false;
        character.health = Math.max(0, character.health - damage);

        showDamage(damage);
        logMessage(`${enemy.name} causou ${damage} de dano a ${character.name}.`);

        if (character.health <= 0) {
            const nextAliveIndex = party.findIndex(member => member.health > 0);

            if (nextAliveIndex === -1) {
                battleFinished = true;
                elements.actionStatus.textContent =
                    "Derrota: todos os personagens foram derrotados.";
                logMessage("Toda a equipe foi derrotada.");

                for (const button of Object.values(actionButtons)) {
                    button.disabled = true;
                }

                elements.confirm.disabled = true;
                renderAll();
                return;
            }

            activeIndex = nextAliveIndex;

            logMessage(
                `${character.name} foi derrotado. ${getActiveCharacter().name} assume a linha de frente.`
            );
        }

        renderAll();
    }


    let activeIndex = 0;
    let turn = 1;
    let selectedAction = null;
    let selectedSkill = null;
    let announcementTimer = null;

    elements.levelName.textContent = missions[levelNumber];

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
            image.src = resolveImagePath(
                character.appearance,
                "src/assets/images/characters/personagem-01.png"
            );

            image.alt = `Retrato de ${character.name}`;

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
            image.src = `src/assets/images/icons/skills/${skill.icon}`;
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


    async function executeAction() {
        if (!selectedAction || actionInProgress || battleFinished) return;

        const character = getActiveCharacter();
        const action = selectedAction;
        const skillId = selectedSkill;
        const enemyIndexAtStart = activeEnemyIndex;

        if (!character || character.health <= 0) {
            elements.actionStatus.textContent =
                "Este personagem não pode agir.";
            return;
        }

        const skill = action === "skill"
            ? skillDefinitions[skillId]
            : null;

        // Validar habilidades e energia antes de consumir o turno.
        if (action === "skill") {
            if (!skill) {
                elements.actionStatus.textContent =
                    "Habilidade inválida.";
                return;
            }

            if (character.energy < skill.cost) {
                elements.actionStatus.textContent =
                    "Energia insuficiente para essa habilidade.";
                return;
            }

            if (
                skillId === "bencao-abissal" &&
                character.characterClass !== "Anômalo"
            ) {
                elements.actionStatus.textContent =
                    "Benção Abissal só pode ser usada por um Anômalo.";
                return;
            }
        }

        if (
            action === "attack" &&
            character.characterClass === "Anômalo"
        ) {
            elements.actionStatus.textContent =
                "Anômalos precisam utilizar habilidades especiais.";
            return;
        }

        actionInProgress = true;

        for (const button of Object.values(actionButtons)) {
            button.disabled = true;
        }

        elements.confirm.disabled = true;

        try {
            const enemy = getActiveEnemy();

            if (!enemy) return;

            // ATAQUE FÍSICO
            if (action === "attack") {
                const model = new Character(
                    character.name,
                    character.characterClass,
                    character.attributes,
                    character.id,
                    character.appearance,
                    character.skills ?? []
                );

                const damage = model.getPhysicalDamage();

                enemy.health = Math.max(0, enemy.health - damage);

                showDamage(damage);

                elements.targetFeedback.textContent =
                    `${damage} de dano causado a ${enemy.name}.`;

                logMessage(
                    `${character.name} causou ${damage} de dano a ${enemy.name}.`
                );

                if (enemy.health <= 0) {
                    defeatCurrentEnemy();
                }
            }

            // DEFESA
            else if (action === "defend") {
                character.defending = true;

                elements.targetFeedback.textContent =
                    `${character.name} preparou a defesa.`;

                logMessage(
                    `${character.name} assumiu uma postura defensiva.`
                );
            }

            // HABILIDADES
            else if (action === "skill") {
                character.energy -= skill.cost;

                if (skillId === "percepcao") {
                    const currentEnemy = getActiveEnemy();

                    elements.targetFeedback.textContent =
                        currentEnemy
                            ? `Próximo ataque previsto: ${currentEnemy.damage} de dano.`
                            : "Não há inimigos restantes.";

                    logMessage(
                        `${character.name} usou Percepção e previu o próximo ataque.`
                    );
                }

                else if (skillId === "estocada-corrompida") {
                    const currentEnemy = getActiveEnemy();

                    if (currentEnemy) {
                        const damage = 20;

                        currentEnemy.health = Math.max(
                            0,
                            currentEnemy.health - damage
                        );

                        // Confusão: efeito de teste por um turno.
                        currentEnemy.confused = true;

                        showDamage(damage);

                        elements.targetFeedback.textContent =
                            `${damage} de dano e Confusão aplicada.`;

                        logMessage(
                            `${character.name} usou Estocada Corrompida: ${damage} de dano e Confusão.`
                        );

                        if (currentEnemy.health <= 0) {
                            defeatCurrentEnemy();
                        }
                    }
                }

                else if (skillId === "condenacao") {
                    const currentEnemy = getActiveEnemy();

                    if (currentEnemy) {
                        currentEnemy.guilt = true;
                        currentEnemy.damageReduction = 0.25;

                        elements.targetFeedback.textContent =
                            "Culpa aplicada: 5 de dano por turno.";

                        logMessage(
                            `${currentEnemy.name} recebeu Culpa: sofrerá 5 de dano por turno e terá seu dano reduzido em 25%.`
                        );
                    }
                }

                else if (skillId === "bencao-abissal") {
                    let totalHealing = 0;

                    for (const member of party) {
                        if (member.health <= 0) continue;

                        const model = new Character(
                            member.name,
                            member.characterClass,
                            member.attributes,
                            member.id,
                            member.appearance,
                            member.skills ?? []
                        );

                        const oldHealth = member.health;

                        member.health = Math.min(
                            model.getMaxHealth(),
                            member.health + 15
                        );

                        totalHealing += member.health - oldHealth;
                    }

                    elements.targetFeedback.textContent =
                        "A equipe recuperou PV.";

                    logMessage(
                        `${character.name} usou Benção Abissal. A equipe recuperou ${totalHealing} PV no total.`
                    );

                    logMessage(
                        "O bônus de dano crítico de 15% ainda precisa ser implementado."
                    );
                }

                renderSkills();
            }

            renderEnemy();
            renderAll();

            // Dano contínuo de Culpa.
            if (!battleFinished) {
                const currentEnemy = getActiveEnemy();

                if (currentEnemy?.guilt) {
                    currentEnemy.health = Math.max(
                        0,
                        currentEnemy.health - 5
                    );

                    logMessage(
                        `${currentEnemy.name} sofreu 5 de dano por Culpa.`
                    );

                    renderEnemy();

                    if (currentEnemy.health <= 0) {
                        defeatCurrentEnemy();
                    }
                }
            }

            // Aguarda antes do contra-ataque.
            await new Promise(resolve => setTimeout(resolve, 700));

            // O novo inimigo não ataca no mesmo turno em que apareceu.
            if (
                !battleFinished &&
                activeEnemyIndex === enemyIndexAtStart
            ) {
                enemyTurn();
            }

            turn++;

            clearActionSelection();
            renderAll();
            renderSkills();
            renderEnemy();

            if (!battleFinished) {
                showAnnouncement();
            }
        } finally {
            actionInProgress = false;

            if (!battleFinished) {
                for (const button of Object.values(actionButtons)) {
                    button.disabled = false;
                }

                elements.confirm.disabled = true;
            }
        }
    }

    // Eventos dos botões de ação
    actionButtons.attack.addEventListener("click", () => {
        selectAction("attack");
    });

    actionButtons.skill.addEventListener("click", () => {
        if (elements.skillPanel.hidden) {
            renderSkills();
            elements.skillPanel.hidden = false;
        } else {
            elements.skillPanel.hidden = true;
        }
    });

    actionButtons.defend.addEventListener("click", () => {
        selectAction("defend");
    });

    // Fechar o painel de habilidades, caso exista esse botão no HTML
    const closeSkillButton = document.getElementById("close-skill-panel");

    if (closeSkillButton) {
        closeSkillButton.addEventListener("click", () => {
            elements.skillPanel.hidden = true;
        });
    }

    // Confirmar ação selecionada
    elements.confirm.addEventListener("click", executeAction);

    // Inicializar a interface e o combate
    clearActionSelection();
    renderAll();
    renderSkills();
    renderEnemy();

    showAnnouncement();

    logMessage(`Operação ${missions[levelNumber]} iniciada.`);
    logMessage(`${getActiveEnemy().name} entrou em combate!`);
}