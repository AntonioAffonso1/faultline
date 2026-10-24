// ========================================
// FAULTLINE — CRIADOR DE PERSONAGENS
// ========================================


const form = document.getElementById("character-form");
const nameInput = document.getElementById("character-name");
const classInput = document.getElementById("character-class");
const attributeControls = document.getElementById("attribute-controls");
const pointsRemaining = document.getElementById("points-remaining");
const pointsProgress = document.getElementById("points-progress");
const feedback = document.getElementById("form-feedback");
const saveButton = document.getElementById("save-character-button");
const appearancePreview = document.getElementById("appearance-preview");
const appearanceSelectedLabel = document.getElementById(
    "appearance-selected-label"
);
const appearanceUpload = document.getElementById("appearance-upload");

const defaultAppearance =
    "src/assets/images/characters/personagem-01.png";

let selectedAppearance = defaultAppearance;

const availableAppearances = [
    {
        id: "personagem-01",
        name: "Personagem 01",
        src: "src/assets/images/characters/personagem-01.png"
    }
];



const TOTAL_POINTS = 20;
const BASE_ATTRIBUTE = 5;
const MAX_ATTRIBUTE = 20;

const attributeDefinitions = [
    { key: "vitality", label: "Vitalidade" },
    { key: "strength", label: "Força" },
    { key: "power", label: "Poder" },
    { key: "resistance", label: "Resistência" }
];

const classDefinitions = {
    Combatente: {
        description:
            "Especialista em confrontos físicos, capaz de combinar ataques com habilidades ofensivas que consomem energia.",
        passiveName: "Força aprimorada",
        passiveDescription: "+2 de Força efetiva.",
        actions: "Ataque físico, habilidades especiais e Defender."
    },

    Defensor: {
        description:
            "Especialista em resistência e proteção, preparado para suportar ataques e manter a equipe de pé.",
        passiveName: "Resistência aprimorada",
        passiveDescription: "+3 de Resistência efetiva.",
        actions: "Ataque físico e Defender."
    },

    Anômalo: {
        description:
            "Utiliza habilidades anômalas para causar dano, curar aliados e fortalecer a equipe.",
        passiveName: "Poder aprimorado",
        passiveDescription: "+3 de Poder efetivo.",
        actions: "Habilidades especiais e Defender."
    }
};

// Estado inicial da ficha
let attributes = {
    vitality: BASE_ATTRIBUTE,
    strength: BASE_ATTRIBUTE,
    power: BASE_ATTRIBUTE,
    resistance: BASE_ATTRIBUTE
};

let editingId = null;

const skillDefinitions = [
    {
        id: "percepcao",
        name: "Percepção",
        icon: "percepcao.png",
        description: "Visualiza o próximo ataque do inimigo.",
        cost: 15,
        restriction: null
    },
    {
        id: "estocada-corrompida",
        name: "Estocada Corrompida",
        icon: "estocada-corrompida.png",
        description:
            "Ataque imbuído com corrupção que causa Confusão, impedindo o inimigo de agir por 1 turno.",
        cost: 25,
        restriction: null
    },
    {
        id: "condenacao",
        name: "Condenação",
        icon: "condenacao.png",
        description:
            "Aplica Culpa: causa 5 de dano por turno e reduz o dano do inimigo em 25%.",
        cost: 45,
        restriction: null
    },
    {
        id: "bencao-abissal",
        name: "Benção Abissal",
        icon: "bencao-abissal.png",
        description:
            "Recupera 15 PV de toda a equipe e aumenta o dano crítico em 15%.",
        cost: 50,
        restriction: "Anômalo"
    }
];

let selectedSkills = [];

// Verifica se a URL possui um ID para edição.
const params = new URLSearchParams(window.location.search);
const requestedId = params.get("id");

