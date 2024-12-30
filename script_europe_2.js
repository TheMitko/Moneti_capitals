const playersCountries = JSON.parse(localStorage.getItem("playersCountries")) || { 1: [], 2: [] };
const gameData = JSON.parse(localStorage.getItem("gameData")) || { pawnsCount: 3, playerNames: [] };
const playerNames = gameData.playerNames;

// Променлива за следене на броя пулове на всеки играч
const maxPawnsPerPlayer = gameData.pawnsCount;
const playerPawnsCount = { 1: maxPawnsPerPlayer, 2: maxPawnsPerPlayer };

let selectedStartPoint = null;
let isMovingPhase = false; // Следене на фазата на преместване
let currentPlayer = 1; // Следене на текущия играч
let captureOptions = []; // Опции за кацане при улавяне
let X = false; // Променлива, указваща дали е необходимо прескачане
let Y = false; // Променлива, указваща дали е направен изборът за кацане
let isACapitalBeingAttacked = false;
let atacker = 0;
let defender = 0;
let defenderMoveMade = false;

const players = {
  1: { color: "blue", remainingPawnsToMove: gameData.pawnsCount, remainingPawns: gameData.pawnsCount, countries: playersCountries[1], capitalsNum: 4 },
  2: { color: "green", remainingPawnsToMove: gameData.pawnsCount, remainingPawns: gameData.pawnsCount, countries: playersCountries[2], capitalsNum: 4 }
};

// Прави връзките двупосочни
function makeConnectionsBidirectional(points) {
  const pointMap = {}; // Карта на точките по ID за лесно намиране
  points.forEach(point => pointMap[point.id] = point);
  points.forEach(point => {
    point.connections.forEach(connectionId => {
      const connectedPoint = pointMap[connectionId];
      // Ако свързаната точка няма тази точка в своите връзки, добавете я
      if (connectedPoint && !connectedPoint.connections.includes(point.id)) {
        connectedPoint.connections.push(point.id);
      }
    });
    // Определяне на оригиналния собственик на точката
    if (point.country) {
      if (players[1].countries.includes(point.country)) {
        point.OriginalOwner = 1; // Player 1 is the original owner
      } else if (players[2].countries.includes(point.country)) {
        point.OriginalOwner = 2; // Player 2 is the original owner
      } else {
        point.OriginalOwner = 0; // No original owner
      }
    }
  });
}
function logPointsData() {
  console.log("Points Data for Debugging:");
  pointsData.forEach(point => {
    console.log(point);
  });
}

function checkCapitalsOwnership(playerId) {
  const opponentId = playerId === 1 ? 2 : 1;
  const capitals = pointsData.filter(point => point.capital && point.OriginalOwner === playerId);

  for (const capital of capitals) {
    if (pawnsOnPoints[capital.id].owner === opponentId) {
      return { underAttack: true, capital: capital }; // Има противникови пулове на първоначално ваша столица
    }
  }
  return { underAttack: false, capital: null }; // Няма противникови пулове на първоначално ваша столица
}

function changeCountryOwnership(country, newOwner) {
  pointsData.forEach(point => {
    if (point.country === country) {
      const circle = document.getElementById(point.id);
      if (circle) {
        circle.setAttribute("fill", newOwner === 1 ? players[1].color : players[2].color);
      }
      point.OriginalOwner = newOwner; // Update the original owner for future reference
      if (pawnsOnPoints[point.id]) {
        pawnsOnPoints[point.id].owner = newOwner; // Update the owner in pawnsOnPoints as well
      }
    }
  });
}

function getPointCountry(pointId) {
  const point = pointsData.find(p => p.id === pointId);
  if (point) {
    return point.country;
  }
  return null; // В случай, че точката не съществува
}

function updatePlayerPawnsCount() {
  document.querySelector(".player1-pawns").textContent = playerPawnsCount[1];
  document.querySelector(".player2-pawns").textContent = playerPawnsCount[2];
}

// Обновяване на текста в таблото с имената на играчите
function updatePlayerInfoDisplay() {
  document.getElementById("player1-info").innerHTML = `${playerNames[0] || 'Играч 1'}: <span id="player1-pawns" class="player1-pawns">0</span> пулове`;
  document.getElementById("player2-info").innerHTML = `${playerNames[1] || 'Играч 2'}: <span id="player2-pawns" class="player2-pawns">0</span> пулове`;
}

updatePlayerInfoDisplay(); // Извикване на функцията за първоначално обновяване на дисплея

function getCurrentPlayerName() {
  return playerNames[currentPlayer - 1] || `играч ${currentPlayer}`;
}

