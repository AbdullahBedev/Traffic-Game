export class Car {
    constructor(direction, x, y) {
        // Basic initialization with defaults
        this.reset(direction, x, y);
    }
    
    reset(direction, x, y) {
        this.startDirection = direction; // north, east, south, west
        
        // Starting position
        this.x = x;
        this.y = y;
        
        // Physical properties
        this.width = 20;
        this.height = 10;
        this.color = this.getRandomColor();
        
        // Movement properties
        this.speed = 0.07 + Math.random() * 0.03; // pixels per ms
        this.maxSpeed = this.speed;
        this.currentSpeed = this.speed;
        this.stopped = false;
        
        // Timing
        this.waitTime = 0;
        this.creationTime = Date.now();
        this.completionTime = 0;
        
        // Path following
        this.path = null;
        this.t = 0; // Path progress (0 to 1)
        this.pathType = null;
        
        // Collision
        this.collided = false;
        
        return this;
    }
    
    setPath(path) {
        this.path = path;
        // Determine if this is a straight or curved path based on control points
        this.pathType = this.determinePathType();
        this.t = 0;
    }
    
    determinePathType() {
        // Determine if this is a straight path or a turn based on control points
        if (!this.path) return null;
        
        return this.path.control1 && this.path.control2 ? 'turn' : 'straight';
    }
    
    getRandomColor() {
        const colors = [
            '#e74c3c', // Red
            '#3498db', // Blue
            '#2ecc71', // Green
            '#f39c12', // Orange
            '#9b59b6', // Purple
            '#1abc9c', // Turquoise
            '#34495e', // Navy
            '#7f8c8d'  // Gray
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    checkTrafficLight(intersection) {
        if (!intersection) return false;
        
        // Get traffic light state based on approach direction
        const lightState = intersection.getTrafficLightState(this.startDirection);
        
        // Define the stopping line position based on direction
        let stopLine;
        const roadWidth = intersection.roadWidth;
        const centerX = intersection.centerX;
        const centerY = intersection.centerY;
        
        switch (this.startDirection) {
            case 'north':
                stopLine = centerY - roadWidth/2;
                if (this.y < stopLine && this.y + this.currentSpeed * 100 >= stopLine) {
                    // Approaching the intersection from north
                    if (lightState === 'red' || lightState === 'yellow') {
                        this.stopped = true;
                        this.currentSpeed = 0;
                        return true;
                    }
                }
                break;
            case 'south':
                stopLine = centerY + roadWidth/2;
                if (this.y > stopLine && this.y - this.currentSpeed * 100 <= stopLine) {
                    // Approaching the intersection from south
                    if (lightState === 'red' || lightState === 'yellow') {
                        this.stopped = true;
                        this.currentSpeed = 0;
                        return true;
                    }
                }
                break;
            case 'east':
                stopLine = centerX + roadWidth/2;
                if (this.x > stopLine && this.x - this.currentSpeed * 100 <= stopLine) {
                    // Approaching the intersection from east
                    if (lightState === 'red' || lightState === 'yellow') {
                        this.stopped = true;
                        this.currentSpeed = 0;
                        return true;
                    }
                }
                break;
            case 'west':
                stopLine = centerX - roadWidth/2;
                if (this.x < stopLine && this.x + this.currentSpeed * 100 >= stopLine) {
                    // Approaching the intersection from west
                    if (lightState === 'red' || lightState === 'yellow') {
                        this.stopped = true;
                        this.currentSpeed = 0;
                        return true;
                    }
                }
                break;
        }
        
        // If we get here, we're not stopped at a light or it's green
        if (this.stopped) {
            // Resume movement if we were stopped
            this.stopped = false;
            // Gradually accelerate
            this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + 0.01);
        } else {
            this.currentSpeed = this.maxSpeed;
        }
        
        // Update max wait time in game if we've been waiting
        if (this.waitTime > 0 && intersection.game) {
            intersection.game.updateMaxWaitTime(this.waitTime);
        }
        
        return false;
    }
    
    checkCollision(otherCar) {
        // Quick bounding-box distance check first (optimization)
        const dx = Math.abs(this.x - otherCar.x);
        const dy = Math.abs(this.y - otherCar.y);
        
        // If cars are too far apart, don't do expensive collision detection
        if (dx > this.width * 1.5 || dy > this.height * 1.5) {
            return false;
        }
        
        // More accurate collision detection only if cars are close enough
        // Get the corners of this car
        const thisCorners = this.getCorners();
        
        // Get the corners of the other car
        const otherCorners = otherCar.getCorners();
        
        // Check for overlap using the Separating Axis Theorem (simplified)
        // Project corners onto x and y axes and check for overlap
        const thisMinX = Math.min(...thisCorners.map(c => c.x));
        const thisMaxX = Math.max(...thisCorners.map(c => c.x));
        const thisMinY = Math.min(...thisCorners.map(c => c.y));
        const thisMaxY = Math.max(...thisCorners.map(c => c.y));
        
        const otherMinX = Math.min(...otherCorners.map(c => c.x));
        const otherMaxX = Math.max(...otherCorners.map(c => c.x));
        const otherMinY = Math.min(...otherCorners.map(c => c.y));
        const otherMaxY = Math.max(...otherCorners.map(c => c.y));
        
        // Check for overlap
        return !(
            thisMaxX < otherMinX || 
            thisMinX > otherMaxX || 
            thisMaxY < otherMinY || 
            thisMinY > otherMaxY
        );
    }
    
    getCorners() {
        // Calculate corners based on car's position and dimensions
        // This takes into account the car's rotation based on its path direction
        
        // Simplified version: get rectangular corners around current position
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Determine angle based on current path segment
        let angle = 0;
        if (this.path && this.t < 1) {
            const nextPos = this.getPositionAt(Math.min(this.t + 0.05, 1));
            const dx = nextPos.x - this.x;
            const dy = nextPos.y - this.y;
            angle = Math.atan2(dy, dx);
        }
        
        // Calculate the corners with rotation
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        return [
            {
                x: this.x + cos * halfWidth - sin * halfHeight,
                y: this.y + sin * halfWidth + cos * halfHeight
            },
            {
                x: this.x + cos * halfWidth + sin * halfHeight,
                y: this.y + sin * halfWidth - cos * halfHeight
            },
            {
                x: this.x - cos * halfWidth + sin * halfHeight,
                y: this.y - sin * halfWidth - cos * halfHeight
            },
            {
                x: this.x - cos * halfWidth - sin * halfHeight,
                y: this.y - sin * halfWidth + cos * halfHeight
            }
        ];
    }
    
    getPositionAt(t) {
        // Get the position at a specific point along the path
        if (!this.path) return { x: this.x, y: this.y };
        
        if (this.pathType === 'straight') {
            // Linear interpolation for straight paths
            return {
                x: this.path.start.x + (this.path.end.x - this.path.start.x) * t,
                y: this.path.start.y + (this.path.end.y - this.path.start.y) * t
            };
        } else {
            // For curved paths, use Bezier curve formula
            const p0 = this.path.start;
            const p2 = this.path.end;
            
            // Control point depends on the direction of the turn
            const cp = this.path.controlPoint;
            
            // Quadratic Bezier formula
            const x = (1-t)*(1-t)*p0.x + 2*(1-t)*t*cp.x + t*t*p2.x;
            const y = (1-t)*(1-t)*p0.y + 2*(1-t)*t*cp.y + t*t*p2.y;
            
            return { x, y };
        }
    }
    
    update(deltaTime, intersection) {
        if (this.collided) {
            return false; // Don't update collided cars
        }
        
        // Update wait time if stopped at a light
        if (this.stopped) {
            this.waitTime += deltaTime;
        }
        
        // Check if we've reached the end of the path
        if (this.t >= 1) {
            this.completionTime = Date.now() - this.creationTime;
            return true; // Indicate the car has completed its journey
        }
        
        // Update position based on path type
        if (this.pathType === 'straight') {
            this.updateStraightPath(deltaTime);
        } else if (this.pathType === 'turn') {
            this.updateCurvedPath(deltaTime);
        }
        
        // Check for traffic light ahead
        this.checkTrafficLight(intersection);
        
        // Check for collisions with other cars
        if (intersection && intersection.carManager) {
            for (const otherCar of intersection.carManager.cars) {
                if (otherCar !== this && this.checkCollision(otherCar)) {
                    // Handle collision
                    this.collided = true;
                    otherCar.collided = true;
                    
                    // Trigger accident event in the game
                    if (intersection.game) {
                        intersection.game.reportAccident();
                    }
                    
                    // Play crash sound
                    if (intersection.game && intersection.game.soundManager) {
                        intersection.game.soundManager.play('carCrash', 0.7);
                    }
                    
                    break;
                }
            }
        }
        
        return false; // Car is still active
    }
    
    updateStraightPath(deltaTime) {
        // For straight paths, simple linear interpolation
        const distanceToMove = this.currentSpeed * deltaTime;
        
        // Calculate the total path length
        const dx = this.path.end.x - this.path.start.x;
        const dy = this.path.end.y - this.path.start.y;
        const pathLength = Math.sqrt(dx * dx + dy * dy);
        
        // Update t based on the distance moved
        this.t += distanceToMove / pathLength;
        this.t = Math.min(1, this.t); // Clamp to 1
        
        // Calculate new position
        this.x = this.path.start.x + dx * this.t;
        this.y = this.path.start.y + dy * this.t;
    }
    
    updateCurvedPath(deltaTime) {
        // For curved paths, use Bezier curve interpolation
        const distanceToMove = this.currentSpeed * deltaTime;
        
        // Calculate approximate path length for curved path
        const start = this.path.start;
        const control1 = this.path.control1;
        const control2 = this.path.control2;
        const end = this.path.end;
        
        // Approximate path length using a few sample points
        const samples = 10;
        let pathLength = 0;
        let lastX = start.x;
        let lastY = start.y;
        
        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const x = Math.pow(1-t, 3) * start.x + 
                     3 * Math.pow(1-t, 2) * t * control1.x + 
                     3 * (1-t) * Math.pow(t, 2) * control2.x + 
                     Math.pow(t, 3) * end.x;
            const y = Math.pow(1-t, 3) * start.y + 
                     3 * Math.pow(1-t, 2) * t * control1.y + 
                     3 * (1-t) * Math.pow(t, 2) * control2.y + 
                     Math.pow(t, 3) * end.y;
            
            const dx = x - lastX;
            const dy = y - lastY;
            pathLength += Math.sqrt(dx * dx + dy * dy);
            lastX = x;
            lastY = y;
        }
        
        // Update t based on the distance moved
        this.t += distanceToMove / pathLength;
        this.t = Math.min(1, this.t); // Clamp to 1
        
        // Calculate new position using cubic Bezier
        const t = this.t;
        this.x = Math.pow(1-t, 3) * start.x + 
                3 * Math.pow(1-t, 2) * t * control1.x + 
                3 * (1-t) * Math.pow(t, 2) * control2.x + 
                Math.pow(t, 3) * end.x;
                
        this.y = Math.pow(1-t, 3) * start.y + 
                3 * Math.pow(1-t, 2) * t * control1.y + 
                3 * (1-t) * Math.pow(t, 2) * control2.y + 
                Math.pow(t, 3) * end.y;
    }
    
    render(ctx, intersection) {
        if (!this.path) return;
        
        // Save the canvas state
        ctx.save();
        
        // Determine car rotation based on movement direction
        let angle = 0;
        const nextPos = this.getPositionAt(Math.min(this.t + 0.05, 1));
        const dx = nextPos.x - this.x;
        const dy = nextPos.y - this.y;
        
        if (dx !== 0 || dy !== 0) {
            angle = Math.atan2(dy, dx);
        }
        
        // Translate to car position
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        
        // Draw car body
        ctx.fillStyle = this.collided ? 'black' : this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw wheels (small details)
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.width/2 + 2, -this.height/2 - 1, 4, 2);
        ctx.fillRect(this.width/2 - 6, -this.height/2 - 1, 4, 2);
        ctx.fillRect(-this.width/2 + 2, this.height/2 - 1, 4, 2);
        ctx.fillRect(this.width/2 - 6, this.height/2 - 1, 4, 2);
        
        // Draw wait time label if car is stopped or waiting for a while
        if (this.waitTime > 0) {
            const waitInSeconds = Math.floor(this.waitTime / 1000);
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Change color based on wait time
            if (waitInSeconds >= 20) {
                ctx.fillStyle = 'red'; // Critical wait time
            } else if (waitInSeconds >= 10) {
                ctx.fillStyle = 'orange'; // Warning
            } else {
                ctx.fillStyle = 'white'; // Normal
            }
            
            ctx.fillText(`${waitInSeconds}s`, 0, 0);
        }
        
        // Draw collision effect if applicable
        if (this.collided) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            const radius = 10;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Restore the canvas state
        ctx.restore();
    }
} 