let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const EatSound = new Howl({
  src: ["./assets/hardPop.wav"],
});
const GameOverSound = new Howl({
  src: ["./assets/gameOver.wav"],
});
const BgMusicSound = new Howl({
  src: ["./assets/bgMusic.mp3"],
  autoplay: true,
  loop: true,
  volume: 0.5,
});

const img = new Image();
img.src = "./assets/snake.svg";

handleScreenResize();
window.addEventListener("resize", () => handleScreenResize());

function handleScreenResize() {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
}

let canvasAnimationLoop;

const BOARD_SIZE = 500;
const CELL_SIZE = 20;
const DEFAULT_CELL_COLOR = "#0d2818";
const DEFAULT_CELL_OUTLINE_COLOR = "#020202";
const DEFAULT_CELL_OUTLINE_WIDTH = 1;
const DEFAULT_FOOD_COLOR = "#da2c38";
const DEFAULT_FRAME_COLOR = "#ee4423";
const DEFAULT_FRAME_WIDTH = 3;

const SNAKE_HEAD_COLOR = "#4faf44";
const SNAKE_BODY_COLOR = "#4faf44";

const CELL_COLOR_1 = "#101416";
const CELL_COLOR_2 = "#000000";

const SCORE_COLOR = "#2a3493";
const HEADING_COLOR = "#4faf44";

class Heading {
  heading = "";
  fontStyle = "700 48px bungeeShade";
  constructor(heading) {
    this.heading = heading;
  }
  paint() {
    ctx.font = this.fontStyle;
    ctx.fillStyle = HEADING_COLOR;
    ctx.fillText(
      `${this.heading}`.padStart(6, "0"),
      canvas.width / 2 - 17 * this.heading.length,
      80
    );
  }
}

class ScoreBoard {
  score = 0;
  font = "700 38px kodeMono";
  frameWidth = DEFAULT_FRAME_WIDTH;
  gameBoard = {};
  constructor(gameBoard) {
    this.gameBoard = gameBoard;
  }
  paint() {
    ctx.font = this.font;
    ctx.lineWidth = this.frameWidth;
    ctx.strokeStyle = DEFAULT_FRAME_COLOR;
    ctx.fillStyle = SCORE_COLOR;
    ctx.fillText(
      `${this.score}`.padStart(6, "0"),
      this.gameBoard.frameStartX + 10,
      this.gameBoard.frameStartY - 30
    );
    ctx.beginPath();
    ctx.strokeRect(
      this.gameBoard.frameStartX,
      this.gameBoard.frameStartY - 70,
      this.gameBoard.frameWidth,
      60 - this.frameWidth * 2
    );
  }
  set updateScore(updatedScore) {
    this.score = updatedScore;
  }
}

class Cell {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  cellColor = DEFAULT_CELL_COLOR;
  cellOutlineColor = DEFAULT_CELL_OUTLINE_COLOR;
  cellOutlineWidth = DEFAULT_CELL_OUTLINE_WIDTH;

  isEven = false;

  constructor(x, y, width, height, isEven) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.isEven = isEven;
    this.cellColor = isEven ? CELL_COLOR_1 : CELL_COLOR_2;
  }
  paint() {
    ctx.fillStyle = this.cellColor;
    ctx.strokeStyle = this.cellOutlineColor;
    ctx.lineWidth = this.cellOutlineWidth;
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.fill();
  }
  resetCellColor() {
    this.cellColor = this.isEven ? CELL_COLOR_1 : CELL_COLOR_2;
  }
}
class GameBoard {
  startX = 0;
  startY = 0;
  width = 0;
  height = 0;
  board = [];

  frameStartX = 0;
  frameStartY = 0;
  frameWidth = 0;
  frameHeight = 0;

