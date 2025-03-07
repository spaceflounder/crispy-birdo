

const fieldWidth = 10;
const fieldHeight = 20;


const shapeModels = [
    [
        '0010',
        '0010',
        '0010',
        '0010',
    ],
    [
        '0100',
        '1110',
        '0000',
        '0000',
    ],
    [
        '0100',
        '0100',
        '1100',
        '0000',
    ],
    [
        '0100',
        '0100',
        '0110',
        '0000',
    ],
    [
        '1100',
        '1100',
        '0000',
        '0000',
    ],
    [
        '1100',
        '0110',
        '0000',
        '0000',
    ],
    [
        '0011',
        '0110',
        '0000',
        '0000',
    ]
];


const colors = [
    'black',
    'red',
    'blue',
    'yellow',
    'green',
    'purple',
    'orange',
    'cyan'
];


let game = {};


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


function getRandomShape() {
    const index = getRandomInt(0, game.shapes.length);
    return game.shapes[index];
}


function rotateShape() {
    // Create a copy of the current piece
    const originalPiece = game.piece;
    const rotatedPiece = originalPiece[0].map((_, index) => 
        originalPiece.map(row => row[index]).reverse()
    );

    // Save the current piece state in case the rotation is invalid
    const previousPiece = [...game.piece];

    // Update the piece to the rotated version
    game.piece = rotatedPiece;

    // Check if the rotated piece is valid
    if (!checkThatShapeIsValid()) {
        const isLeft = Math.floor(game.x < fieldWidth / 2);
        if (isLeft) {
            for (let i = 0; i < 20; ++i) {
                if (!checkThatShapeIsValid()) {
                    game.x++;
                } else {
                    break;
                }
            }
        } else {
            for (let i = 0; i < 20; ++i) {
                if (!checkThatShapeIsValid()) {
                    game.x--;
                } else {
                    break;
                }
            }
        }
        return;
    }
    
}


function checkThatShapeIsValid() {

    // check that shape is inside the field
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (game.piece[y][x]) {
                const gx = game.x + x;
                const gy = game.y + y;
                if (gx < 0) {
                    return false;
                }
                if (gx > fieldWidth - 1) {
                    return false;
                }
                if (gy < 0) {
                    return false;
                }
                if (gy > fieldHeight - 1) {
                    return false;
                }
                try {
                    if (game.field[gy][gx]) {
                        return false;
                    }
                } catch {
                    return false;
                }
            }
        }
    }

    return true;

}


function bringUpperRowsDownByOne(lineTo) {

    for (let y = lineTo; y > 0; y--) {
        for (let x = 0; x < fieldWidth; x++) {
            game.field[y][x] = game.field[y - 1][x];
        }
    }

}


function lineComplete(line) {

    for (let x = 0; x < fieldWidth; x++) {
        if (!game.field[line][x]) {
            return false;
        }
    }

    return true;

}


function beginClearAnimation() {

    const fieldContainer = document.getElementById('field');
    fieldContainer.textContent = '';

    for (let y = 5; y < fieldHeight; y++) {
        const row = document.createElement('div');
        for (let x = 0; x < fieldWidth; x++) {
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


function scoreRows() {

    let rowsCleared = 0;
 
    for (let y = 0; y < fieldHeight; y++) {
        let filledBlocks = 0;
        for (let x = 0; x < fieldWidth; x++) {
            if (game.field[y][x]) {
                filledBlocks++;
            }
            if (filledBlocks === fieldWidth) {
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



function checkForGameOver() {

    for (let y = 0; y < 4; y++) {

        for (let x = 0; x < fieldWidth; x++) {
            if (game.field[y][x]) {
                return true;
            }
        }

    }

    return false;

}


function gameOverAnimation() {

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


function performGameOver() {

    game.animation = true;
    gameOverAnimation();
    setTimeout(() => {
        game.animation = false;
    }, 1000);   

}


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


function addPieceToField() {

    for (let y = 0; y <  4; y++) {
        for (let x = 0; x < 4; x++) {
            if (game.piece[y][x]) {
                try {
                    for (let i = 0; i < 20; i++) {
                        if (game.field[y + game.y][x + game.x]) {
                            game.y--;
                        } else {
                            break;
                        }
                    }
                    game.field[y + game.y][x + game.x] = game.piece[y][x];
                } catch {
                    continue;
                }
            }
        }
    }

    game.piece = game.nextPiece;
    game.nextPiece = getRandomShape();
    game.pieceTraded = false;
    game.timeToDrop = game.dropRate;
    game.x = 3;
    game.y = 5;

}


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
            game.pieceTraded = false;
        }
    }

    if (game.dropAction) {
        for (let y = 0; y < fieldHeight; y++) {
            game.y++;
            if (checkPieceLanded() || !checkThatShapeIsValid()) {
                game.y--;
                addPieceToField();
                break;
            }    
        }
    }

    if (game.tradePieceAction) {
        if (!game.pieceTraded) {
            if (!game.swapedPiece) {
                game.swapedPiece = [...game.piece];
                game.piece = [...game.nextPiece];
                game.nextPiece = getRandomShape();
                game.x = 4;
                game.y = 5;
            } else {
                game.piece = [...game.swapedPiece];
                game.swapedPiece = null;
            }
        } else {
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


function renderField() {

    const fieldContainer = document.getElementById('field');
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

    for (let y = 5; y < fieldHeight; y++) {
        const row = document.createElement('div');
        row.classList.add('row');
        for (let x = 0; x < fieldWidth; x++) {
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


function renderNextPiece() {

    const swapedPieceText = document.createElement('div');
    swapedPieceText.textContent = 'saved';
    swapedPieceText.classList.add('next-piece-text');
    const nextPieceText = document.createElement('div');
    nextPieceText.textContent = 'next';
    const swapedPieceContainer = document.createElement('div');
    const nextPieceContainer = document.getElementById('next-piece');
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
            swapedPieceContainer.appendChild(row);
        }
    }
    
}


function renderScore() {
    
    const scoreContainer = document.getElementById('score');
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


export function renderGame() {

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
    });

}


export function restartGame() {


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

    game.x = 3;
    game.y = 5;
    game.dropRate = 60;

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

    window.addEventListener('keydown', (event) => {
        event.preventDefault();
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
                }
                break;
        }
    });

}
