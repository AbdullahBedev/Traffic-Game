export class Car {
    static nextId = 1;
    
    constructor(direction, x, y) {
        // Basic initialization with defaults
        this.reset(direction, x, y);
    }
    
    reset(direction, x, y) {
        this.id = Car.nextId++;
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
        this.lastWaitTimeUpdate = 0; // Track the last time we updated wait time
        
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
        
        // Check if we're already in the intersection
        const inIntersection = (
            this.x >= centerX - roadWidth/2 &&
            this.x <= centerX + roadWidth/2 &&
            this.y >= centerY - roadWidth/2 &&
            this.y <= centerY + roadWidth/2
        );
        
        // If we're already in the intersection, don't stop
        if (inIntersection) {
            return false;
        }
        
        // Calculate distance to the stop line
        let distanceToStopLine;
        let shouldStop = false;
        
        switch (this.startDirection) {
            case 'north':
                stopLine = centerY - roadWidth/2;
                distanceToStopLine = stopLine - this.y;
                
                // Only check if we're approaching the intersection from the north
                if (this.y < stopLine && distanceToStopLine <= 50 && distanceToStopLine > 0) {
                    // Approaching the intersection from north
                    if (lightState === 'red' || lightState === 'yellow') {
                        shouldStop = true;
                    }
                }
                break;
                
            case 'south':
                stopLine = centerY + roadWidth/2;
                distanceToStopLine = this.y - stopLine;
                
                // Only check if we're approaching the intersection from the south
                if (this.y > stopLine && distanceToStopLine <= 50 && distanceToStopLine > 0) {
                    // Approaching the intersection from south
                    if (lightState === 'red' || lightState === 'yellow') {
                        shouldStop = true;
                    }
                }
                break;
                
            case 'east':
                stopLine = centerX + roadWidth/2;
                distanceToStopLine = this.x - stopLine;
                
                // Only check if we're approaching the intersection from the east
                if (this.x > stopLine && distanceToStopLine <= 50 && distanceToStopLine > 0) {
                    // Approaching the intersection from east
                    if (lightState === 'red' || lightState === 'yellow') {
                        shouldStop = true;
                    }
                }
                break;
                
            case 'west':
                stopLine = centerX - roadWidth/2;
                distanceToStopLine = stopLine - this.x;
                
                // Only check if we're approaching the intersection from the west
                if (this.x < stopLine && distanceToStopLine <= 50 && distanceToStopLine > 0) {
                    // Approaching the intersection from west
                    if (lightState === 'red' || lightState === 'yellow') {
                        shouldStop = true;
                    }
                }
                break;
        }
        
        // Apply stopping logic
        if (shouldStop) {
            this.stopped = true;
            this.currentSpeed = 0;
            this.waitTime += 16; // Approximate milliseconds per frame
            return true;
        } else if (this.stopped) {
            // Resume movement if we were stopped
            this.stopped = false;
            // Gradually accelerate
            this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + 0.01);
            
            // Update max wait time in game if we've been waiting
            if (this.waitTime > 0 && intersection.game) {
                // Report one final time with the final wait time
                intersection.game.updateMaxWaitTime(this.waitTime, this.id);
                // Then report that we're no longer waiting with a wait time of 0
                intersection.game.updateMaxWaitTime(0, this.id);
                this.waitTime = 0; // Reset wait time when we start moving again
                this.lastWaitTimeUpdate = 0;
            }
        } else {
            this.currentSpeed = this.maxSpeed;
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
            // For curved paths, use cubic Bezier curve formula (matching updateCurvedPath)
            const p0 = this.path.start;
            const p1 = this.path.control1;
            const p2 = this.path.control2;
            const p3 = this.path.end;
            
            // Cubic Bezier formula
            const x = Math.pow(1-t, 3) * p0.x + 
                     3 * Math.pow(1-t, 2) * t * p1.x + 
                     3 * (1-t) * Math.pow(t, 2) * p2.x + 
                     Math.pow(t, 3) * p3.x;
            const y = Math.pow(1-t, 3) * p0.y + 
                     3 * Math.pow(1-t, 2) * t * p1.y + 
                     3 * (1-t) * Math.pow(t, 2) * p2.y + 
                     Math.pow(t, 3) * p3.y;
            
            return { x, y };
        }
    }
    
    update(deltaTime, intersection) {
        if (this.collided) {
            // If collided and we were previously waiting, report that we're no longer waiting
            if (this.waitTime > 0 && intersection && intersection.game) {
                intersection.game.updateMaxWaitTime(0, this.id);
                this.waitTime = 0;
            }
            return false; // Don't update collided cars
        }
        
        // Update wait time if stopped at a light
        if (this.stopped) {
            this.waitTime += deltaTime;
            
            // Report wait time to game regularly (every 500ms)
            if (intersection && intersection.game && 
                (this.waitTime - this.lastWaitTimeUpdate > 500 || this.waitTime >= 30000)) {
                intersection.game.updateMaxWaitTime(this.waitTime, this.id);
                this.lastWaitTimeUpdate = this.waitTime;
            }
        }
        
        // Check if we've reached the end of the path
        if (this.t >= 1) {
            // If we were waiting before completion, make sure to report we're no longer waiting
            if (this.waitTime > 0 && intersection && intersection.game) {
                intersection.game.updateMaxWaitTime(0, this.id);
            }
            this.completionTime = Date.now() - this.creationTime;
            return true; // Indicate the car has completed its journey
        }
        
        // Update position based on path type
        if (this.pathType === 'straight') {
            this.updateStraightPath(deltaTime);
        } else if (this.pathType === 'turn') {
            this.updateCurvedPath(deltaTime);
        }
        
        // Always ensure the car is exactly on the calculated path
        // This prevents any drift or inconsistencies
        const exactPosition = this.getPositionAt(this.t);
        this.x = exactPosition.x;
        this.y = exactPosition.y;
        
        // Constrain car to road boundaries
        this.constrainToRoad(intersection);
        
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
        
        // If control points are missing, fall back to straight path update
        if (!this.path.control1 || !this.path.control2) {
            this.updateStraightPath(deltaTime);
            return;
        }
        
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
    
    constrainToRoad(intersection) {
        if (!intersection) return;
        
        // Get road boundaries
        const roadBoundaries = intersection.roadBoundaries;
        
        // Determine which road segment the car is on based on its position
        let onRoad = false;
        
        // Check if car is on the north road
        if (this.y <= intersection.centerY - intersection.roadWidth/2 &&
            this.x >= intersection.centerX - intersection.roadWidth/2 &&
            this.x <= intersection.centerX + intersection.roadWidth/2) {
            onRoad = true;
        }
        
        // Check if car is on the east road
        if (this.x >= intersection.centerX + intersection.roadWidth/2 &&
            this.y >= intersection.centerY - intersection.roadWidth/2 &&
            this.y <= intersection.centerY + intersection.roadWidth/2) {
            onRoad = true;
        }
        
        // Check if car is on the south road
        if (this.y >= intersection.centerY + intersection.roadWidth/2 &&
            this.x >= intersection.centerX - intersection.roadWidth/2 &&
            this.x <= intersection.centerX + intersection.roadWidth/2) {
            onRoad = true;
        }
        
        // Check if car is on the west road
        if (this.x <= intersection.centerX - intersection.roadWidth/2 &&
            this.y >= intersection.centerY - intersection.roadWidth/2 &&
            this.y <= intersection.centerY + intersection.roadWidth/2) {
            onRoad = true;
        }
        
        // Check if car is in the intersection
        if (this.x >= intersection.centerX - intersection.roadWidth/2 &&
            this.x <= intersection.centerX + intersection.roadWidth/2 &&
            this.y >= intersection.centerY - intersection.roadWidth/2 &&
            this.y <= intersection.centerY + intersection.roadWidth/2) {
            onRoad = true;
        }
        
        // If car is off the road, adjust its position
        if (!onRoad) {
            // Find the nearest point on the path
            const t = this.findNearestPointOnPath();
            if (t !== null) {
                this.t = t;
                const exactPosition = this.getPositionAt(this.t);
                this.x = exactPosition.x;
                this.y = exactPosition.y;
            }
        }
    }
    
    findNearestPointOnPath() {
        if (!this.path) return null;
        
        // Sample points along the path to find the closest one
        const samples = 20;
        let closestT = null;
        let minDistance = Infinity;
        
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const pos = this.getPositionAt(t);
            const dx = pos.x - this.x;
            const dy = pos.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestT = t;
            }
        }
        
        return closestT;
    }
    
    render(ctx, intersection) {
        if (!this.path) return;
        
        // Save the canvas state
        ctx.save();
        
        // Get exact position from the path calculation to ensure consistency
        const exactPosition = this.getPositionAt(this.t);
        
        // Determine car rotation based on movement direction
        let angle = 0;
        const nextPos = this.getPositionAt(Math.min(this.t + 0.05, 1));
        const dx = nextPos.x - exactPosition.x;
        const dy = nextPos.y - exactPosition.y;
        
        if (dx !== 0 || dy !== 0) {
            angle = Math.atan2(dy, dx);
        }
        
        // Translate to car position using exact path calculation
        ctx.translate(exactPosition.x, exactPosition.y);
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
            
            // Change color based on wait time - matching game UI colors
            if (waitInSeconds >= 25) {
                ctx.fillStyle = 'red'; // Critical wait time
            } else if (waitInSeconds >= 15) {
                ctx.fillStyle = 'orange'; // Warning
            } else {
                ctx.fillStyle = 'green'; // Normal
            }
            
            // Draw wait time with seconds unit
            ctx.fillText(`${waitInSeconds}s`, 0, -this.height - 5);
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