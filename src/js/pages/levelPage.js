
const params = new URLSearchParams(window.location.search);
const levelNumber = Number(params.get("level"));

const pendingMission = JSON.parse(
    localStorage.getItem("faultline_pending_mission") || "null"
);

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

const missionIsValid =
    pendingMission &&
    pendingMission.level === levelNumber &&
    Array.isArray(pendingMission.teamIds) &&
    pendingMission.teamIds.length >= 1 &&
    pendingMission.teamIds.length <= 3;

if (!missionIsValid || !missions[levelNumber]) {
    window.location.replace("campaign.html");
} else {
    const mission = missions[levelNumber];

    document.getElementById("level-title").textContent =
        mission.title;

    document.getElementById("level-description").textContent =
        mission.description;

    const confirmedTeam = document.getElementById("confirmed-team");
    const savedCharacters = CharacterManager.getAll() ?? [];

    const team = pendingMission.teamIds
        .map(id => savedCharacters.find(character => character.id === id))
        .filter(Boolean);

    if (team.length !== pendingMission.teamIds.length) {
        localStorage.removeItem("faultline_pending_mission");
        window.location.replace(
            `team-selection.html?level=${levelNumber}`
        );
    } else {
        for (const character of team) {
            const card = document.createElement("article");
            card.className = "confirmed-member";

            const name = document.createElement("h3");
            name.textContent = character.name;

            const characterClass = document.createElement("p");
            characterClass.textContent = character.characterClass;

            card.append(name, characterClass);
            confirmedTeam.append(card);
        }
    }
}
