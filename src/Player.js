export class PlayerInventory {
    constructor(bombs=1, speedPowerup=0, radiusPowerup=0, lastPlaced=[-1, -1]) {
        this.bombs = bombs
        this.speedPowerup = speedPowerup
        this.radiusPowerup = radiusPowerup
        this.lastPlaced = lastPlaced
    }
}

export default class Player {
    constructor(id=0, startPosition=[0, 0, 0], position=[0, 0, 0], angle=0, speed=2.5, inventory=new PlayerInventory(), score=0, lives=3) {
        this.id = id
        this.position=position
        this.speed = speed
        this.inventory = inventory
        this.angle = angle
        this.score = score
        this.lives = lives
        this.startPosition = startPosition
    }
    getSpeed() {
        return Math.min(this.speed + (this.inventory.speedPowerup * 0.2), 6)
    }
    getBombRadius() {
        return 1 + (this.inventory.radiusPowerup)
    }
    getBombs() {
        return this.inventory.bombs
    }
    addSpeedPowerup() {
        this.inventory.speedPowerup += 1
    }
    addRadiusPowerup() {
        this.inventory.radiusPowerup += 1
    }
    addBombPowerup() {
        this.inventory.bombs++
    }
    resetInventory() {
        this.inventory = new PlayerInventory()
    }
    getDetonationTime() {
        return 2.5
    }
    kill() {
        this.lives--

        this.resetInventory()
        this.resetPosition()
    }
    resetPosition() {
        this.position[0] = this.startPosition[0]
        this.position[1] = this.startPosition[1]
        this.position[2] = this.startPosition[2]
        this.angle = 0
    }
    reset() {
        this.resetInventory()
        this.resetPosition()
        this.lives = 3
        this.score = 0
    }
    addPowerup(type) {
        if(type === "speed") {
            this.addSpeedPowerup()
        } else if (type === "radius") {
            this.addRadiusPowerup()
        } else if (type === "bomb") {
            this.addBombPowerup()
        }
    }
    
}