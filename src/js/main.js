const createCharacterButton = document.getElementById(
    "create-character-button"
);

const startCampaignButton = document.getElementById(
    "start-campaign-button"
);

createCharacterButton.addEventListener("click", () => {
    window.location.href = "characters.html";
});

startCampaignButton.addEventListener("click", () => {
    window.location.href = "campaign.html";
});