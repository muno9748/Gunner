//#region enum, interface declation
const enum Slot {
    MAINGUN,
    SUBGUN,
    HAND,
    BOMB,
    HELMET,
    SCOPE,
    VEST,
    BULLET_9,
    BULLET_7_62,
    BULLET_5_56,
    BULLET_12GAUGE,
    MEDICAL_BANDAGE,
    MEDICAL_HEALTHKIT,
    MEDICAL_SODA,
    MEDICAL_PAINKILLER
}
const enum ObjectType {
    BOX
}
interface Item {
    count: number;
    name: string;
    slot: Slot;
    meta?: any;
}
interface Player {
    body: any;
    hands: any;
    items: Map<Slot, Item>;
}
// #endregion
class MainController {
    readonly backgroundLineSize: number = 500;
    readonly moveSpeed: number = 8;

    private stage: any;

    private pressedKeys: any;
    
    private playerX: number = 0;
    private playerY: number = 0;
    private isClicked: boolean = false;
    private allowedMoveDirections: {
        w: boolean;
        a: boolean;
        s: boolean;
        d: boolean;
    } = { w: true, a: true, s: true, d: true };
    private allowedMoveDirectionsTemp: string[] = [];
    private lookingDirection: string = '';
    private collisedBox: any;
    
    private backgroundLine: any;
    private player: Player;

    constructor(stage: any) {
        this.stage = stage;
        this.player = {
            body: new createjs.Shape(),
            hands: new createjs.Container(),
            items: new Map<Slot, Item>()
        }
    }

    public onResize() {
        if(this.player.body) {
            this.player.body.x = this.player.hands.x = window.innerWidth / 2;
            this.player.body.y = this.player.hands.y = window.innerHeight / 2;
            this.player.hands.children[0].x = 30;
            this.player.hands.children[0].y = 30;
            this.player.hands.children[1].x = -30;
            this.player.hands.children[1].y = 30;
        }
    }

    public ready() {
        (<HTMLElement> document.querySelector('title')).innerText = 'Gunner - Playing';
        this.registerSounds();
        let graphics;

        // Create Background Line
        this.backgroundLine = new createjs.Shape();
        this.backgroundLine.alpha = 0.5;
        this.pressedKeys = {
            w: false,
            s: false,
            a: false,
            d: false
        };
        this.stage.addChild(this.backgroundLine);

        // On Move Controller
        document.addEventListener('keydown', this.onKeyDown.bind(this), false);
        document.addEventListener('keyup', ((e: KeyboardEvent) => {
            if(!Object.keys(this.pressedKeys).includes(e.key.toLowerCase())) return;
            this.pressedKeys[e.key.toLowerCase()] = false;
        }).bind(this), false);
        
        // Create Player Body
        graphics = this.player.body.graphics;
        graphics.beginFill('#f8c574');
        if(this.player.items.get(Slot.VEST)) graphics.setStrokeStyle(5).beginStroke('#000000')
        graphics.drawCircle(0, 0, 40);
        this.stage.addChild(this.player.body);
        
        // Create Player Hands
        this.player.hands.addChild(new createjs.Shape(), new createjs.Shape());
        graphics = this.player.hands.children[0].graphics;
        graphics.setStrokeStyle(5).beginFill('#f8c574').beginStroke('#332d22').drawCircle(0, 0, 12);
        graphics = this.player.hands.children[1].graphics;
        graphics.setStrokeStyle(5).beginFill('#f8c574').beginStroke('#332d22').drawCircle(0, 0, 12);
        this.stage.addChild(this.player.hands);
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('click', this.onMouseClick.bind(this));
        
        // Create Boxes
        this.createBoxes();

        // On Move Controller
        this.move();
    }