if (requestedId) {
    const existingCharacter = CharacterManager.getById(requestedId);

    if (existingCharacter) {
        editingId = existingCharacter.id;

        nameInput.value = existingCharacter.name;
        classInput.value = existingCharacter.characterClass;
        attributes = { ...existingCharacter.attributes };

        selectedSkills = (existingCharacter.skills ?? [])
            .filter(skillId => {
                const skill = skillDefinitions.find(
                    item => item.id === skillId
                );

                return skill &&
                    (!skill.restriction ||
                        skill.restriction === existingCharacter.characterClass);
            })
            .slice(0, 3);

        selectedAppearance =
            existingCharacter.appearance || defaultAppearance;

        document.getElementById("creator-heading").textContent =
            "Editar personagem";

        saveButton.textContent = "Salvar alterações";
    }
}


// Atualiza a prévia do retrato.
function updateAppearancePreview() {
    appearancePreview.src = selectedAppearance;
    appearancePreview.alt = "Prévia do retrato do personagem";

    appearanceSelectedLabel.textContent =
        selectedAppearance === defaultAppearance
            ? "Retrato padrão selecionado"
            : "Imagem personalizada selecionada";
}

// Permite ao jogador carregar uma imagem do computador.
appearanceUpload.addEventListener("change", () => {
    const file = appearanceUpload.files[0];

    if (!file) return;

    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif"
    ];

    // Valida o formato do arquivo.
    if (!allowedTypes.includes(file.type)) {
        feedback.textContent =
            "Formato inválido. Escolha PNG, JPG, WEBP ou GIF.";

        appearanceUpload.value = "";
        return;
    }

    // Limita o arquivo a 2 MB para reduzir o uso do localStorage.
    if (file.size > 2 * 1024 * 1024) {
        feedback.textContent =
            "A imagem deve ter no máximo 2 MB.";

        appearanceUpload.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        if (typeof reader.result !== "string") {
            feedback.textContent =
                "Não foi possível carregar essa imagem.";
            return;
        }

        selectedAppearance = reader.result;
        updateAppearancePreview();
        feedback.textContent = "";
    };

    reader.onerror = () => {
        feedback.textContent =
            "Ocorreu um erro ao ler a imagem selecionada.";
    };

    reader.readAsDataURL(file);
});



// Cria os controles de atributo usando os dados da configuração.
function renderAttributeControls() {
    attributeControls.replaceChildren();

    for (const attribute of attributeDefinitions) {
        const row = document.createElement("div");
        row.className = "attribute-row";

        const info = document.createElement("div");
        info.className = "attribute-info";

        const label = document.createElement("span");
        label.className = "attribute-name";
        label.textContent = attribute.label;

        const base = document.createElement("span");
        base.className = "attribute-base";
        base.textContent = `Base: ${BASE_ATTRIBUTE}`;

        info.append(label, base);

        const controls = document.createElement("div");
        controls.className = "attribute-controls";

        const decreaseButton = document.createElement("button");
        decreaseButton.type = "button";
        decreaseButton.className = "attribute-button";
        decreaseButton.textContent = "−";
        decreaseButton.setAttribute(
            "aria-label",
            `Diminuir ${attribute.label}`
        );
        decreaseButton.dataset.attribute = attribute.key;
        decreaseButton.dataset.change = "-1";

        const value = document.createElement("strong");
        value.className = "attribute-value";
        value.id = `attribute-${attribute.key}`;

        const increaseButton = document.createElement("button");
        increaseButton.type = "button";
        increaseButton.className = "attribute-button";
        increaseButton.textContent = "+";
        increaseButton.setAttribute(
            "aria-label",
            `Aumentar ${attribute.label}`
        );
        increaseButton.dataset.attribute = attribute.key;
        increaseButton.dataset.change = "1";

        controls.append(decreaseButton, value, increaseButton);
        row.append(info, controls);
        attributeControls.append(row);
    }
}

// Retorna os bônus da classe selecionada.
function getClassPassive() {
    switch (classInput.value) {
        case "Combatente":
            return { strength: 2 };

        case "Defensor":
            return { resistance: 3 };

        case "Anômalo":
            return { power: 3 };

        default:
            return {};
    }
}

// Calcula os atributos efetivos, incluindo a passiva.
function getEffectiveAttributes() {
    const passive = getClassPassive();

    return {
        vitality: attributes.vitality,
        strength: attributes.strength + (passive.strength ?? 0),
        power: attributes.power + (passive.power ?? 0),
        resistance: attributes.resistance + (passive.resistance ?? 0)
    };
}

