// Game board boundaries and dimensions
const upperBorder = 4; // Top boundary of the playable area (y-coordinate)
const lowerBorder = 24; // Bottom boundary of the playable area (y-coordinate)
const leftBorder = 4; // Left boundary of the playable area (x-coordinate)
const rightBorder = 14; // Right boundary of the playable area (x-coordinate)
const fieldWidth = 18; // Total width of the game field
const fieldHeight = 28; // Total height of the game field

// Control input delay to prevent rapid repeated actions
const controlDelay = 10;

// Tracks the state of gamepad buttons to detect single presses
const gamePadReleased = {
    'start': 0, // Start button
    'enter': 0, // Enter button
    'rotate': 0, // Rotate button
};

// Tetris piece shapes represented as 4x4 grids of '1's (filled) and '0's (empty)
const shapeModels = [
    ['1111', '0000', '0000', '0000'], // I-piece
    ['0100', '1110', '0000', '0000'], // T-piece
    ['1000', '1110', '0000', '0000'], // L-piece
    ['0010', '1110', '0000', '0000'], // J-piece
    ['1100', '1100', '0000', '0000'], // O-piece
    ['1100', '0110', '0000', '0000'], // S-piece
    ['0110', '1100', '0000', '0000'], // Z-piece
];

// Colors corresponding to each Tetris piece type
const colors = [
    'black', // Empty cell
    'red',    // Color for piece 1
    'blue',   // Color for piece 2
    'yellow', // Color for piece 3
    'green',  // Color for piece 4
    'purple', // Color for piece 5
    'orange', // Color for piece 6
    'cyan',   // Color for piece 7
];

