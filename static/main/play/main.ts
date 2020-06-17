//#region enum, interface declation
const { DisplayObject } = createjs;
DisplayObject.prototype.zIndex = 0;
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
const enum ItemType {
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
    BOX,
    BROKENBOX
}
interface Item {
    count: number;
    type: ItemType;
    slot: Slot;
    meta?: any;
}
interface Player {
    body: any;
    hands: any;
    items: Map<Slot, Item>;
}
enum ZIndex {
    PLAYERBODY = 1000,
    PLAYERHANDS = 1001,
    BOX = 901,
    BROKENBOX = 900,
    PARTICLE = 9000,
    BACKGROUND = 0
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
    private allowedMoveDirectionsReach: {
        w: boolean;
        a: boolean;
        s: boolean;
        d: boolean;
    } = { w: true, a: true, s: true, d: true };
    private allowedMoveDirectionsTemp: string[] = [];
    private allowedMoveDirectionsTempReach: string[] = [];
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
        this.stage.addChild_ = this.stage.addChild;
        this.stage.addChild = ((c: any) => {
            this.stage.addChild_(c);
            this.stage.sortChildren((a: any, b: any) => a.zIndex - b.zIndex);
        }).bind(this);
        this.player.body.zIndex = ZIndex.PLAYERBODY;
        this.player.hands.zIndex = ZIndex.PLAYERHANDS;
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
        this.backgroundLine.zIndex = ZIndex.BACKGROUND;
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
        const cCheck = (children: any, additionalReach: number = 0) => this.checkCollision({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            width: 80,
            height: 80
        }, {
            x: children.x - (children.getTransformedBounds().width / 2) + 40,
            y: children.y - (children.getTransformedBounds().height / 2) + 40,
            width: children.image.width * children.scaleX + additionalReach,
            height: children.image.height * children.scaleY + additionalReach
        });
        let collisions: string[] = [];
        let _collisions: string[] = [];
        this.stage.children.forEach((boxObj: any, j: number) => {
            if(boxObj.objType != ObjectType.BOX) return;
            let r = cCheck(boxObj);
            if(r.c) {
                this.collisedBox = boxObj;
                if(r.w) {
                    this.allowedMoveDirections.w = false;
                    collisions.push('w');
                }
                if(r.a) {
                    this.allowedMoveDirections.a = false;
                    collisions.push('a');
                }
                if(r.s) {
                    this.allowedMoveDirections.s = false;
                    collisions.push('s');
                }
                if(r.d) {
                    this.allowedMoveDirections.d = false;
                    collisions.push('d');
                }
            } else {
                this.allowedMoveDirections = {
                    w: !collisions.includes('w'),
                    a: !collisions.includes('w'),
                    s: !collisions.includes('w'),
                    d: !collisions.includes('w')
                }
            }
            collisions = collisions.reduce((a: Array<string>, b: string): Array<string> => {
                if(!a.includes(b)) a.push(b);
                return a;
            }, []);

            let _r = cCheck(boxObj);
            if(_r.c) {
                this.collisedBox = boxObj;
                if(_r.w) {
                    this.allowedMoveDirectionsReach.w = false;
                    _collisions.push('w');
                }
                if(_r.a) {
                    this.allowedMoveDirectionsReach.a = false;
                    _collisions.push('a');
                }
                if(_r.s) {
                    this.allowedMoveDirectionsReach.s = false;
                    _collisions.push('s');
                }
                if(_r.d) {
                    this.allowedMoveDirectionsReach.d = false;
                    _collisions.push('d');
                }
            } else {
                this.allowedMoveDirectionsReach = {
                    w: !_collisions.includes('w'),
                    a: !_collisions.includes('w'),
                    s: !_collisions.includes('w'),
                    d: !_collisions.includes('w')
                }
            }
            _collisions = _collisions.reduce((a: Array<string>, b: string): Array<string> => {
                if(!a.includes(b)) a.push(b);
                return a;
            }, []);
        });
    }

    private registerSounds() {
        createjs.Sound.registerSound('/static/assets/sounds/punch.mp3', 'punch');
        createjs.Sound.registerSound('/static/assets/sounds/boxhit.mp3', 'boxHit');
        createjs.Sound.registerSound('/static/assets/sounds/boxbreak.mp3', 'boxBreak');
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
        this.stage.children.filter((c: any) => c.isNotFixed == true).forEach((c: any) => {
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
            ((!this.allowedMoveDirectionsReach['w'] && this.lookingDirection == 'w') ||
            (!this.allowedMoveDirectionsReach['a'] && this.lookingDirection == 'a') ||
            (!this.allowedMoveDirectionsReach['s'] && this.lookingDirection == 's') ||
            (!this.allowedMoveDirectionsReach['d'] && this.lookingDirection == 'd')) && this.collisedBox
        ) {
            this.playSound('boxHit', .2);
            this.collisedBox.health -= 1;
            this.collisedBox.scale -= 0.04;
            if(this.collisedBox.health == 1) {
                const brokenBoxImage = new createjs.Bitmap('/static/assets/images/brokenPlanks.png');
                brokenBoxImage.offset = {
                    x: this.collisedBox.offset.x,
                    y: this.collisedBox.offset.y
                }
                brokenBoxImage.visible = false;
                brokenBoxImage.scale = 0.4;
                brokenBoxImage.alpha = 0.7;
                brokenBoxImage.objType = ObjectType.BROKENBOX;
                brokenBoxImage.isNotFixed = true;
                brokenBoxImage.zIndex = ZIndex.BROKENBOX;
                brokenBoxImage.image.onload = () => {
                    brokenBoxImage.regX = brokenBoxImage.image.width / 2;
                    brokenBoxImage.regY = brokenBoxImage.image.height / 2;
                    this.stage.addChild(brokenBoxImage);
                    setTimeout(() => {
                        brokenBoxImage.visible = true;
                    }, 50);
                }
            } else if (this.collisedBox.health > 0) {
                const particle = new createjs.Bitmap('/static/assets/images/particles/brokenPlank.png');
                particle.scale = 0.3;
                particle.x = (-1 * this.playerX) + this.collisedBox.offset.x;
                particle.y = this.playerY + this.collisedBox.offset.y;
                particle.zIndex = ZIndex.PARTICLE;
                particle.image.onload = () => {
                    particle.regX = particle.image.width / 2;
                    particle.regY = particle.image.height / 2;
                    const normalizedX: number = Math.floor(Math.random() * 2) * 2 - 1;
                    const r: number = Math.random() * 360;
                    const p = {
                        x: particle.x,
                        y: particle.y
                    }
                    if(['w','s'].includes(this.lookingDirection)) {
                        createjs.Tween
                            .get(particle)
                            .to({ 
                                x: p.x + (normalizedX * (Math.floor(Math.random() * (50 - 30)) + 30)), 
                                y: this.lookingDirection == 'w' ? p.y + 100 : p.y - 100, 
                                rotation: r, 
                                alpha: 0 
                            }, 500, createjs.Ease.sineOut)
                            .call(() => {
                                this.stage.removeChildAt(this.stage.children.map((c: any) => c.id).indexOf(particle.id));
                            });
                        this.stage.addChild(particle);
                    } else {
                        createjs.Tween
                            .get(particle)
                            .to({ 
                                x: this.lookingDirection == 'a' ? p.x + 100 : p.x - 100, 
                                y: p.y + (normalizedX * (Math.floor(Math.random() * (50 - 30)) + 30)), 
                                rotation: r, 
                                alpha: 0 
                            }, 500, createjs.Ease.sineOut)
                            .call(() => {
                                this.stage.removeChildAt(this.stage.children.map((c: any) => c.id).indexOf(particle.id));
                            });
                        this.stage.addChild(particle);
                    }
                }
            } else if (this.collisedBox.health <= 0) {
                this.playSound('boxBreak', .2);
                const img = new Image();
                img.onload = () => {
                    const { x, y } = this.collisedBox.offset;
                    for(let i = 0; i < 5; i++) {
                        const brokenPlankFragment = new createjs.Bitmap(img);
                        brokenPlankFragment.regX = brokenPlankFragment.image.width / 2;
                        brokenPlankFragment.regY = brokenPlankFragment.image.height / 2;
                        brokenPlankFragment.scale = 0.3;
                        brokenPlankFragment.zIndex = ZIndex.PARTICLE;
                        brokenPlankFragment.offset = {
                            x: x,
                            y: y
                        }
                        brokenPlankFragment.isNotFixed = true;
                        brokenPlankFragment.x = brokenPlankFragment.offset.x + (-1 * this.playerX);
                        brokenPlankFragment.y = brokenPlankFragment.offset.y + this.playerY;
                        const r: number = Math.random() * 360;
                        const [ px, py ] = [ brokenPlankFragment.offset.x, brokenPlankFragment.offset.y ];
                        const [ tx, ty ] = [
                            (Math.floor(Math.random() * 2) * 2 - 1 /* normalized */) * (Math.floor(Math.random() * 100)),
                            (Math.floor(Math.random() * 2) * 2 - 1 /* normalized */) * (Math.floor(Math.random() * 100))
                        ];
                        createjs.Tween
                            .get({
                                x: px,
                                y: py,
                                alpha: 1,
                                rotation: 0
                            })
                            .to({
                                x: px + tx,
                                y: py + ty,
                                alpha: 0.8,
                                rotation: r
                            }, 300, createjs.Ease.sineInOut)
                            .call(() => {
                                createjs.Tween
                                    .get(brokenPlankFragment)
                                    .to({
                                        alpha: 0
                                    }, 300, createjs.Ease.sineIn)
                                    .call(() => {
                                        this.stage.removeChildAt(this.stage.children.map((c: any) => c.id).indexOf(brokenPlankFragment.id));
                                    })
                            })
                            .on('change', function(this: any) {
                                brokenPlankFragment.offset.x = this.target.x;
                                brokenPlankFragment.offset.y = this.target.y;
                                brokenPlankFragment.alpha = this.target.alpha;
                                brokenPlankFragment.rotation = this.target.rotation;
                            })
                        this.stage.addChild(brokenPlankFragment);
                    }
                    this.stage.removeChildAt(this.stage.children.map((c: any) => c.id).indexOf(this.collisedBox.id));
                    this.allowedMoveDirections = { w: true, a: true, s: true, d: true };
                    this.collisedBox = null;
                }
                img.src = '/static/assets/images/brokenPlankSingle.png';
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

    private checkCollision(rectA: {
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
        const [ a, b, c, d, e ]: Array<boolean | string[]> = [
            rectA.x <= rectB.x + rectB.width,
            rectA.x + rectA.width >= rectB.x,
            rectA.y <= rectB.y + rectB.height,
            rectA.y + rectA.height >= rectB.y,
            []
        ]
        if(a && b && c && d) {
            if((rectA.y + rectA.height) - this.moveSpeed < rectB.y) (e as string[]).push('s');
            if(rectA.y > (rectB.y + rectB.height) - this.moveSpeed) (e as string[]).push('w');
            if((rectA.x + rectA.width) - this.moveSpeed < rectB.x) (e as string[]).push('d');
            if(rectA.x > (rectB.x + rectB.width) - this.moveSpeed) (e as string[]).push('a');
        }

        return {
            c: (a && b && c && d) as boolean,
            w: (e as string[]).includes('w'),
            a: (e as string[]).includes('a'),
            s: (e as string[]).includes('s'),
            d: (e as string[]).includes('d')
        };
    }

    private async createBoxes() {
        const boxImage = await this.loadImage('/static/assets/images/box.png');
        const createBox = () => {
            const box = new createjs.Bitmap(boxImage);
            box.scale = 0.4;
            box.isNotFixed = true;
            box.regX = boxImage.width / 2;
            box.regY = boxImage.height / 2;
            box.health = 4;
            box.objType = ObjectType.BOX;
            box.offset = {};
            box.zIndex = ZIndex.BOX;
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