// Conta quantos dos 20 pontos foram distribuídos.
function getPointsUsed() {
    return attributeDefinitions.reduce((total, attribute) => {
        return total + attributes[attribute.key] - BASE_ATTRIBUTE;
    }, 0);
}

// Atualiza a descrição e a passiva da classe.
function updateClassInformation() {
    const selectedClass = classInput.value;
    const definition = classDefinitions[selectedClass];

    document.getElementById("class-name").textContent = selectedClass;
    document.getElementById("class-description").textContent =
        definition.description;

    document.getElementById("passive-name").textContent =
        definition.passiveName;

    document.getElementById("passive-description").textContent =
        definition.passiveDescription;

    document.getElementById("class-actions").textContent =
        definition.actions;
}

// Atualiza os atributos, os botões e todas as estatísticas.
function updatePreview() {
    const usedPoints = getPointsUsed();
    const remaining = TOTAL_POINTS - usedPoints;
    const effective = getEffectiveAttributes();

    pointsRemaining.textContent = remaining;
    pointsProgress.style.width =
        `${(usedPoints / TOTAL_POINTS) * 100}%`;

    for (const attribute of attributeDefinitions) {
        const key = attribute.key;
        const value = attributes[key];

        document.getElementById(`attribute-${key}`).textContent = value;

        const row = document.getElementById(`attribute-${key}`)
            .closest(".attribute-row");

        const decreaseButton = row.querySelector(
            '[data-change="-1"]'
        );

        const increaseButton = row.querySelector(
            '[data-change="1"]'
        );

        decreaseButton.disabled = value <= BASE_ATTRIBUTE;
        increaseButton.disabled =
            value >= MAX_ATTRIBUTE || remaining <= 0;
    }

    document.getElementById("preview-health").textContent =
        100 + effective.vitality * 10;

    document.getElementById("preview-energy").textContent = 100;

    document.getElementById("preview-strength").textContent =
        effective.strength;

    document.getElementById("preview-power").textContent =
        effective.power;

    document.getElementById("preview-resistance").textContent =
        effective.resistance;

    document.getElementById("preview-damage").textContent =
        10 + effective.strength * 2;

    document.getElementById("preview-special").textContent =
        12 + effective.power * 2;

    document.getElementById("preview-reduction").textContent =
        effective.resistance * 2;
}

// Trata os cliques nos botões de atributo.
attributeControls.addEventListener("click", event => {
    const button = event.target.closest("button[data-attribute]");

    if (!button) return;

    const key = button.dataset.attribute;
    const change = Number(button.dataset.change);

    const nextValue = attributes[key] + change;

    if (nextValue < BASE_ATTRIBUTE || nextValue > MAX_ATTRIBUTE) {
        return;
    }

    if (change > 0 && getPointsUsed() >= TOTAL_POINTS) {
        return;
    }

    attributes[key] = nextValue;

    feedback.textContent = "";
    updatePreview();
});

// Atualiza as passivas e os cálculos ao trocar de classe.
classInput.addEventListener("change", () => {
    updateClassInformation();
    updatePreview();
    feedback.textContent = "";
});

// Valida e salva a ficha.
form.addEventListener("submit", event => {
    event.preventDefault();

    const name = nameInput.value.trim();

    if (!name) {
        feedback.textContent = "Digite um nome para o personagem.";
        nameInput.focus();
        return;
    }

    if (getPointsUsed() !== TOTAL_POINTS) {
        feedback.textContent =
            `Distribua todos os pontos antes de confirmar. Restam ${TOTAL_POINTS - getPointsUsed()}.`;
        return;
    }

    const character = new Character(
        name,
        classInput.value,
        { ...attributes },
        editingId,
        selectedAppearance,
        [...selectedSkills]
    );

    try {
        CharacterManager.save(character);

        feedback.textContent = "Ficha salva. Retornando ao arquivo...";

        window.location.href = "characters.html";
    } catch (error) {
        console.error("Erro ao salvar ficha:", error);

        feedback.textContent =
            "Não foi possível salvar a ficha. Verifique o armazenamento do navegador.";
    }
});