// Wall kick data for rotating Tetris pieces
const wallKickData = {
    JLSTZ: [ // Wall kicks for J, L, S, T, and Z pieces
        [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 0->R
        [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],    // R->2
        [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],   // 2->L
        [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]  // L->0
    ],
    I: [ // Wall kicks for the I-piece
        [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],  // 0->R
        [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],  // R->2
        [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],  // 2->L
        [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]   // L->0
    ]
};

// Cached DOM elements for performance optimization
let cachedElements = {};

// Global game state object
let game = {};

// Returns a random integer between min (inclusive) and max (exclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Returns a random Tetris piece from the shapes array
function getRandomShape() {
    const index = getRandomInt(0, game.shapes.length);
    return game.shapes[index];
}

// Rotates the current piece and applies wall kicks if necessary
function rotateShape() {
    const originalPiece = game.piece;
    const rotatedPiece = originalPiece[0].map((_, index) =>
        originalPiece.map(row => row[index]).reverse()
    );

    const previousPiece = [...game.piece];
    const previousX = game.x;
    const previousY = game.y;
    const previousRotationState = game.rotationState;

    game.piece = rotatedPiece;
    game.rotationState = (game.rotationState + 1) % 4;

    const wallKicks = (game.piece === shapeModels[0]) ? wallKickData.I : wallKickData.JLSTZ;
    const kicks = wallKicks[previousRotationState];

    for (const [x, y] of kicks) {
        game.x += x;
        game.y += y;

        if (checkThatShapeIsValid()) {
            return;
        }

        game.x = previousX;
        game.y = previousY;
    }

    // If no kick works, revert the rotation
    game.piece = previousPiece;
    game.rotationState = previousRotationState;
}

// Checks if the current piece is in a valid position on the grid
function checkThatShapeIsValid() {
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (game.piece[y][x]) {
                const gx = game.x + x;
                const gy = game.y + y;
                if (gx < leftBorder || gx >= rightBorder || gy < upperBorder || gy >= lowerBorder || game.field[gy][gx]) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Moves all rows above `lineTo` down by one row
function bringUpperRowsDownByOne(lineTo) {
    for (let y = lineTo; y > 0; y--) {
        for (let x = 0; x < fieldWidth; x++) {
            game.field[y][x] = game.field[y - 1][x];
        }
    }
}

// Checks if a row is fully filled and should be cleared
function lineComplete(line) {
    for (let x = leftBorder; x < rightBorder; x++) {
        if (!game.field[line][x]) {
            return false;
        }
    }
    return true;
}

// Starts the animation for clearing completed lines
function beginClearAnimation() {
    const fieldContainer = cachedElements.fieldContainer;
    fieldContainer.textContent = '';

    for (let y = upperBorder; y < fieldHeight; y++) {
        const row = document.createElement('div');
        for (let x = leftBorder; x < rightBorder; x++) {
            if (game.field[y][x]) {
                const block = document.createElement('div');
                block.classList.add('block');
                block.classList.add(colors[game.field[y][x]]);
                row.appendChild(block);
            } else {
                const block = document.createElement('div');
                block.classList.add('block');
                block.classList.add('black');
                row.appendChild(block);
            }
        }
        row.classList.add('row');
        if (lineComplete(y)) {
            row.classList.add('fade-out');
        }
        fieldContainer.appendChild(row);
    }
}

// Scores completed rows and updates the game state
function scoreRows() {
    let rowsCleared = 0;
    const fullRow = 10;

    for (let y = upperBorder; y < lowerBorder; y++) {
        let filledBlocks = 0;
        for (let x = leftBorder; x < rightBorder; x++) {
            if (game.field[y][x]) {
                filledBlocks++;
            }
            if (filledBlocks === fullRow) {
                game.scoreCounter += 100;
                rowsCleared++;
                game.animation = true;
                setTimeout(() => {
                    beginClearAnimation();
                }, 5);
                setTimeout(() => {
                    game.animation = false;
                    bringUpperRowsDownByOne(y);
                }, 500);
            }
        }
    }
    if (rowsCleared === 4) {
        game.scoreCounter += 100;
    }
    game.lines += rowsCleared;
}

// Checks if the game is over (i.e., if the playable area is filled)
function checkForGameOver() {
    for (let y = 0; y < upperBorder; y++) {
        for (let x = 0; x < fieldWidth; x++) {
            if (game.field[y][x]) {
                return true;
            }
        }
    }
    return false;
}

// Displays the game-over animation and message
function gameOverAnimation() {
    const gameContainer = cachedElements.gameContainer;
    const h1 = document.createElement('h3');
    h1.textContent = 'Game Over';
    const h3 = document.createElement('h4');
    h3.textContent = 'Press Enter to restart';
    const gameOverContainer = document.createElement('div');
    gameOverContainer.className = 'game-over';
    const field = document.getElementById('field');
    field.classList.add('dim-screen');
    game.awaitNewGame = true;
    gameOverContainer.appendChild(h1);
    gameOverContainer.appendChild(h3);
    document.getElementById('game').appendChild(gameOverContainer);
}

// Handles the game-over state
function performGameOver() {
    if (!game.gameOver) {
        game.gameOver = true;
        game.animation = true;
        gameOverAnimation();
        setTimeout(() => {
            game.animation = false;
        }, 1000);
    }
}

// Checks if the current piece has landed on the grid
function checkPieceLanded() {
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (game.piece[y][x]) {
                try {
                    if (game.field[game.y + y][game.x + x]) {
                        return true;
                    }
                } catch {
                    return true;
                }
            }
        }
    }
    return false;
}

// Checks if the current piece is in a valid location
function isLocationValid() {
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (game.piece[y][x]) {
                if (game.field[y + game.y][x + game.x]) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Adds the current piece to the game board
function applyShape() {
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (game.piece[y][x]) {
                game.field[game.y + y][game.x + x] = game.piece[y][x];
            }
        }
    }
}

// Places the current piece on the board and spawns a new piece
function addPieceToField() {
    while (game.y > (upperBorder - 1)) {
        if (isLocationValid()) {
            applyShape();
            game.piece = game.nextPiece;
            game.nextPiece = getRandomShape();
            game.pieceTraded = false;
            game.timeToDrop = game.dropRate;
            game.dropping = false;
            game.waitForControl = controlDelay * 3;
            game.x = leftBorder + 3;
            game.y = upperBorder;
            game.rotationState = 0;
            return;
        }
        game.y--;
    }

    applyShape();
    if (checkForGameOver()) {
        performGameOver();
    }
}

// Updates the game state based on user input and game logic
function updateGame() {
    if (game.leftAction) {
        game.x--;
        if (!checkThatShapeIsValid()) {
            game.x++;
        } else {
            game.timeToDrop = Math.floor(game.dropRate / 2);
        }
    }

    if (game.rightAction) {
        game.x++;
        if (!checkThatShapeIsValid()) {
            game.x--;
        } else {
            game.timeToDrop = Math.floor(game.dropRate / 2);
        }
    }

    if (game.downAction) {
        game.y++;
        if (!checkThatShapeIsValid()) {
            game.y--;
        }
        if (checkPieceLanded()) {
            game.y--;
            addPieceToField();
            game.timeToDrop = game.dropRate;
        }
    }

    if (game.dropAction) {
        game.dropping = true;
    }

    if (game.dropping) {
        game.y++;
        if (!checkThatShapeIsValid()) {
            game.y--;
            addPieceToField();
            game.dropping = false;
        }
    }

    if (game.tradePieceAction) {
        if (!game.pieceTraded) {
            if (!game.swapedPiece) {
                game.swapedPiece = [...game.piece];
                game.piece = [...game.nextPiece];
                game.nextPiece = getRandomShape();
                game.x = leftBorder + 3;
                game.y = upperBorder;
            } else {
                game.piece = [...game.swapedPiece];
                game.swapedPiece = null;
            }
            game.pieceTraded = true;
        }
    }

    if (game.rotateAction) {
        rotateShape();
        game.timeToDrop = game.dropRate;
    }

    if (game.timeToDrop === 0) {
        game.y++;
        if (checkPieceLanded() || !checkThatShapeIsValid()) {
            game.y--;
            addPieceToField();
        }
        game.timeToDrop = game.dropRate;
    } else {
        game.timeToDrop--;
    }

    scoreRows();

    if (checkForGameOver()) {
        performGameOver();
    }

    game.leftAction = false;
    game.rightAction = false;
    game.downAction = false;
    game.rotateAction = false;
    game.tradePieceAction = false;
    game.dropAction = false;
}

// Renders the game board and the current piece
function renderField() {
    const fieldContainer = cachedElements.fieldContainer;
    fieldContainer.innerHTML = '';
    const buffer = [...game.field.map(row => [...row])];

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (game.piece[y][x]) {
                try {
                    buffer[y + game.y][x + game.x] = game.piece[y][x];
                } catch {
                    continue;
                }
            }
        }
    }

    for (let y = upperBorder; y < lowerBorder; y++) {
        const row = document.createElement('div');
        row.classList.add('row');
        for (let x = leftBorder; x < rightBorder; x++) {
            if (buffer[y][x]) {
                const block = document.createElement('div');
                const index = buffer[y][x];
                block.classList.add('block', colors[index]);
                row.appendChild(block);
            } else {
                const block = document.createElement('div');
                block.classList.add('block', 'black');
                row.appendChild(block);
            }
        }
        fieldContainer.appendChild(row);
    }
}

