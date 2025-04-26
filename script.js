const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');

//           grey 0     red 1,     orange 2,  yellow 3,  green 4,   cyan 5,    blue 6,    magenta/purple 7
const COL = ["#AAAAAA", "#FF0000", "#FFA500", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF", "#000000"];

var tileset = {};

const tetrominos = {
    // IRC = initial relative configuration
    I: {
        name: "I",
        size: 4,
        color: "#00FFFF",
        IRC: [
            ["#000000", "#000000", "#000000", "#000000"],
            ["#00FFFF", "#00FFFF", "#00FFFF", "#00FFFF"],
            ["#000000", "#000000", "#000000", "#000000"],
            ["#000000", "#000000", "#000000", "#000000"],
        ]
    },
    O: {
        name: "O",
        size: 4,
        color: "#FFFF00",
        IRC: [
            ["#000000", "#000000", "#000000", "#000000"],
            ["#000000", "#FFFF00", "#FFFF00", "#000000"],
            ["#000000", "#FFFF00", "#FFFF00", "#000000"],
            ["#000000", "#000000", "#000000", "#000000"],
        ]
    },
    J: {
        name: "J",
        size: 3,
        color: "#0000FF",
        IRC: [
            ["#000000", "#000000", "#000000"],
            ["#0000FF", "#0000FF", "#0000FF"],
            ["#000000", "#000000", "#0000FF"],
        ]
    },
    L: {
        name: "L",
        size: 3,
        color: "#FFA500",
        IRC: [
            ["#000000", "#000000", "#FFA500"],
            ["#FFA500", "#FFA500", "#FFA500"],
            ["#000000", "#000000", "#000000"],
        ]
    },
    S: {
        name: "S",
        size: 3,
        color: "#00FF00",
        IRC: [
            ["#000000", "#00FF00", "#000000"],
            ["#00FF00", "#00FF00", "#000000"],
            ["#00FF00", "#000000", "#000000"],
        ]
    },
    Z: {
        name: "Z",
        size: 3,
        color: "#FF0000",
        IRC: [
            ["#FF0000", "#000000", "#000000"],
            ["#FF0000", "#FF0000", "#000000"],
            ["#000000", "#FF0000", "#000000"],
        ]
    },
    T: {
        name: "T",
        size: 3,
        color: "#FF00FF",
        IRC: [
            ["#000000", "#FF00FF", "#000000"],
            ["#FF00FF", "#FF00FF", "#000000"],
            ["#000000", "#FF00FF", "#000000"],
        ]
    }
}

function drawGrid(cellSize, frames) {
    const width = canvas.width;
    const height = canvas.height;

    let sliced_timing = Math.floor(frame / 30 * 2) % 7;

    ctx.strokeStyle = COL[sliced_timing]; // color
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    }
}


function rotate_matrix(coords, anchor, dimension, mode) {
  for (let i = 0; i < coords.length; i++) {
    let { x, y } = coords[i];

    // Translate to origin
    let dx = x - anchor.x;
    let dy = y - anchor.y;

    let newX = dx;
    let newY = dy;

    if (mode === 1) {
      // 90° clockwise
      [newX, newY] = [dy, -dx + dimension - 1];
    } else if (mode === 2) {
      // 90° counterclockwise
      [newX, newY] = [-dy + dimension - 1, dx];
    } else if (mode === 3) {
      // Flip horizontally (mirror x across anchor)
      coords[i].x = 2 * anchor.x - x + dimension - 1, dx;
      coords[i].y = y;
      continue;
    }

    // Translate back
    coords[i].x = newX + anchor.x;
    coords[i].y = newY + anchor.y;
  }
}

// bus = {
//     board: {},
//     keystate: {}
// }

function amp(num) {
    // size = 16;
    return num * 16;
}

function drawpixel(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, amp(1), amp(1));
}