  constructor(startX, startY, boardSize, cellSize) {
    // outlineOffset store the total width taken by cell outline
    let outlineOffset = (boardSize / cellSize) * DEFAULT_CELL_OUTLINE_WIDTH;
    // offset for game board starting point
    this.startX = startX + (canvas.width - boardSize - outlineOffset) / 2;
    this.startY = startY + (canvas.height - boardSize - outlineOffset) / 2;

    this.width = outlineOffset + boardSize;
    this.height = outlineOffset + boardSize;

    // frame coords
    this.frameStartX = this.startX - 3 * DEFAULT_FRAME_WIDTH;
    this.frameStartY = this.startY - 3 * DEFAULT_FRAME_WIDTH;
    this.frameWidth = this.width + 6 * DEFAULT_FRAME_WIDTH;
    this.frameHeight = this.height + 6 * DEFAULT_FRAME_WIDTH;

    // populate 2d matrix with cell
    this.populateWithCell(boardSize, cellSize);
  }
  populateWithCell(boardSize, cellSize) {
    for (let i = 0; i < boardSize / cellSize; i++) {
      let rowData = [];
      for (let j = 0; j < boardSize / cellSize; j++) {
        rowData.push(
          new Cell(
            this.startX + j * (cellSize + DEFAULT_CELL_OUTLINE_WIDTH),
            this.startY + i * (cellSize + DEFAULT_CELL_OUTLINE_WIDTH),
            cellSize,
            cellSize,
            (i + j) % 2 === 0 ? true : false // even or odd cell
          )
        );
      }
      this.board.push(rowData);
    }
  }
  paint() {
    for (let row of this.board) {
      for (let cell of row) {
        cell.paint();
      }
    }
    // frame
    ctx.strokeStyle = DEFAULT_FRAME_COLOR;
    ctx.lineWidth = DEFAULT_FRAME_WIDTH;
    ctx.beginPath();
    ctx.strokeRect(
      this.frameStartX,
      this.frameStartY,
      this.frameWidth,
      this.frameHeight
    );
  }
  resetCellBoardColor() {
    for (let row of this.board) {
      for (let cell of row) {
        cell.resetCellColor();
      }
    }
  }
}
class Snake {
  head = { row: 0, cell: 0 };
  body = [];
  speed = 10;
  snakeHeadColor = SNAKE_HEAD_COLOR;
  snakeBodyColor = SNAKE_BODY_COLOR;
  board = [];
  direction = "down"; // left | right | down | up
  count = 0;

  constructor(gameBoard) {
    this.head = { row: 0, col: 0 };
    this.board = gameBoard.board;
  }
  moveSnake() {
    if (this.count !== this.speed) {
      this.count++;
      return;
    }
    switch (this.direction) {
      case "up": {
        this.moveToUp();
        break;
      }
      case "down": {
        this.moveToDown();
        break;
      }
      case "left": {
        this.moveToLeft();
        break;
      }
      case "right": {
        this.moveToRight();
        break;
      }
    }
    this.count = 0;
    return;
  }
  paint() {
    this.moveSnake();
    this.board[this.head.row][this.head.col].cellColor = this.snakeHeadColor;
    if (this.body.length) {
      for (let bodyCell of this.body) {
        this.board[bodyCell.row][bodyCell.col].cellColor = this.snakeBodyColor;
      }
    }
  }
  set snakeDirection(direction) {
    // ignore direction if same
    if (this.direction === direction) return;
    // ignore directly opposite direction on the same axis
    if (this.direction === "up" && direction === "down") return;
    if (this.direction === "down" && direction === "up") return;
    if (this.direction === "left" && direction === "right") return;
    if (this.direction === "right" && direction === "left") return;
    this.direction = direction;
  }

