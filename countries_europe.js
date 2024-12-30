document.addEventListener("DOMContentLoaded", function() {
    const countrySelectionDiv = document.getElementById("country-selection");
    const currentPlayerDiv = document.getElementById("current-player");
    const countryButtons = document.querySelectorAll(".country-btn");

    // Зареждане на запазените данни за играта
    const gameData = JSON.parse(localStorage.getItem("gameData"));
    const playerNames = gameData.playerNames || [];

    let currentPlayer = 1;
    const playersCountries = {
        1: [],
        2: []
    };
    const maxCountries = 8; // Maximum countries to be chosen
    const allCountries = Array.from(countryButtons).map(button => button.getAttribute("data-country"));

    function updateCurrentPlayer() {
        const playerName = playerNames[currentPlayer - 1] || `играч ${currentPlayer}`;
        currentPlayerDiv.textContent = `Ред на ${playerName} да избере държава`;
    }

    countryButtons.forEach(button => {
        button.addEventListener("click", () => {
            const country = button.getAttribute("data-country");
            playersCountries[currentPlayer].push(country);
            button.disabled = true;
            button.classList.add("selected");

            currentPlayer = currentPlayer === 1 ? 2 : 1;
            updateCurrentPlayer();

            // Check if 8 countries have been selected
            if (playersCountries[1].length + playersCountries[2].length === maxCountries) {
                // Determine the international country
                const selectedCountries = playersCountries[1].concat(playersCountries[2]);
                const internationalCountry = allCountries.find(c => !selectedCountries.includes(c));
                
                // Disable the international country button and mark it as international
                const internationalButton = document.querySelector(`.country-btn[data-country="${internationalCountry}"]`);
                internationalButton.disabled = true;
                internationalButton.classList.add("international");

                localStorage.setItem("playersCountries", JSON.stringify(playersCountries));
                alert("Всички държави са избрани!");

                // Navigate to the game page
                window.location.href = "game_europe_2.html";
            }
        });
    });

    // Показване на интерфейса за избор на държави
    countrySelectionDiv.classList.remove("hidden");
    updateCurrentPlayer();
});