function randint(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function unblurprint(ctx, string, x, y, spacing = 8) {
    for (let t = 0; t < string.length; t++) {
        ctx.fillText(string[t], x + (t * spacing), y);
    }
}

function fixed_6_digit(number) {
    const numberStr = number.toString();
    return numberStr.padStart(6, '0');
}

function drawText(text, x, y, color = "white", font = "16px 'Press-Start-2P") {
        // ctx.save();
        ctx.font = font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        // ctx.fillText(text, x, y);
        unblurprint(ctx, text, x, y, 16);
        // ctx.restore();
}


class Tileset {
    constructor(image, tileWidth, tileHeight) {
        this.image = image;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;

        this.tilesPerRow = Math.floor(this.image.width / this.tileWidth);
    }

    draw(ctx, tileIndex, dx, dy, dw = this.tileWidth, dh = this.tileHeight ) {
        const sx = (tileIndex % this.tilesPerRow) * this.tileWidth;
        const sy = Math.floor(tileIndex / this.tilesPerRow) * this.tileHeight;

        ctx.drawImage( this.image, sx, sy, this.tileWidth, this.tileHeight, dx, dy, dw, dh);
    }
}

class KeyState {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        this.holdtimer = 5;
        this.timerspeed = 5;

        // Listen for key events
        window.addEventListener("keydown", (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.code] = false;
        });
    }

    // Call this at the start of every frame/update
    update() {
        this.prevKeys = { ...this.keys };
    }

    isPressed(key) {
        return this.keys[key] && !this.prevKeys[key];
    }

    isHold(key) {
        if (!this.keys[key]) {
            if (this.prevKeys[key]) this.holdtimer = this.timerspeed;
            return false;
        }

        if (this.holdtimer > 0) {
            this.holdtimer -= 1;
            return this.isPressed(key);
        } else {
            return this.keys[key];
        }
    }

    isDown(key) {
        return this.keys[key];
    }

    isReleased(key) {
        return !this.keys[key] && this.prevKeys[key];
    }
}

class TetrisBoard {
    constructor(width, height) {
        this.gridW = width;
        this.gridH = height;
        this.width = amp(width);
        this.height = amp(height);

        this.sideinfostart = width;
        this.informations = {
            score: 0,
            nextpiece: {},
            status: false,
        };
        this.lastname = "";
        this.togglechange = false;

        this.grid = Array.from({ length: width }, () =>
            Array.from({ length: height }, () => "#000000")
        );
    }

    init() {
        for (let x = 0; x < 6; x++) {
            for (let y = 0; y < this.gridH; y++) {
                tileset.draw(ctx, 0, amp(this.sideinfostart + x), amp(y));
            }
        }
    } 

    draw() {
        // draw board
        for (let x = 0; x < board.gridW; x++) {
            for (let y = 0; y < board.gridH; y++) {
                // drawpixel(amp(x), amp(y), board.grid[x][y]);
                tileset.draw(ctx, COL.indexOf(board.grid[x][y]), amp(x), amp(y));
            }
        } 

        // draw info
        if (this.togglechange) {
            for (let x = 0; x < 4; x++) {
                for (let y = 0; y < 4; y++) {
                    drawpixel(amp(this.sideinfostart + 1 + x), amp(y + 1), "#000000");
                }
            }

            this.displaytet({x: this.sideinfostart + 1, y: 1});
            this.togglechange = false;
        }

        // score
        for (let x = 0; x < 6; x++) {
            drawpixel(amp(this.sideinfostart + x), amp(6), "#000000");
        }
            
        drawText(fixed_6_digit(this.informations.score), amp(this.sideinfostart), amp(6.5));

        //status
        for (let x = 0; x < 4; x++) {
            drawpixel(amp(this.sideinfostart + x + 1), amp(8), "#000000");
            drawpixel(amp(this.sideinfostart + x + 1), amp(9), "#000000");
        }
        
        if (this.informations.status) {
            drawText("GAME", amp(this.sideinfostart + 1), amp(8.5));
            drawText("OVER", amp(this.sideinfostart + 1), amp(9.5));
        }
    }

    displaytet(anchor) {
        if (this.informations.nextpiece.size == 3) {
            anchor.x += 0.5;
            anchor.y += 0.5;
        }
        var source = this.informations.nextpiece.IRC;
        const sourceWidth = source.length;
        const sourceHeight = source[0].length;

        for (let x = 0; x < sourceWidth; x++) {
            for (let y = 0; y < sourceHeight; y++) {
                const targetX = anchor.x + x;
                const targetY = anchor.y + y;

                if (source[x][y] != "#000000") {
                    tileset.draw(ctx, COL.indexOf(source[x][y]), amp(targetX), amp(targetY));
                }
            }
        }

    }
}


