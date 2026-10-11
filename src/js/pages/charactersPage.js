const characterList = document.getElementById("character-list");
const characterCount = document.getElementById("character-count");
const searchInput = document.getElementById("character-search");

function createCharacterCard(data) {
    // Reconstrói o objeto para recuperar os métodos da classe Character.
    const character = new Character(
        data.name,
        data.characterClass,
        data.attributes,
        data.id
    );

    const stats = character.getEffectiveAttributes();

    const card = document.createElement("article");
    card.className = "character-card";

    const header = document.createElement("div");
    header.className = "character-card-header";

    const identity = document.createElement("div");

    const name = document.createElement("h3");
    name.className = "character-card-name";
    name.textContent = character.name;

    const className = document.createElement("p");
    className.className = "character-card-class";
    className.textContent = character.characterClass;

    identity.append(name, className);

    const health = document.createElement("span");
    health.className = "character-card-health";
    health.textContent = `${character.getMaxHealth()} PV`;

    header.append(identity, health);

    const attributes = document.createElement("div");
    attributes.className = "character-card-stats";

    const statItems = [
        ["Força", stats.strength],
        ["Poder", stats.power],
        ["Resistência", stats.resistance],
        ["Vitalidade", stats.vitality]
    ];

    for (const [label, value] of statItems) {
        const item = document.createElement("div");
        item.className = "character-stat";

        const statLabel = document.createElement("span");
        statLabel.textContent = label;

        const statValue = document.createElement("strong");
        statValue.textContent = value;

        item.append(statLabel, statValue);
        attributes.append(item);
    }

    const actions = document.createElement("div");
    actions.className = "character-card-actions";

    const editLink = document.createElement("a");
    editLink.className = "character-edit-button";
    editLink.href =
        `character-creator.html?id=${encodeURIComponent(character.id)}`;
    editLink.textContent = "Editar";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "character-delete-button";
    deleteButton.dataset.id = character.id;
    deleteButton.textContent = "Excluir";

    actions.append(editLink, deleteButton);
    card.append(header, attributes, actions);

    return card;
}

function renderCharacters() {
    const allCharacters = CharacterManager.getAll();
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredCharacters = allCharacters.filter(character => {
        return (
            character.name.toLowerCase().includes(searchTerm) ||
            character.characterClass.toLowerCase().includes(searchTerm)
        );
    });

    characterCount.textContent = allCharacters.length;

    // Limpa os cartões antigos antes de renderizar novamente.
    characterList.replaceChildren();

    if (filteredCharacters.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";

        const message = document.createElement("p");
        message.textContent = allCharacters.length === 0
            ? "Nenhum personagem registrado. Crie sua primeira ficha."
            : "Nenhum personagem corresponde à pesquisa.";

        emptyState.append(message);
        characterList.append(emptyState);
        return;
    }

    // Cria um cartão para cada personagem encontrado.
    for (const character of filteredCharacters) {
        characterList.append(createCharacterCard(character));
    }
}

// Pesquisa em tempo real.
searchInput.addEventListener("input", renderCharacters);

// Exclusão com confirmação.
characterList.addEventListener("click", event => {
    const deleteButton = event.target.closest(".character-delete-button");

    if (!deleteButton) {
        return;
    }

    const characterId = deleteButton.dataset.id;

    if (!window.confirm("Tem certeza de que deseja excluir este personagem?")) {
        return;
    }

    try {
        CharacterManager.delete(characterId);
        renderCharacters();
    } catch (error) {
        console.error("Erro ao excluir personagem:", error);
        window.alert("Não foi possível excluir o personagem.");
    }
});

// Exibe as fichas assim que a página é carregada.
renderCharacters();