// Renders the next piece and the held piece (if any)
function renderNextPiece() {
    const swapedPieceText = document.createElement('div');
    swapedPieceText.textContent = 'hold';
    swapedPieceText.classList.add('next-piece-text');
    const nextPieceText = document.createElement('div');
    nextPieceText.textContent = 'next';
    const swapedPieceContainer = document.createElement('div');
    const swapedPieceInnerContainer = document.createElement('div');
    const nextPieceContainer = cachedElements.nextPieceContainer;
    swapedPieceContainer.id = 'swaped-piece';
    nextPieceContainer.textContent = '';
    nextPieceText.classList.add('next-piece-text');
    const buffer = [...game.nextPiece.map(row => [...row])];
    nextPieceContainer.appendChild(nextPieceText);

    for (let y = 0; y < 4; y++) {
        const row = document.createElement('div');
        row.classList.add('row');
        for (let x = 0; x < 4; x++) {
            if (buffer[y][x]) {
                const block = document.createElement('div');
                const index = buffer[y][x];
                block.classList.add('block', colors[index]);
                row.appendChild(block);
            } else {
                const block = document.createElement('div');
                block.classList.add('block');
                row.appendChild(block);
            }
        }
        nextPieceContainer.appendChild(row);
    }

    nextPieceContainer.appendChild(swapedPieceContainer);
    swapedPieceContainer.appendChild(swapedPieceText);
    swapedPieceContainer.appendChild(swapedPieceInnerContainer);

    if (game.swapedPiece) {
        const swapedBuffer = [...game.swapedPiece.map(row => [...row])];
        for (let y = 0; y < 4; y++) {
            const row = document.createElement('div');
            row.classList.add('row');
            for (let x = 0; x < 4; x++) {
                if (swapedBuffer[y][x]) {
                    const block = document.createElement('div');
                    const index = swapedBuffer[y][x];
                    block.classList.add('block', colors[index]);
                    row.appendChild(block);
                } else {
                    const block = document.createElement('div');
                    block.classList.add('block');
                    row.appendChild(block);
                }
            }
            swapedPieceInnerContainer.appendChild(row);
        }
    }
}