class Game {
    constructor(board) {
        this.currentblock = {};

        // the smaller, the faster
        this.delaytimer = 20;
        this.updatespeed = 20;
        this.tetroarray = [tetrominos.I, tetrominos.J, tetrominos.L, tetrominos.O, 
                                tetrominos.S, tetrominos.T, tetrominos.Z];
        this.board = board;
        this.groundtimer = 10;
        this.grounded = false;
        this.shifttrigger = false;
        this.shiftdelay = 5;
        this.shiftvalues = [];
        this.nextpiece = {};

        this.level = 0;
        this.lose = false;

        this.directions = [
            { dx:  1, dy:  0 }, { dx:  1, dy:  1 }, 
            { dx:  0, dy:  1 }, { dx: -1, dy:  1 }, 
            { dx: -1, dy:  0 }, { dx: -1, dy: -1 },
            { dx:  0, dy: -1 }, { dx:  1, dy: -1 },

            // { dx:  0, dy: -2 }, { dx:  0, dy:  2 },
            { dx: -2, dy:  0 }, { dx:  2, dy:  0 },
            { dx: -1, dy: -2 }, { dx: -1, dy:  2 },
            { dx:  1, dy: -2 }, { dx:  1, dy:  2 },
            
            { dx: -2, dy: -1 }, { dx:  2, dy: -1 }, 
            { dx: -2, dy:  1 }, { dx:  2, dy:  1 },
            // { dx: -2, dy: -2 }, { dx: -2, dy:  2 },
            // { dx:  2, dy: -2 }, { dx:  2, dy:  2 },
            
        ];
    }

    init() {
        this.board.init();

        this.currentblock = {
            position: {x: randint(0, this.board.gridW - 4), y: 0},
            prevpost: {x: -1, y: -1},
            tetromino: this.getRandTet(),
            activesquares: [], 
        };

        this.board.togglechange = true;
        this.nextpiece = this.getRandTet();
        this.board.lastname = this.currentblock.tetromino.name;
        this.board.informations.nextpiece = this.nextpiece;
        this.build();
    }

    build() {
        this.currentblock.activesquares = [];
        var source = this.currentblock.tetromino.IRC;  
        const targetWidth = this.board.grid.length;
        const targetHeight = this.board.grid[0].length;
        const sourceWidth = source.length;
        const sourceHeight = source[0].length;

        // this.currentblock.activesquares.forEach(point => {
        //     this.board.grid[point.x][point.y] = "#000000";
        // });

        for (let x = 0; x < sourceWidth; x++) {
            for (let y = 0; y < sourceHeight; y++) {
                const targetX = this.currentblock.position.x + x;
                const targetY = this.currentblock.position.y + y;

                // Only insert if within bounds
                if (targetX >= 0 && targetX < targetWidth && targetY >= 0 && targetY < targetHeight) {
                    if (source[x][y] != "#000000") {
                        this.currentblock.activesquares.push({x: targetX, y: targetY});
                    }
                }
            }
        }

        if (this.validrotation(this.currentblock.activesquares, 0, 1)) {
            this.lose = true;
            this.board.informations.status = true;
            return;
        }
    }

    update(keystate) {
        if (this.lose) {
            return;
        };
        
        var dx = 0;
        var dy = 0;

        if (this.shifttrigger) {
            if (this.shiftdelay < 1) {
                this.shift();
                this.shifttrigger = false;
                this.shiftdelay = 5;
            } else {
                this.shiftdelay -= 1;
            }
        }
        
        if (this.delaytimer > 0) {
            this.delaytimer -= 1;
        } else {
            if (this.grounded && this.specificgroundcheck(0, 1) && !this.shifttrigger) {                
                this.clear();
                this.getNewTet();
                this.grounded = false;
                this.board.togglechange = true;

                this.board.informations.nextpiece = this.nextpiece;
            } else {
                if (dy == 0) {
                    dy += 1;
                }
            }
            this.delaytimer = this.updatespeed;
        }
        
        if (keystate.isPressed('Space')) {
            this.rotate(2);
            // console.log(this.rotate(1))
        }
        if (keystate.isHold('ArrowLeft')) {
            dx -= 1;
        }
        if (keystate.isHold('ArrowRight')) {
            dx += 1;
        }
        if (keystate.isHold('ArrowDown')) {
            if (!this.grounded) {
                if (dy == 0) {
                    dy += 1;
                    this.delaytimer = this.updatespeed;
                }
            } else {
                // this.delaytimer = 0;
            }
        }



        this.update_pos(dx, dy);

        this.display_block();

        this.currentblock.prevpost = {...this.currentblock.position};
        
    }