// Стартиране на функцията за осигуряване на двупосочни връзки
makeConnectionsBidirectional(pointsData);

// Инициализиране на предупреждение за уведомяване на играчите за старта на разпределянето на пуловете
alert("Започва разполагането на пулове за двама играчи!");

// Създаване на карта за следене на пуловете на всяка точка
const pawnsOnPoints = {};
const pointNames = {}; // Създаване на обект за имена на точките
// Helper function to check country ownership
function checkCountryOwnership(point) {
  const country = point.country;
  if (country) {
    if (players[1].countries.includes(country)) {
      return 1; // Player 1 owns this country
    } else if (players[2].countries.includes(country)) {
      return 2; // Player 2 owns this country
    }
  }
  return null; // No player owns this point's country
}
// Обработчик на събития за избиране на точка
function selectPoint(pointId) {
  if (captureOptions.length > 0) {
    handleCaptureChoice(pointId);
    return;
  }

  console.log(`Точка избрана: ${pointId}`);
  if (!isMovingPhase) {
    placePawns(pointId);
  } else {
    if (!selectedStartPoint) {
      selectedStartPoint = pointId;
      alert(`Сега изберете дестинацията.`);
    } else {
      const destinationPoint = pointId;
      if (selectedStartPoint === destinationPoint) {
        alert("Избрахте една и съща точка. Изберете друга точка за дестинация");
        selectedStartPoint = null;
        return;
      }
      movePawns(selectedStartPoint, destinationPoint);
      selectedStartPoint = null;
    }
  }
}

