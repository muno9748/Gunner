class MainController {
    stage: any;
    onResize?: Function;
    ready?: Function;
    backgroundLine: any;
    backgroundLineSize: number;
    playerX: number = 0;
    playerY: number = 0;
    moveSpeed: number = 8;
    pressedKeys: any;
    Key: any;

    constructor(stage: any) {
        this.stage = stage;
        this.backgroundLine = new createjs.Shape();
        this.backgroundLineSize = 500;
        this.backgroundLine.alpha = 0.5;
        this.pressedKeys = {
            w: false,
            s: false,
            a: false,
            d: false
        };
        this.stage.addChild(this.backgroundLine);
        document.addEventListener('keydown', this.onKeyDown.bind(this), false);
        document.addEventListener('keyup', ((e: KeyboardEvent) => {
            if(!Object.keys(this.pressedKeys).includes(e.key.toLowerCase())) return;
            this.pressedKeys[e.key.toLowerCase()] = false;
        }).bind(this), false);
        this.move();
    }

    update() {
        this.backgroundLine.graphics.clear();
        const graphic = this.backgroundLine.graphics.beginStroke('#555555');
        for(let i = 0; i < Math.ceil(window.innerWidth / this.backgroundLineSize) + 2; i++) {
            for(let j = 0; j < Math.ceil(window.innerHeight / this.backgroundLineSize) + 2; j++) {
                graphic.drawRect(
                    (i * this.backgroundLineSize) - this.backgroundLineSize + (-1 * (this.playerX - (Math.round(this.playerX / this.backgroundLineSize) * this.backgroundLineSize))), 
                    (j * this.backgroundLineSize) - this.backgroundLineSize + this.playerY - (Math.round(this.playerY / this.backgroundLineSize) * this.backgroundLineSize), 
                    this.backgroundLineSize, 
                    this.backgroundLineSize
                );
            }
        }
    }

    onKeyDown(e: KeyboardEvent) {
        if(!Object.keys(this.pressedKeys).includes(e.key.toLowerCase())) return;
        switch(e.key.toLowerCase()) {
            case 'w':
                this.pressedKeys[e.key.toLowerCase()] = true;
                break;
            case 's':
                this.pressedKeys[e.key.toLowerCase()] = true;
                break;
            case 'a':
                this.pressedKeys[e.key.toLowerCase()] = true;
                break;
            case 'd':
                this.pressedKeys[e.key.toLowerCase()] = true;
                break;
        }
    }

    move() {
        requestAnimationFrame(this.move.bind(this));
        if(this.pressedKeys['w']) {
            this.playerY += this.moveSpeed;
        }
        if(this.pressedKeys['s']) {
            this.playerY -= this.moveSpeed;
        }
        if(this.pressedKeys['a']) {
            this.playerX -= this.moveSpeed;
        }
        if(this.pressedKeys['d']) {
            this.playerX += this.moveSpeed;
        }
    }
}