    draw() {
        this.board.draw();
    }


    display_block() {
        this.currentblock.activesquares.forEach(point => {
            this.board.grid[point.x][point.y] = this.currentblock.tetromino.color;
        });
    }

    update_pos(dx, dy) {
        if (dx == 0 && dy == 0) return;
        // if (this.border_check(dx, dy)) return;
        // if (this.intersect(dx, dy)) return;
        const dd = {dx: dx, dy: dy};
        this.border_check(dd);
        this.intersect(dd)
        
        this.currentblock.position.x += dd.dx;
        this.currentblock.position.y += dd.dy;

        this.currentblock.activesquares.forEach(point => {
            this.board.grid[point.x][point.y] = "#000000";
            point.x += dd.dx;
            point.y += dd.dy;
        });
        
    }

    specificgroundcheck(dx, dy) {
        const clone = structuredClone(this.currentblock.activesquares);
        const clone2 = structuredClone(this.currentblock.activesquares);

        for (let i = 0; i < clone.length; i++) {
            clone[i].x += dx;
            clone[i].y += dy;

            if (clone[i].y + 1 >= this.board.gridH) {
                return true;
            }

        }

        for (let i = 0; i < clone2.length; i++) {
            clone2[i].x += dx;
            clone2[i].y += dy;

            var overlap = false;
            overlap = this.currentblock.activesquares.some(point => point.x == clone2[i].x && point.y == clone2[i].y);
            
            if (!overlap) {
                if (this.board.grid[clone2[i].x][clone2[i].y] != "#000000") {
                    if (dy != 0) {
                        return true;
                    } 
                }
            }
        }

        return false
    }

    border_check(dd) {
        const clone = structuredClone(this.currentblock.activesquares);

        for (let i = 0; i < clone.length; i++) {
            clone[i].x += dd.dx;
            clone[i].y += dd.dy;

            if (clone[i].y >= this.board.gridH) {
                this.grounded = true;
                dd.dy = 0;
            }

            if (clone[i].x >= this.board.gridW || clone[i].x < 0) {
                dd.dx = 0;
                return true;
            }
        }
        return false;
    }

    intersect(dd) {
        const clone = structuredClone(this.currentblock.activesquares);

        for (let i = 0; i < clone.length; i++) {
            clone[i].x += dd.dx;
            clone[i].y += dd.dy;

            var overlap = false;
            overlap = this.currentblock.activesquares.some(point => point.x == clone[i].x && point.y == clone[i].y);
            
            if (!overlap) {
                if (this.board.grid[clone[i].x][clone[i].y] != "#000000") {
                    if (dd.dy != 0) {
                        this.grounded = true;
                        dd.dy = 0;
                    } else {
                        this.grounded = false;
                    }
                    dd.dx = 0;
                    return true;
                }
            }
        }
        return false;
    }

    validrotation(clo, dx, dy) {
        const clone = structuredClone(clo);
        const clone2 = structuredClone(clo);

        for (let i = 0; i < clone.length; i++) {
            clone[i].x += dx;
            clone[i].y += dy;

            if (clone[i].x >= this.board.gridW || clone[i].x < 0 || clone[i].y + 1 >= this.board.gridH) {
                return true;
            }
        }
        
        for (let i = 0; i < clone2.length; i++) {
            clone2[i].x += dx;
            clone2[i].y += dy;

            var overlap = false;
            overlap = this.currentblock.activesquares.some(point => point.x == clone2[i].x && point.y == clone2[i].y);
            
            if (!overlap) {
                if (this.board.grid[clone2[i].x][clone2[i].y] != "#000000") {
                    return true;
                }
            }
        }
        return false
    }