// Renders the player's score and the number of lines cleared
function renderScore() {
    const scoreContainer = cachedElements.scoreContainer;
    const div = document.createElement('div');
    const linesDiv = document.createElement('div');
    const linesText = document.createElement('div');
    linesText.textContent = 'lines';
    linesText.classList.add('lines-text');
    linesDiv.append(`${game.lines}`);
    linesDiv.classList.add('score-text');
    div.textContent = `${game.score}`;
    div.classList.add('score-text');
    scoreContainer.textContent = 'score';
    scoreContainer.classList.add('score-text');
    scoreContainer.appendChild(div);
    scoreContainer.appendChild(linesText);
    scoreContainer.appendChild(linesDiv);
}

// The main rendering loop that updates and renders the game
function renderGame() {
    if (!game.pauseAction && !game.animation) {
        updateGame();
        renderField();
        renderNextPiece();
        renderScore();
    }

    if (game.scoreCounter > 0) {
        game.score += 1;
        game.scoreCounter -= 1;
    }

    window.requestAnimationFrame(() => {
        renderGame();
        if (game.waitForControl > 0) {
            game.waitForControl--;
        } else {
            pollGamepads();
        }
    });
}

// Resets the game state and initializes a new game
function restartGame() {
    const gameContainer = document.getElementById('game');
    game = {};
    game.awaitNewGame = false;

    game.shapes = shapeModels.map((shapeModel, index) => {
        return shapeModel.map((row) => {
            return row.split('').map((cell) => {
                if (cell === '1') {
                    return index + 1;
                }
                return 0;
            });
        });
    });

    game.field = Array.from({ length: fieldHeight }, () => {
        return Array.from({ length: fieldWidth }, () => {
            return false;
        });
    });

    game.swapedPiece = null;

    game.piece = getRandomShape();
    game.nextPiece = getRandomShape();

    game.score = 0;
    game.scoreCounter = 0;
    game.lines = 0;

    game.pieceTraded = false;
    game.rotationState = 0;

    game.waitForControl = controlDelay;

    game.x = leftBorder + 3;
    game.y = upperBorder;
    game.dropRate = 60;
    game.dropping = false;

    game.animation = 0;

    game.timeToDrop = game.dropRate;

    game.leftAction = false;
    game.rightAction = false;
    game.downAction = false;
    game.rotateAction = false;

    gameContainer.textContent = '';

    const fieldContainer = document.createElement('div');
    fieldContainer.id = 'field';
    gameContainer.appendChild(fieldContainer);

    const nextPieceContainer = document.createElement('div');
    nextPieceContainer.id = 'next-piece';
    gameContainer.appendChild(nextPieceContainer);

    const scoreContainer = document.createElement('div');
    scoreContainer.id = 'score';
    scoreContainer.classList.add('score-panel');
    gameContainer.appendChild(scoreContainer);

    // Cache DOM elements
    cachedElements = {};
    cachedElements.gameContainer = gameContainer;
    cachedElements.fieldContainer = document.getElementById('field');
    cachedElements.nextPieceContainer = document.getElementById('next-piece');
    cachedElements.scoreContainer = document.getElementById('score');
}