// Функция за разпределяне на пуловете върху кликната точка
function placePawns(pointId) {
  const point = pointsData.find(p => p.id === pointId);
  if (!point) {
    alert("Невалидна точка.");
    return;
  }

  const pointColor = document.getElementById(pointId)?.getAttribute("fill"); // Вземане на цвета на точката
  let player = null;

  // Определяне на играча на базата на цвета
  if (pointColor === "blue") {
    player = players[1];
  } else if (pointColor === "green") {
    player = players[2];
  } else {
    alert("Тази точка не принадлежи на никого.");
    return;
  }

  const playerName = playerNames[player === players[1] ? 0 : 1] || `Играч ${player === players[1] ? 1 : 2}`;

  if (player.remainingPawns <= 0) {
    alert(`${playerName} няма оставащи пулове.`);
    return;
  }

  const maxPawnsToPlace = player.remainingPawns;
  const numPawns = parseInt(prompt(`Колко пулове искате да поставите? (Max: ${maxPawnsToPlace})`), 10);

  if (isNaN(numPawns) || numPawns <= 0 || numPawns > maxPawnsToPlace) {
    alert("Невалиден брой пулове. Опитайте отново.");
    return;
  }

  // Инициализиране на точката, ако за първи път се поставят пулове там
  if (!pawnsOnPoints[pointId]) {
    pawnsOnPoints[pointId] = { pawns: 0, owner: null };
  }

  pawnsOnPoints[pointId].pawns += numPawns;
  player.remainingPawns -= numPawns;
  updatePlayerPawnsCount();
  pawnsOnPoints[pointId].owner = player === players[1] ? 1 : 2;

  updatePointDisplay(pointId);

  // Проверка дали и двамата играчи са изчерпали пуловете си
  if (players[1].remainingPawns === 0 && players[2].remainingPawns === 0) {
    alert("Разполагането на пулове приключи! Вече можете да ги местите!");
    isMovingPhase = true;
  }
}
// Функция за преместване на пулове между точки
function movePawns(startPointId, destinationPointId) {
  const startPoint = pointsData.find(p => p.id === startPointId);
  const destinationPoint = pointsData.find(p => p.id === destinationPointId);

  if (!startPoint || !destinationPoint) {
    alert("Избрана е невалидна точка.");
    return;
  }
  if (!startPoint.connections.includes(destinationPointId)) {
    alert("Тези точки не са свързани. Изберете свързана точка");
    return;
  }

  if (pawnsOnPoints[startPointId].owner !== currentPlayer) {
    alert("Можете да местите само своите пулове.");
    return;
  }

  const numPawns = 1; // Може да се премести само един пул наведнъж

  // Актуализиране на броя пулове за преместването
  pawnsOnPoints[startPointId].pawns -= numPawns;
  if (pawnsOnPoints[startPointId].pawns === 0) {
    pawnsOnPoints[startPointId].owner = null;
    console.log(`Пулове на точка ${startPointId} бяха преместени.`);
  }

  if (!pawnsOnPoints[destinationPointId]) {
    pawnsOnPoints[destinationPointId] = { pawns: 0, owner: null };
  }

  if (pawnsOnPoints[destinationPointId].owner && pawnsOnPoints[destinationPointId].owner !== currentPlayer) {
    X = true; // Поставяне на X на true при прескачане

    // Логика за прескачане и улавяне
    const capturePoints = destinationPoint.connections.filter(pointId => {
      const point = pointsData.find(p => p.id === pointId);
      return point && (!pawnsOnPoints[pointId] || pawnsOnPoints[pointId].pawns === 0);
    });

    if (capturePoints.length > 0) {
      captureOptions = capturePoints.map(pointId => pointId);
      captureOptions.forEach(option => {
        highlightCaptureOption(option);
      });

      // Премахване на противниковите пулове и актуализиране на броя пулове на опонента
      const opponent = pawnsOnPoints[destinationPointId].owner;
      playerPawnsCount[opponent] -= pawnsOnPoints[destinationPointId].pawns;
      updatePlayerPawnsCount();
      pawnsOnPoints[destinationPointId] = { pawns: 0, owner: null };
      console.log(`Пулове на точка ${destinationPointId} бяха изтрити, защото бяха прескочени.`);
      updatePointDisplay(destinationPointId);

      alert("Изберете точка за кацане");

      captureOptions.forEach(option => {
        document.getElementById(option).addEventListener("click", () => {
          handleCaptureChoice(option);
        });
      });
    } else {
      alert("Няма празни точки за кацане.");
      pawnsOnPoints[startPointId].pawns += numPawns;
      if (pawnsOnPoints[startPointId].pawns === 1) {
        pawnsOnPoints[startPointId].owner = currentPlayer;
      }
      return;
    }
  } else {
    pawnsOnPoints[destinationPointId].pawns += numPawns;
    pawnsOnPoints[destinationPointId].owner = currentPlayer;
  }

  updatePointDisplay(startPointId);
  updatePointDisplay(destinationPointId);

  // Превключване на редовете между играчите
  if (!X || (X && Y)) {
    if (isACapitalBeingAttacked) {
      alert("Поздравления! Успешно изгубихте столица и войска!");
      let ConqueredCapital = checkCapitalsOwnership(defender).capital;
      let CountryOfTheCapital = ConqueredCapital.country;
      changeCountryOwnership(CountryOfTheCapital, atacker);
      let pawnsToBePlaced = Math.ceil(maxPawnsPerPlayer / players[atacker].capitalsNum); // Колко пула трябва да бъдат предадени
      pawnsOnPoints[ConqueredCapital.id].pawns += pawnsToBePlaced;
      updatePointDisplay(ConqueredCapital.id);
      console.log("Heloooo");
    }
    isACapitalBeingAttacked=false;
    switchTurn();
  }
}
// Функция за обработка на избора на точка за кацане при улавяне
function handleCaptureChoice(pointId) {
  const validChoice = captureOptions.find(option => option === pointId);
  if (!validChoice) {
    return;
  }

  captureOptions.forEach(option => {
    const circle = document.getElementById(option);
    if (circle) {
      circle.setAttribute("r", 7); // Връщане към нормален радиус
      circle.setAttribute("fill", pawnsOnPoints[pointId].owner === 1 ? players[1].color : players[2].color);
    }
  });

  pawnsOnPoints[validChoice] = { pawns: 1, owner: currentPlayer };
  updatePointDisplay(validChoice);
  captureOptions = [];

  Y = true; // Поставяне на Y на true след избора

  if (X && Y) {
    if (isACapitalBeingAttacked) {
      alert("Поздравления! Успешно изгубихте столица и войска!");
      let ConqueredCapital = checkCapitalsOwnership(defender).capital;
      let CountryOfTheCapital = ConqueredCapital.country;
      changeCountryOwnership(CountryOfTheCapital, atacker);
      let pawnsToBePlaced = Math.ceil(maxPawnsPerPlayer / players[atacker].capitalsNum); // Колко пула трябва да бъдат предадени
      pawnsOnPoints[ConqueredCapital.id].pawns += pawnsToBePlaced;
      updatePointDisplay(ConqueredCapital.id);
      console.log("Heloooo");
    }
    isACapitalBeingAttacked=false;
    switchTurn();
  }
}

// Функция за подчертаване на опция за кацане при улавяне
function highlightCaptureOption(pointId) {
  const point = pointsData.find(p => p.id === pointId);
  if (point) {
    const circle = document.getElementById(point.id);
    circle.setAttribute("fill", "yellow");
    circle.setAttribute("r", point.capital ? 22 : 10); // Увеличаване на радиуса на точката
  }
}