    rotate(mode) {
        if (this.currentblock.tetromino.color == "#FFFF00") return true;

        const clone = structuredClone(this.currentblock.activesquares);
        rotate_matrix(clone, this.currentblock.position, this.currentblock.tetromino.size, mode);


        var validation = false;
        var correction = {dx:0, dy:0};
        
        if (this.validrotation(clone, correction.dx, correction.dy)) {
            var ittt = 7;
            
            if (this.currentblock.tetromino.color == "#00FFFF") {
                ittt = this.directions.length;
            }

            for (let i = 0; i < ittt; i++) {
                if (!this.validrotation(clone, this.directions[i].dx, this.directions[i].dy)) {
                    validation = true;
                    correction.dx = this.directions[i].dx;
                    correction.dy = this.directions[i].dy;
                    break;
                } 
            }
        } else {
            validation = true;
        }

        if (!validation) {
            return false;
        }
        
        this.currentblock.activesquares.forEach(point => {
            this.board.grid[point.x][point.y] = "#000000";
        });

        rotate_matrix(this.currentblock.activesquares, this.currentblock.position, this.currentblock.tetromino.size, mode);
        
        this.currentblock.position.x += correction.dx;
        this.currentblock.position.y += correction.dy;

        this.currentblock.activesquares.forEach(point => {
            point.x += correction.dx;
            point.y += correction.dy;
        });

        if (!this.specificgroundcheck(0, 1)) this.grounded = false;

        return true;
    }

    shift() {
        this.currentblock.activesquares.forEach(point => {
            this.board.grid[point.x][point.y] = "#000000";
        });

        this.shiftvalues.forEach(vert => {
            for (let x = 0; x < 10; x++) {
                this.board.grid[x].splice(vert, 1);
                this.board.grid[x].unshift("#000000");
            } 
        });

        switch (this.shiftvalues.length) {
            case 1:
                this.board.informations.score += (40 * (this.level + 1));
                break;
        
            case 2:
                this.board.informations.score += (100 * (this.level + 1));
                break;
        
            case 3:
                this.board.informations.score += (300 * (this.level + 1));
                break;
        
            case 4:
                this.board.informations.score += (1200 * (this.level + 1));
                break;
        
            default:
                break;
        }

        this.display_block();
        this.shiftvalues.length = 0;
    }

    clear() {
        for (let y = 0; y < this.board.gridH; y++) {
            var trust = true;
            for (let x = 0; x < this.board.gridW; x++) {
                if (this.board.grid[x][y] == "#000000") {
                    trust = false;
                }
            }

            if (trust) {
                this.shifttrigger = true;
                this.shiftvalues.push(y);
                for (let a = 0; a < this.board.gridW; a++) {
                    this.board.grid[a][y] = "#000000";
                }
            }
        }
    }

    getRandTet() {
        return this.tetroarray[Math.floor(Math.random() * this.tetroarray.length)];
    }

    getNewTet() {
        this.currentblock.position = {x: randint(0, this.board.gridW - 4), y: 0};
        this.currentblock.prevpost = {x: -1, y: -1};
        this.currentblock.tetromino = this.nextpiece; 

        this.board.lastname = this.currentblock.tetromino.name;
        this.nextpiece = this.getRandTet();
        this.grounded = false;
        this.build()
        
        // if (this.intersect(this.currentblock.tetromino.IRC, this.currentblock.position)) {
        //     this.lose = true;
        //     alert("game over");
        // }
    }
}


// main code
const keystate = new KeyState();
const board = new TetrisBoard(10, 20);
const game = new Game(board);

let lastTime = 0;
let isPaused = false;
let pauseonce = true;
let frame = 0;
const fps = 30;
const frameDuration = 1000 / fps;

function gameLoop(timestamp) {
    if(keystate.keys['Escape'] && pauseonce) {
        isPaused = !isPaused;
        pauseonce = false;
    } else if (!keystate.keys['Escape']) {
        pauseonce = true;
    }

    if (isPaused) {
        drawText("PAUSE", canvas.width / 3 - 16, canvas.height / 2);
    } 

    if (timestamp - lastTime >= frameDuration && !isPaused) {
        lastTime = timestamp;

        // clear
        // ctx.fillStyle = 'black';
        // ctx.fillRect(0, 0, canvas.width, canvas.height);

        //update
        game.update(keystate);
        keystate.update();
        
        //draw
        game.draw();


        // drawGrid(16, frame);
        frame += 1;
    }
 

    requestAnimationFrame(gameLoop);
}


const tilesetImage = new Image();
tilesetImage.src = "img/tileset.png";
const myFont = new FontFace('Press-Start-2P', 'url(PressStart2P-Regular.ttf)');

tilesetImage.onload = () => {
    myFont.load().then(function(font){
        document.fonts.add(font);
        console.log('Font loaded');
        tileset = new Tileset(tilesetImage, 16, 144);
        game.init();
        requestAnimationFrame(gameLoop);
    });	


};