// Polls connected gamepads and handles input
function pollGamepads() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
        if (gamepad) {
            handleGamepadInput(gamepad);
        }
    }
}

// Handles input from a connected gamepad
function handleGamepadInput(gamepad) {
    if (game.waitForControl > 0) {
        return;
    }

    if (gamepad.buttons[0].pressed) { // Button A (typically)
        gamePadReleased.rotate = 1;
    } else {
        if (gamePadReleased.rotate === 1) {
            game.rotateAction = true;
            gamePadReleased.rotate = 0;
        }
    }
    if (gamepad.buttons[3].pressed) {
        game.dropAction = true;
        game.waitForControl = controlDelay * 2;
    }
    if (gamepad.buttons[14].pressed) { // D-pad left
        game.leftAction = true;
        game.waitForControl = controlDelay * 1;
    }
    if (gamepad.buttons[15].pressed) { // D-pad right
        game.rightAction = true;
        game.waitForControl = controlDelay * 1;
    }
    if (gamepad.buttons[13].pressed) { // D-pad down
        game.downAction = true;
        game.waitForControl = controlDelay * 1;
    }

    if (gamepad.buttons[1].pressed) { // Button B (typically)
        game.tradePieceAction = true;
        game.waitForControl = controlDelay * 2;
    }

    if (gamepad.buttons[9].pressed) { // Start button (typically)
        gamePadReleased.start = 1;
    } else {
        if (gamePadReleased.start === 1) {
            if (game.awaitStartGame) {
                beginGame();
            } else if (game.awaitNewGame) {
                restartGame();
            } else {
                game.pauseAction = !game.pauseAction;
            }
            gamePadReleased.start = 0;
        }
    }

    // Example: Check joystick axes (e.g., left stick)
    const leftStickX = gamepad.axes[0]; // -1 (left) to 1 (right)
    const leftStickY = gamepad.axes[1]; // -1 (up) to 1 (down)

    if (leftStickX < -0.5) {
        game.leftAction = true;
    } else if (leftStickX > 0.5) {
        game.rightAction = true;
    }

    if (leftStickY < -0.5) {
        game.downAction = true;
    }
}

// Displays a message prompting the player to press Enter to start the game
function awaitEnterPress() {
    const gameContainer = document.getElementById('game');
    const textContainer = document.createElement('div');
    textContainer.id = 'start-game-text';
    textContainer.textContent = 'Press Enter to start';
    textContainer.classList.add('start-game-text');
    game.awaitStartGame = true;
    gameContainer.appendChild(textContainer);
}

// Starts the game after the player presses Enter
function beginGame() {
    game.awaitStartGame = false;
    const gameStartText = document.getElementById('start-game-text');
    gameStartText.remove();
    game.animation = false;
}

// Initializes the game and sets up event listeners
export function startGame() {
    restartGame();
    awaitEnterPress();
    renderGame();
    game.animation = true;

    // Keyboard event listeners
    window.addEventListener('keydown', (event) => {
        event.preventDefault();
        if (game.waitForControl > 0) {
            return;
        }
        game.waitForControl = controlDelay;
        switch (event.key) {
            case 'ArrowLeft':
                game.leftAction = true;
                break;
            case 'ArrowRight':
                game.rightAction = true;
                break;
            case 'ArrowDown':
                game.downAction = true;
                break;
            case 'ArrowUp':
                game.rotateAction = true;
                break;
            case 'Tab':
                game.tradePieceAction = true;
                break;
            case ' ':
                game.dropAction = true;
                break;
        }
    });

    window.addEventListener('keyup', (event) => {
        event.preventDefault();
        const key = event.key.toLocaleUpperCase();
        switch (key) {
            case 'P':
                game.pauseAction = !game.pauseAction;
                break;
            case 'ENTER':
                if (game.awaitNewGame) {
                    restartGame();
                } else if (game.awaitStartGame) {
                    beginGame();
                }
                break;
        }
    });
}