export const VEHICLE_TYPES = {
    CAR: 'car',
    TRUCK: 'truck',
    BUS: 'bus'
};

export class Vehicle {
    constructor(type, startX, startY, direction) {
        this.type = type;
        this.x = startX;
        this.y = startY;
        this.direction = direction; // 'north', 'south', 'east', 'west'
        this.speed = this.getBaseSpeed();
        this.size = this.getSize();
        this.color = this.getColor();
        this.waiting = false;
        this.path = [];
        this.currentPathIndex = 0;
    }

    getBaseSpeed() {
        switch (this.type) {
            case VEHICLE_TYPES.CAR:
                return 0.1;
            case VEHICLE_TYPES.TRUCK:
                return 0.07;
            case VEHICLE_TYPES.BUS:
                return 0.05;
            default:
                return 0.1;
        }
    }

    getSize() {
        switch (this.type) {
            case VEHICLE_TYPES.CAR:
                return { width: 20, height: 10 };
            case VEHICLE_TYPES.TRUCK:
                return { width: 30, height: 12 };
            case VEHICLE_TYPES.BUS:
                return { width: 35, height: 14 };
            default:
                return { width: 20, height: 10 };
        }
    }

    getColor() {
        switch (this.type) {
            case VEHICLE_TYPES.CAR:
                return '#' + Math.floor(Math.random()*16777215).toString(16);
            case VEHICLE_TYPES.TRUCK:
                return '#8B4513';
            case VEHICLE_TYPES.BUS:
                return '#FFD700';
            default:
                return '#FF0000';
        }
    }

    setPath(path) {
        this.path = path;
        this.currentPathIndex = 0;
    }

    update(deltaTime, grid) {
        if (this.waiting || !this.path.length) return false;

        const nextPoint = this.path[this.currentPathIndex];
        if (!nextPoint) return false;
        
        const dx = nextPoint.x - this.x;
        const dy = nextPoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            // Reached current waypoint
            this.x = nextPoint.x;
            this.y = nextPoint.y;
            this.currentPathIndex++;

            if (this.currentPathIndex >= this.path.length) {
                // Reached destination
                return true;
            }

            // Check if next tile is an intersection with red light
            const currTile = grid.getTileAt(Math.floor(this.x), Math.floor(this.y));
            if (currTile && currTile.road && currTile.road.hasTrafficLight) {
                this.waiting = currTile.road.trafficLightState === 'red';
                if (this.waiting) {
                    currTile.hasWaitingVehicle = true;
                }
            }
        } else {
            // Move towards next point
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;
            this.x += moveX;
            this.y += moveY;

            // Update direction based on movement
            if (Math.abs(moveX) > Math.abs(moveY)) {
                this.direction = moveX > 0 ? 'east' : 'west';
            } else {
                this.direction = moveY > 0 ? 'south' : 'north';
            }
            
            // Mark current tile as having a vehicle
            const currTile = grid.getTileAt(Math.floor(this.x), Math.floor(this.y));
            if (currTile) {
                currTile.hasWaitingVehicle = this.waiting;
            }
        }

        return false;
    }

    render(ctx, isoToScreen) {
        const screenPos = isoToScreen(this.x, this.y);
        
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);

        // Rotate based on direction
        const rotation = {
            'north': -Math.PI / 4,
            'south': Math.PI / 4,
            'east': Math.PI / 4,
            'west': -3 * Math.PI / 4
        }[this.direction];
        
        ctx.rotate(rotation);

        // Draw vehicle body
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.rect(-this.size.width / 2, -this.size.height / 2, 
                 this.size.width, this.size.height);
        ctx.fill();
        ctx.stroke();

        // Draw windows (for visual interest)
        ctx.fillStyle = '#87CEEB';
        const windowWidth = this.size.width * 0.2;
        const windowHeight = this.size.height * 0.6;
        ctx.fillRect(-this.size.width * 0.3, -windowHeight / 2, 
                    windowWidth, windowHeight);

        ctx.restore();
    }
} 