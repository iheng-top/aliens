
class Location {
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }
}

class Elves extends Location {
    constructor(x, y) {
        super(x, y)
    }

    moveUp(dst, boundary = -Infinity) {
        if(this.y > boundary) {
            this.y -= dst
        }
    }

    moveDown(dst, boundary = Infinity) {
        if (this.y < boundary) {
            this.y += dst
        }
    }

    moveLeft(dst, boundary = -Infinity) {
        if (this.x > boundary) {
            this.x -= dst
        }
    }

    moveRight(dst, boundary = Infinity) {
        if (this.x < boundary) {
            this.x += dst
        }
    }
}

class Bullet extends Location {
    static v = 200
    constructor(x, y) {
        super(x, y)
    }

    moveUp(dst, boundary = -Infinity) {
        if(this.y > boundary) {
            this.y -= dst
        }
    }
}

class Alien extends Location {
    static v = 50
    constructor(x, y) {
        super(x, y)
    }

    moveDown(dst, boundary) {
        if (this.y < boundary) {
            this.y += dst
        }
    }
}

class Ship extends Elves {
    static v = 300
    constructor(x, y) {
        super(x, y)
    }
}


class AlienFramework {
    /** @type {HTMLCanvasElement} */
    static canvasNode = document.querySelector('#game-canvas')
    static painter = AlienFramework.canvasNode.getContext('2d')
    static images = {
        aliens: new Image(),
        ship: new Image(),
        bullet: new Image(),
        background: new Image()
    }
    /** @type {HTMLAudioElement} */
    static fightMusicNode = document.querySelector('#fight-mp3')
    /** @type {HTMLAudioElement} */
    static strikeMusicNode = document.querySelector('#strike-mp3')
    /** @type {HTMLAudioElement} */
    static blastMusicNode = document.querySelector('#blast-mp3')
    /** @type {HTMLButtonElement}*/
    static startBtn = document.querySelector('#start-btn')
    static isGameOver = false
    static animationFrameId = 0
    static keysDown = new Set()
    static then = null
    static ship = new Ship()
    static aliens = []
    static bullets = []
    static top = 0
    static bottom = 0
    static left = 0
    static right = 0
    static count = 0
    static delta = 1

    static initResources() {
        AlienFramework.canvasNode.width = 640
        AlienFramework.canvasNode.height = 480
        AlienFramework.images.aliens.src = '../images/alien.bmp'
        AlienFramework.images.ship.src = '../images/ship.bmp'
        AlienFramework.images.background.src = '../images/background.jpg'
        AlienFramework.images.bullet.src = '../images/bullet1.webp'
        
        AlienFramework.fightMusicNode.loop = true

        AlienFramework.images.background.onload = () => {
            AlienFramework.painter.drawImage(AlienFramework.images.background, 0, 0, AlienFramework.canvasNode.width, AlienFramework.canvasNode.height)
            AlienFramework.painter.textAlign = 'center'
            AlienFramework.painter.font = 'oblique small-caps bold 70px Arial'
            AlienFramework.painter.fillStyle = 'green'
            AlienFramework.painter.fillText("外星人来了", AlienFramework.canvasNode.width / 2, AlienFramework.canvasNode.height / 2)
        }

        AlienFramework.images.ship.onload = () => {
            AlienFramework.ship.x = AlienFramework.canvasNode.width / 2 - AlienFramework.images.ship.naturalWidth
            AlienFramework.ship.y = AlienFramework.canvasNode.height - AlienFramework.images.ship.naturalHeight
            AlienFramework.bottom = AlienFramework.canvasNode.height - AlienFramework.images.ship.naturalHeight
            AlienFramework.right = AlienFramework.canvasNode.width - AlienFramework.images.ship.naturalWidth
        }

        AlienFramework.startBtn.onclick = AlienFramework.onBtnClick

        addEventListener('keydown', AlienFramework.onKeyDown)
        addEventListener('keyup', AlienFramework.onKeyUp)
    }

    static onBtnClick() {
        if (AlienFramework.startBtn.innerHTML == '开始游戏') {
            AlienFramework.fightMusicNode.play()
            AlienFramework.mainLoop()
            AlienFramework.startBtn.innerHTML = '暂停游戏'
        }
        else if (AlienFramework.startBtn.innerHTML == '暂停游戏') {
            cancelAnimationFrame(AlienFramework.animationFrameId)
            AlienFramework.startBtn.innerHTML = '恢复游戏'
        }
        else if (AlienFramework.startBtn.innerHTML == '恢复游戏') {
            AlienFramework.then = Date.now()
            AlienFramework.animationFrameId = requestAnimationFrame(AlienFramework.mainLoop)
            AlienFramework.startBtn.innerHTML = '暂停游戏'
        }
        else if (AlienFramework.startBtn.innerHTML == '重新开始') {
            AlienFramework.mainLoop()
            AlienFramework.startBtn.innerHTML = '暂停游戏'
        }
    }

    static onKeyDown(e) {
        AlienFramework.keysDown.add(e.key)
    }

    static onKeyUp(e) {
        AlienFramework.keysDown.delete(e.key)
    }

    static clean() {
        for (let i = 0; i < AlienFramework.bullets.length; ++i) {
            if (AlienFramework.bullets[i].y <= 0) {
                AlienFramework.bullets.splice(i, 1);
            }
        }
    }

    static check(x1, y1, w1, h1, x2, y2, w2, h2) {
        return ((x1 > x2 - w1 + AlienFramework.delta) && (x1 < x2 + w2 - AlienFramework.delta)) && ((y1 > y2- h1 + AlienFramework.delta) && (y1 < y2 + h2 - AlienFramework.delta))
    }