// Функция за актуализиране на визуализацията на точка според броя пулове
function updatePointDisplay(pointId) {
  const pawnsGroup = document.getElementById("pawns");
  const point = pointsData.find(p => p.id === pointId);
  if (!point) {
    console.error(`Точка с id ${pointId} не е намерена`);
    return;
  }

  // Премахване на съществуващото изображение
  const existingDisplay = pawnsGroup.querySelector(`[data-point-id="${pointId}"]`);
  if (existingDisplay) {
    pawnsGroup.removeChild(existingDisplay);
  }

  const pawnCount = pawnsOnPoints[pointId].pawns;

  if (pawnCount > 0) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("data-point-id", pointId);
    group.addEventListener("click", () => selectPoint(pointId)); // Добавяне на клик събитие към групата

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", point.capital ? 22 : 16); // Увеличаване на радиуса на кръга
    circle.setAttribute("fill", pawnsOnPoints[pointId].owner === 1 ? players[1].color : players[2].color);
    circle.style.cursor = "pointer"; // Настройка на курсора на pointer

    group.appendChild(circle);

    if (!Y) { // Премахване на текста, ако Y е true
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", point.x);
      text.setAttribute("y", point.y + 5); // Настройка за центриране на текста
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("fill", "white");
      text.setAttribute("font-size", "14"); // Увеличаване на размера на шрифта
      text.textContent = pawnCount;
      group.appendChild(text);
    }

    pawnsGroup.appendChild(group);
  } else {
    const circle = document.getElementById(point.id);
    if (circle) {
      circle.setAttribute("r", point.capital ? 22 : 7); // Начален радиус
      circle.setAttribute("fill", pawnsOnPoints[pointId].owner === 1 ? players[1].color : players[2].color);
      circle.style.cursor = "pointer"; // Настройка на курсора на pointer
    }
    console.log(`Точката ${pointId} е скрита, защото няма пулове.`);
  }
}

// Функция за рендиране на точки, връзки и добавяне на пулове
function renderMapElements() {
  const pointsGroup = document.getElementById("points");
  const connectionsGroup = document.getElementById("connections");
  const pointMap = {};
  pointsData.forEach(point => {
    pointMap[point.id] = point;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", point.capital ? 22 : 7); // Начален радиус
    circle.setAttribute("fill", point.country ? (checkCountryOwnership(point) === 1 ? players[1].color : (checkCountryOwnership(point) === 2 ? players[2].color : "gray")) : "gray");
    circle.setAttribute("id", point.id);
    circle.style.cursor = "pointer"; // Настройка на курсора на pointer
    circle.addEventListener("click", () => selectPoint(point.id)); // Добавяне на клик събитие към точката
    pointsGroup.appendChild(circle);

    pawnsOnPoints[point.id] = { pawns: 0, owner: null };
  });

  pointsData.forEach(point => {
    point.connections.forEach(connectionId => {
      const targetPoint = pointMap[connectionId];
      if (targetPoint) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", point.x);
        line.setAttribute("y1", point.y);
        line.setAttribute("x2", targetPoint.x);
        line.setAttribute("y2", targetPoint.y);
        line.setAttribute("stroke", "black");
        line.setAttribute("stroke-width", 2);
        connectionsGroup.appendChild(line);
      }
    });
  });
}

// Превключване на редовете между играчите
function switchTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  alert(`Сега е ред на ${getCurrentPlayerName()} да мести пуловете си.`);

  // Премахване на текста от всички точки
  Object.keys(pawnsOnPoints).forEach(pointId => {
    const point = document.getElementById(pointId);
    if (point) {
      const textElement = point.querySelector('text');
      if (textElement) {
        point.removeChild(textElement);
        console.log(`Точката ${pointId} е скрита по време на преминаване на хода.`);
      }
    }
  });
  if (checkCapitalsOwnership(currentPlayer).underAttack && isACapitalBeingAttacked === false && defenderMoveMade === false) {
    alert("Има противникови пулове на ваша столица, защитете я!");
    isACapitalBeingAttacked = true;
    if (currentPlayer === 1) { atacker = 2; defender = 1; console.log('atacker=2,defender=1 ') }
    if (currentPlayer === 2) { atacker = 1; defender = 2; console.log('atacker=1,defender=2 ') }
  }

  X = false;
  Y = false;
}

// Инициализиране на играта
logPointsData();
renderMapElements();
updatePlayerPawnsCount();