  moveToLeft() {
    this.chopTail();
    if (this.head.col <= 0) {
      this.head.col = this.board[0].length - 1;
      return;
    }
    this.head.col -= 1;
  }
  moveToRight() {
    this.chopTail();
    if (this.head.col >= this.board[0].length - 1) {
      this.head.col = 0;
      return;
    }
    this.head.col += 1;
  }
  moveToUp() {
    this.chopTail();
    if (this.head.row <= 0) {
      this.head.row = this.board.length - 1;
      return;
    }
    this.head.row -= 1;
  }
  moveToDown() {
    this.chopTail();
    if (this.head.row >= this.board.length - 1) {
      this.head.row = 0;
      return;
    }
    this.head.row += 1;
  }
  chopTail() {
    if (this.body.length) {
      this.body.pop();
      this.body.unshift({ row: this.head.row, col: this.head.col });
    }
  }
  incrementSnakeLength() {
    let lastBodyBlock = this.body.length
      ? this.body[this.body.length - 1]
      : this.head;
    this.count = this.speed;
    this.body.push(lastBodyBlock);
    EatSound.play();
  }
  isKilled() {
    if (!this.board.length) return;
    for (let bodyCell of this.body) {
      if (bodyCell.row === this.head.row && bodyCell.col === this.head.col) {
        // alert("loss");
        GameOverSound.play();
        window.cancelAnimationFrame(canvasAnimationLoop);
        resetGame();
      }
    }
  }
}
class Food {
  coordinates = { row: 0, col: 0 };
  foodCol = 0;
  foodColor = DEFAULT_FOOD_COLOR;
  board = [];
  snake;
  constructor(gameBoard, snake) {
    this.board = gameBoard.board;
    this.snake = snake;
    this.setRandomCoordinates();
  }
  generateRandomCoordinates() {
    let row = Math.floor(Math.random() * gameBoard.board.length);
    let col = Math.floor(Math.random() * gameBoard.board.length);
    return { row, col };
  }
  setRandomCoordinates() {
    let coords;
    do {
      coords = this.generateRandomCoordinates();
    } while (this.isOccupied(coords));

    this.coordinates.row = coords.row;
    this.coordinates.col = coords.col;
  }
  isOccupied(coords) {
    if (
      this.snake.head.row === coords.row &&
      this.snake.head.col === coords.col
    ) {
      return true;
    }

    for (let bodyCell of this.snake.body) {
      if (bodyCell.row === coords.row && bodyCell.col === coords.col) {
        return true;
      }
    }

    return false;
  }
  paint() {
    this.board[this.coordinates.row][this.coordinates.col].cellColor =
      this.foodColor;
  }
  onCollision(snake) {
    if (
      snake.head.row === this.coordinates.row &&
      snake.head.col === this.coordinates.col
    ) {
      snake.incrementSnakeLength();
      this.setRandomCoordinates();
    }
  }
}

let screenMid = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

let gameBoard = new GameBoard(0, 0, BOARD_SIZE, CELL_SIZE);
let scoreBoard = new ScoreBoard(gameBoard);
let snake = new Snake(gameBoard);
let food = new Food(gameBoard, snake);
let heading = new Heading("* SNAKE ARCADE *");

// controls
window.addEventListener("keydown", (event) => {
  event.preventDefault();
  switch (event.key) {
    case "ArrowUp": {
      snake.snakeDirection = "up";
      break;
    }
    case "ArrowRight": {
      snake.snakeDirection = "right";
      break;
    }
    case "ArrowLeft": {
      snake.snakeDirection = "left";
      break;
    }
    case "ArrowDown": {
      snake.snakeDirection = "down";
      break;
    }
    default:
      break;
  }
});

function credits() {
  ctx.font = "900 18px kodeMono";
  ctx.fillStyle = SCORE_COLOR;
  ctx.fillText(
    "Made with ♥ by Vaibhav Dhiman",
    canvas.width / 2 - 130,
    canvas.height - 20
  );
}

function resetGame() {
  gameBoard = new GameBoard(0, 0, BOARD_SIZE, CELL_SIZE);
  snake = new Snake(gameBoard);
  food = new Food(gameBoard, snake);
}

function gameLoop() {
  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // pattern
  const pattern = ctx.createPattern(img, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // game frame paint
  credits();
  heading.paint();
  gameBoard.paint();
  gameBoard.resetCellBoardColor();
  scoreBoard.paint();
  snake.paint();
  snake.isKilled();
  food.paint();
  food.onCollision(snake);
  scoreBoard.updateScore = snake.body.length * 10;
}

function animate() {
  gameLoop();
  canvasAnimationLoop = window.requestAnimationFrame(animate);
}

img.onload = () => {
  BgMusicSound.play();
  animate();
};