    static isOver() {
        for (let alien of AlienFramework.aliens) {
            if (alien.y > AlienFramework.canvasNode.height - AlienFramework.images.aliens.naturalHeight / 2) {
                AlienFramework.strikeMusicNode.load()
                AlienFramework.strikeMusicNode.play()
                return true
            }
            if (AlienFramework.check(alien.x, alien.y, AlienFramework.images.aliens.naturalWidth / 2, AlienFramework.images.aliens.naturalHeight / 2, AlienFramework.ship.x, AlienFramework.ship.y, AlienFramework.images.ship.naturalWidth, AlienFramework.images.ship.naturalHeight)) {
                AlienFramework.strikeMusicNode.load()
                AlienFramework.strikeMusicNode.play()
                return true
            }
        }
        return false
    }

    static update(modifier) {
        const shipDst = Ship.v * modifier
        if (AlienFramework.keysDown.has('w')) {
            AlienFramework.ship.moveUp(shipDst, AlienFramework.top)
        }
        if (AlienFramework.keysDown.has('s')) {
            AlienFramework.ship.moveDown(shipDst, AlienFramework.bottom)
        }
        if (AlienFramework.keysDown.has('a')) {
            AlienFramework.ship.moveLeft(shipDst, AlienFramework.left)
        }
        if (AlienFramework.keysDown.has('d')) {
            AlienFramework.ship.moveRight(shipDst, AlienFramework.right)
        }
        for (let bullet of AlienFramework.bullets) {
            bullet.moveUp(Bullet.v * modifier)
        }
        for (let alien of AlienFramework.aliens) {
            alien.moveDown(Alien.v * modifier, AlienFramework.canvasNode.height)
        }
        for (let i = 0; i < AlienFramework.aliens.length; ++i) {
            for (let j = 0; j < AlienFramework.bullets.length; ++j) {
                if (AlienFramework.check(AlienFramework.aliens[i].x, AlienFramework.aliens[i].y, AlienFramework.images.aliens.naturalWidth / 2, AlienFramework.images.aliens.naturalHeight / 2, AlienFramework.bullets[j].x, AlienFramework.bullets[j].y, AlienFramework.images.bullet.naturalWidth, AlienFramework.images.bullet.naturalHeight)) {
                    // 不先调用load的话无法音效无法重叠播放
                    AlienFramework.blastMusicNode.load()
                    AlienFramework.blastMusicNode.play()
                    AlienFramework.bullets.splice(j, 1)
                    AlienFramework.aliens.splice(i, 1)
                    break
                }
            }
        }
        AlienFramework.clean()
        if (AlienFramework.isOver()) {
            AlienFramework.isGameOver = true
            return
        }
        if (AlienFramework.count % 20 == 0) {
            AlienFramework.bullets.push(new Bullet(AlienFramework.ship.x + AlienFramework.images.ship.naturalWidth / 2 - AlienFramework.images.bullet.naturalWidth / 2, AlienFramework.ship.y))
        }
        if (AlienFramework.count % 100 == 0) {
            for (let i = 0; i < Math.ceil(Math.random() * 3); ++i) {
                AlienFramework.aliens.push(new Alien(Math.random() * (AlienFramework.canvasNode.width - AlienFramework.images.aliens.naturalWidth), -AlienFramework.images.aliens.naturalHeight))
            }
        }
        if (AlienFramework.count == 100000) {
            AlienFramework.count = 0
        }
        ++AlienFramework.count
    }

    static render() {
        // AlienFramework.painter.drawImage(AlienFramework.images.background, 0, 0)
        // 重绘背景
        AlienFramework.painter.clearRect(0, 0, AlienFramework.canvasNode.width, AlienFramework.canvasNode.height)
        // 飞船
        AlienFramework.painter.drawImage(AlienFramework.images.ship, AlienFramework.ship.x, AlienFramework.ship.y)
        // 子弹
        for (let bullet of AlienFramework.bullets) {
            AlienFramework.painter.drawImage(AlienFramework.images.bullet, bullet.x, bullet.y)
        }
        // 外星人
        for (let aliens of AlienFramework.aliens) {
            AlienFramework.painter.drawImage(AlienFramework.images.aliens, aliens.x, aliens.y, AlienFramework.images.aliens.naturalWidth / 2, AlienFramework.images.aliens.naturalHeight / 2)
        }
    }

    static reset() {
        AlienFramework.aliens = []
        AlienFramework.bullets = []
        AlienFramework.ship.x = AlienFramework.canvasNode.width / 2 - AlienFramework.images.ship.naturalWidth
        AlienFramework.ship.y = AlienFramework.canvasNode.height - AlienFramework.images.ship.naturalHeight
        AlienFramework.count = 0
        AlienFramework.startBtn.innerHTML = '重新开始'
    }

    static mainLoop() {
        // 在mainLoop中无法直接使用cancelAnimationFrame取消
        const now = Date.now()
        const delta = now - AlienFramework.then
        AlienFramework.update(delta / 1000)
        AlienFramework.render()
        AlienFramework.then = now
        if (AlienFramework.isGameOver) {
            AlienFramework.reset()
            AlienFramework.isGameOver = false
        }
        else {
            AlienFramework.animationFrameId = requestAnimationFrame(AlienFramework.mainLoop)
        }
    }

    static start() {
        AlienFramework.initResources()
    }
}

AlienFramework.start()
