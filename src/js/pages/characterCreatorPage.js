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

        document.getElementById("creator-heading").textContent =
            "Editar personagem";

        saveButton.textContent = "Salvar alterações";
    }
}

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
        editingId
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

// Inicialização da tela.
renderAttributeControls();
updateClassInformation();
updatePreview();