    public update() {
        this.backgroundLine.graphics.clear();
        const graphic = this.backgroundLine.graphics.beginStroke('#555555');
        for(let i = 0; i < Math.ceil(window.innerWidth / this.backgroundLineSize) + 2; i++) {
            for(let j = 0; j < Math.ceil(window.innerHeight / this.backgroundLineSize) + 2; j++) {
                graphic.drawRect(
                    (i * this.backgroundLineSize) - this.backgroundLineSize + (
                        -1 * (
                            this.playerX - (
                                Math.round(this.playerX / this.backgroundLineSize) * this.backgroundLineSize
                            )
                        )
                    ), 
                    (j * this.backgroundLineSize) - this.backgroundLineSize + this.playerY - (
                        Math.round(this.playerY / this.backgroundLineSize) * this.backgroundLineSize
                    ), 
                    this.backgroundLineSize, 
                    this.backgroundLineSize
                );
            }
        }
        const cCheck = (children: any) => this.collisionCheck({
            x: this.player.body.x,
            y: this.player.body.y,
            width: 80,
            height: 80
        }, {
            x: children.getTransformedBounds().x + 40,
            y: children.getTransformedBounds().y + 40,
            width: children.getTransformedBounds().width,
            height: children.getTransformedBounds().height
        });
        let collisions: string[] = [];
        this.stage.children.forEach((boxObj: any, j: number) => {
            if(boxObj.objType != ObjectType.BOX) return;
            const i: number = boxObj.id_;
            let c = cCheck(boxObj);
            if(!c.isCollision) {
                this.allowedMoveDirections = { 
                    w: !collisions.includes('w'), 
                    a: !collisions.includes('a'), 
                    s: !collisions.includes('s'), 
                    d: !collisions.includes('d') 
                };
                this.allowedMoveDirectionsTemp[i] = ['s', 'w', 'd', 'a'][c.abcd.indexOf(true)];
            } else {
                if(this.allowedMoveDirectionsTemp[i] == 'w') {
                    collisions.push('w');
                    this.collisedBox = boxObj;
                    this.allowedMoveDirections.w = false;
                } else if(this.allowedMoveDirectionsTemp[i] == 's') {
                    collisions.push('s');
                    this.collisedBox = boxObj;
                    this.allowedMoveDirections.s = false;
                } else if(this.allowedMoveDirectionsTemp[i] == 'a') {
                    collisions.push('a');
                    this.collisedBox = boxObj;
                    this.allowedMoveDirections.a = false;
                } else if(this.allowedMoveDirectionsTemp[i] == 'd') {
                    collisions.push('d');
                    this.collisedBox = boxObj;
                    this.allowedMoveDirections.d = false;
                }
            }
        });
    }

    private registerSounds() {
        createjs.Sound.registerSound("/static/assets/sounds/punch.mp3", 'punch');
        createjs.Sound.registerSound("/static/assets/sounds/boxhit.mp3", 'boxHit');
        createjs.Sound.registerSound("/static/assets/sounds/boxbreak.mp3", 'boxBreak');
    }

