declare const createjs: any;
interface Window {
    stage: any;
    controller: any;
}
const generateID = () => Math.random().toString(36).substr(2,8);
const startGame = async () => {
    const stage = new createjs.Stage("GameDisplay");
    const controller = new MainController(stage);
    controller.ready?.();
    createjs.Ticker.setFPS(144);
    createjs.Ticker.addEventListener("tick", () => {
        stage.update();
        controller.update?.();
    });
    (document.querySelector('#GameDisplay') as HTMLCanvasElement).width = window.innerWidth;
    (document.querySelector('#GameDisplay') as HTMLCanvasElement).height = window.innerHeight;
    
    window.stage = stage;
    window.controller = controller;
    window.addEventListener('resize', () => {
        (document.querySelector('#GameDisplay') as HTMLCanvasElement).width = window.innerWidth;
        (document.querySelector('#GameDisplay') as HTMLCanvasElement).height = window.innerHeight;
        controller.onResize?.();
    });;
};
document.querySelector('.play')?.addEventListener('click', async (e: Event) => {
    const animate = (element: Element | HTMLElement, keyframes: any[], options: any) => {
        return new Promise(resolve => {
            const anim = element.animate(keyframes, options);
            const interval = setInterval(() => {
                if(anim.playState == 'finished') {
                    if(options.preventReset) 
                        Object.keys(keyframes[keyframes.length - 1]).forEach(l => {
                            (element as HTMLElement).style.setProperty(l, keyframes[keyframes.length - 1][l])
                        });
                    clearInterval(interval);
                    setTimeout(resolve, 10);
                }
            }, 0);
        });
    }
    await animate(document.querySelector('.main') as Element, [
        { opacity: 1.0 },
        { opacity: 0.0 }
    ], {
        duration: 500,
        preventReset: true
    });
    (document.querySelector('.game') as HTMLElement).style.setProperty('display', 'block');
    startGame();
});