const equippedSkillsElement = document.getElementById("equipped-skills");
const availableSkillsElement = document.getElementById("available-skills");
const skillsCounterElement = document.getElementById("skills-counter");

function getSelectedClass() {
    return document.getElementById("character-class")?.value
        ?? document.querySelector('[name="character-class"]:checked')?.value
        ?? "";
}

function renderSkills() {
    equippedSkillsElement.replaceChildren();
    availableSkillsElement.replaceChildren();

    for (let slot = 0; slot < 3; slot++) {
        const skillId = selectedSkills[slot];
        const skill = skillDefinitions.find(item => item.id === skillId);

        if (!skill) {
            const emptySlot = document.createElement("div");
            emptySlot.className = "empty-skill-slot";
            emptySlot.textContent = `Espaço ${slot + 1} — vazio`;
            equippedSkillsElement.append(emptySlot);
            continue;
        }

        const card = document.createElement("article");
        card.className = "equipped-skill";

        const image = document.createElement("img");
        image.className = "skill-icon";
        image.src = `src/assets/images/icons/skills/${skill.icon}`;
        image.alt = "";

        const info = document.createElement("div");
        info.className = "skill-card-info";

        const title = document.createElement("h4");
        title.textContent = skill.name;

        const description = document.createElement("p");
        description.textContent = skill.description;

        const cost = document.createElement("span");
        cost.className = "skill-cost";
        cost.textContent = `Custo: ${skill.cost} de energia`;

        info.append(title, description, cost);
        card.append(image, info);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "skill-remove";
        removeButton.textContent = "Remover";
        removeButton.setAttribute("aria-label", `Remover ${skill.name}`);

        removeButton.addEventListener("click", () => {
            selectedSkills = selectedSkills.filter(id => id !== skill.id);
            renderSkills();
        });

        card.append(removeButton);
        equippedSkillsElement.append(card);
    }

    for (const skill of skillDefinitions) {
        const isEquipped = selectedSkills.includes(skill.id);
        const isRestricted =
            skill.restriction !== null &&
            getSelectedClass() !== skill.restriction;

        const card = document.createElement("article");
        card.className = "available-skill";

        const image = document.createElement("img");
        image.className = "skill-icon";
        image.src = `src/assets/images/icons/skills/${skill.icon}`;
        image.alt = "";

        const info = document.createElement("div");
        info.className = "skill-card-info";

        const title = document.createElement("h4");
        title.textContent = skill.name;

        const description = document.createElement("p");
        description.textContent = skill.description;

        const cost = document.createElement("span");
        cost.className = "skill-cost";
        cost.textContent = `Custo: ${skill.cost} de energia`;

        info.append(title, description, cost);

        if (isRestricted) {
            const restriction = document.createElement("span");
            restriction.className = "skill-restriction";
            restriction.textContent = "Exclusiva da classe Anômalo";
            info.append(restriction);
        }

        const selectButton = document.createElement("button");
        selectButton.type = "button";
        selectButton.className = "skill-select";
        selectButton.textContent = isEquipped ? "Equipado" : "Equipar";
        selectButton.disabled =
            isEquipped || isRestricted || selectedSkills.length >= 3;

        selectButton.addEventListener("click", () => {
            if (
                selectedSkills.length >= 3 ||
                selectedSkills.includes(skill.id) ||
                (skill.restriction && getSelectedClass() !== skill.restriction)
            ) {
                return;
            }

            selectedSkills.push(skill.id);
            renderSkills();
        });

        card.append(image, info, selectButton);
        availableSkillsElement.append(card);
    }

    skillsCounterElement.textContent = `${selectedSkills.length} / 3`;
}

const classSelector =
    document.getElementById("character-class")
    ?? document.querySelector('[name="character-class"]');

classSelector?.addEventListener("change", () => {
    const selectedClass = getSelectedClass();

    selectedSkills = selectedSkills.filter(skillId => {
        const skill = skillDefinitions.find(item => item.id === skillId);
        return !skill?.restriction || skill.restriction === selectedClass;
    });

    renderSkills();
});



// Inicialização da tela.
renderAttributeControls();
updateClassInformation();
updatePreview();
updateAppearancePreview();
renderSkills();