    private onKeyDown(e: KeyboardEvent) {
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

    private move() {
        requestAnimationFrame(this.move.bind(this));
        if(this.pressedKeys['w'] && this.allowedMoveDirections['w']) {
            this.playerY += this.moveSpeed;
        }
        if(this.pressedKeys['s'] && this.allowedMoveDirections['s']) {
            this.playerY -= this.moveSpeed;
        }
        if(this.pressedKeys['a'] && this.allowedMoveDirections['a']) {
            this.playerX -= this.moveSpeed;
        }
        if(this.pressedKeys['d'] && this.allowedMoveDirections['d']) {
            this.playerX += this.moveSpeed;
        }
        this.stage.children.filter((c: any) => c.isNotFixed).forEach((c: any) => {
            c.x = (-1 * this.playerX) + c.offset.x;
            c.y = (this.playerY) + c.offset.y;
        });
    }

    private onMouseMove(e: MouseEvent) {
        const r = Math.atan2(e.clientY - this.player.body.y, e.clientX - this.player.body.x);
        this.player.hands.rotation = ((180 / Math.PI) * r) - 90;
        {
            const normalized = Math.round(this.player.hands.rotation) / Math.abs(Math.round(this.player.hands.rotation));
            const r: number = normalized == -1 ? 360 + this.player.hands.rotation : this.player.hands.rotation;
            let d: string = '';
            if(this.player.hands.rotation > -45 && this.player.hands.rotation < 45) d = 's'; 
            if(r > 45 && r < 135) d = 'a'; 
            if(r > 135 && r < 225) d = 'w'; 
            if(r > 225 && r < 315) d = 'd';
            this.lookingDirection = d;
        }
    }

    private onMouseClick(e: MouseEvent) {
        if(this.isClicked) return;
        this.isClicked = true;
        let hand = this.player.hands.children[Math.round(Math.random())];
        let beforeX = hand.x;
        let beforeY = hand.y;
        let normalizedX = beforeX / 30;
        createjs.Tween
            .get(hand)
            .to({ x: normalizedX * 10, y: 60 }, 100, createjs.Ease.sineInOut)
            .to({ x: beforeX, y: beforeY }, 100, createjs.Ease.sineInOut)
            .call(() => {
                setTimeout(() => {
                    this.isClicked = false;
                },50);
            });
        this.playSound('punch', .6);
        if(
            ((!this.allowedMoveDirections['w'] && this.lookingDirection == 'w') ||
            (!this.allowedMoveDirections['a'] && this.lookingDirection == 'a') ||
            (!this.allowedMoveDirections['s'] && this.lookingDirection == 's') ||
            (!this.allowedMoveDirections['d'] && this.lookingDirection == 'd')) && this.collisedBox
        ) {
            this.playSound('boxHit', .2);
            this.collisedBox.damage += 1;
            this.collisedBox.scale -= 0.04;
            if(this.collisedBox.damage == 4) {
                this.playSound('boxBreak', .2);
                this.stage.removeChildAt(this.stage.children.map((c: any) => c.id).indexOf(this.collisedBox.id));
                this.allowedMoveDirections = { w: true, a: true, s: true, d: true };
            }
        }
    }

    private playSound(id: string, volume: number = 1) {
        createjs.Sound.volume = volume
        createjs.Sound.play(id);
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise(resolve => {
            const image = new Image();
            image.onload = () => {
                resolve(image);
            }
            image.src = src;
        });
    }

    private collisionCheck(rectA: {
        x: number;
        y: number;
        width: number;
        height: number;
    }, rectB: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) {
        return {
            isCollision: !(rectA.y + rectA.height < rectB.y || rectA.y > rectB.y + rectB.height || rectA.x + rectA.width < rectB.x || rectA.x > rectB.x + rectB.width),
            abcd: [
                (rectA.y + rectA.height < rectB.y),
                (rectA.y > rectB.y + rectB.height),
                (rectA.x + rectA.width < rectB.x),
                (rectA.x > rectB.x + rectB.width)
            ]
        };
    }

    private async createBoxes() {
        const boxImage = await this.loadImage('/static/assets/images/box.png');
        const plankImage = await this.loadImage('/static/assets/images/brokenPlanks.png');
        const createBox = () => {
            const box = new createjs.Bitmap(boxImage);
            box.scale = 0.4;
            box.isNotFixed = true;
            box.regX = boxImage.width / 2;
            box.regY = boxImage.height / 2;
            box.damage = 0;
            box.objType = ObjectType.BOX;
            box.offset = {};
            return box;
        }
        const generateBoxIDs = () => {
            this.stage.children.filter((c: any) => c.objType == ObjectType.BOX).forEach((c: any, i: number) => {
                c.id_ = i;
                this.allowedMoveDirectionsTemp.push('');
            });
        }
        const box = createBox();
        box.offset.x = 10;
        box.offset.y = 10;
        const box2 = createBox();
        box2.offset.x = 200;
        box2.offset.y = 200;
        this.stage.addChild(box);
        this.stage.addChild(box2);
        generateBoxIDs();
    }
}