export class Intersection {
    constructor(canvasWidth, canvasHeight, game) {
        this.game = game;
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // Center position of the intersection
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // Road properties
        this.roadWidth = 60;
        this.laneWidth = this.roadWidth / 2;
        
        // Traffic light states: red, yellow, green
        this.trafficLights = {
            north: { state: 'red', timer: 0, toggleTime: 0 },
            east: { state: 'green', timer: 0, toggleTime: 0 },
            south: { state: 'red', timer: 0, toggleTime: 0 },
            west: { state: 'green', timer: 0, toggleTime: 0 }
        };
        
        // Traffic light positions (relative to center)
        this.lightPositions = {
            north: { x: 0, y: -this.roadWidth, size: 20 },
            east: { x: this.roadWidth, y: 0, size: 20 },
            south: { x: 0, y: this.roadWidth, size: 20 },
            west: { x: -this.roadWidth, y: 0, size: 20 }
        };
        
        // Define road boundaries for path calculations
        this.roadBoundaries = {
            north: {
                leftEdge: this.centerX - this.roadWidth/2,
                rightEdge: this.centerX + this.roadWidth/2,
                topEdge: 0,
                bottomEdge: this.centerY - this.roadWidth/2
            },
            east: {
                leftEdge: this.centerX + this.roadWidth/2,
                rightEdge: this.width,
                topEdge: this.centerY - this.roadWidth/2,
                bottomEdge: this.centerY + this.roadWidth/2
            },
            south: {
                leftEdge: this.centerX - this.roadWidth/2,
                rightEdge: this.centerX + this.roadWidth/2,
                topEdge: this.centerY + this.roadWidth/2,
                bottomEdge: this.height
            },
            west: {
                leftEdge: 0,
                rightEdge: this.centerX - this.roadWidth/2,
                topEdge: this.centerY - this.roadWidth/2,
                bottomEdge: this.centerY + this.roadWidth/2
            }
        };
        
        // Initialize lanes with proper road-aligned paths
        this.initializeLanes();
    }
    
    initializeLanes() {
        // Lane entry and exit points (for car pathing)
        this.lanes = {};
        
        // North to South (straight)
        this.lanes.northToSouth = {
            start: { x: this.centerX - this.laneWidth/2, y: 0 },
            end: { x: this.centerX - this.laneWidth/2, y: this.height }
        };
        
        // South to North (straight)
        this.lanes.southToNorth = {
            start: { x: this.centerX + this.laneWidth/2, y: this.height },
            end: { x: this.centerX + this.laneWidth/2, y: 0 }
        };
        
        // East to West (straight)
        this.lanes.eastToWest = {
            start: { x: this.width, y: this.centerY + this.laneWidth/2 },
            end: { x: 0, y: this.centerY + this.laneWidth/2 }
        };
        
        // West to East (straight)
        this.lanes.westToEast = {
            start: { x: 0, y: this.centerY - this.laneWidth/2 },
            end: { x: this.width, y: this.centerY - this.laneWidth/2 }
        };
    }
    
    reset() {
        // Reset traffic light states
        this.trafficLights = {
            north: { state: 'red', timer: 0, toggleTime: 0 },
            east: { state: 'green', timer: 0, toggleTime: 0 },
            south: { state: 'red', timer: 0, toggleTime: 0 },
            west: { state: 'green', timer: 0, toggleTime: 0 }
        };
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        
        // Update center position
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // Re-initialize lane entry/exit points
        this.lanes = {
            // Format: [startX, startY, endX, endY]
            northToSouth: {
                start: { x: this.centerX - this.laneWidth/2, y: 0 },
                end: { x: this.centerX - this.laneWidth/2, y: this.height }
            },
            southToNorth: {
                start: { x: this.centerX + this.laneWidth/2, y: this.height },
                end: { x: this.centerX + this.laneWidth/2, y: 0 }
            },
            eastToWest: {
                start: { x: this.width, y: this.centerY + this.laneWidth/2 },
                end: { x: 0, y: this.centerY + this.laneWidth/2 }
            },
            westToEast: {
                start: { x: 0, y: this.centerY - this.laneWidth/2 },
                end: { x: this.width, y: this.centerY - this.laneWidth/2 }
            }
        };
    }
    
    handleClick(x, y) {
        // Check if click is on a traffic light
        const directions = ['north', 'east', 'south', 'west'];
        
        for (const direction of directions) {
            const light = this.lightPositions[direction];
            const lightX = this.centerX + light.x;
            const lightY = this.centerY + light.y;
            const size = light.size;
            
            // Check if click is within the traffic light's hitbox
            if (x >= lightX - size/2 && x <= lightX + size/2 &&
                y >= lightY - size/2 && y <= lightY + size/2) {
                
                this.toggleTrafficLight(direction);
                return true;
            }
        }
        
        return false;
    }
    
    toggleTrafficLight(direction) {
        // Get the current light
        const light = this.trafficLights[direction];
        if (!light) return false;
        
        // Toggle the light state
        switch (light.state) {
            case 'red':
                light.state = 'green';
                break;
            case 'yellow':
                light.state = 'red';
                break;
            case 'green':
                light.state = 'yellow';
                break;
        }
        
        // Update toggle time
        light.toggleTime = Date.now();
        
        // Add visual effect for light change
        light.effectTime = 0;
        light.hasEffect = true;
        
        // Debug traffic light change
        console.log(`Traffic light ${direction} changed to ${light.state}`);
        
        // If we're changing one direction, update the perpendicular directions too
        this.updatePerpendicularLights(direction);
        
        return true; // Indicate successful toggle
    }
    
    updatePerpendicularLights(direction) {
        // When a north/south light changes, update east/west lights
        // When an east/west light changes, update north/south lights
        
        if (direction === 'north' || direction === 'south') {
            // Update east/west lights
            if (this.trafficLights.north.state === 'green' || this.trafficLights.south.state === 'green') {
                // If north or south is green, east/west should be red
                if (this.trafficLights.east.state === 'green') {
                    this.trafficLights.east.state = 'yellow';
                    this.trafficLights.east.toggleTime = Date.now();
                    this.trafficLights.east.effectTime = 0;
                    this.trafficLights.east.hasEffect = true;
                }
                
                if (this.trafficLights.west.state === 'green') {
                    this.trafficLights.west.state = 'yellow';
                    this.trafficLights.west.toggleTime = Date.now();
                    this.trafficLights.west.effectTime = 0;
                    this.trafficLights.west.hasEffect = true;
                }
            } else if (this.trafficLights.north.state === 'red' && this.trafficLights.south.state === 'red') {
                // If both north and south are red, east/west can be green
                if (this.trafficLights.east.state === 'red') {
                    this.trafficLights.east.state = 'green';
                    this.trafficLights.east.toggleTime = Date.now();
                    this.trafficLights.east.effectTime = 0;
                    this.trafficLights.east.hasEffect = true;
                }
                
                if (this.trafficLights.west.state === 'red') {
                    this.trafficLights.west.state = 'green';
                    this.trafficLights.west.toggleTime = Date.now();
                    this.trafficLights.west.effectTime = 0;
                    this.trafficLights.west.hasEffect = true;
                }
            }
        } else if (direction === 'east' || direction === 'west') {
            // Update north/south lights
            if (this.trafficLights.east.state === 'green' || this.trafficLights.west.state === 'green') {
                // If east or west is green, north/south should be red
                if (this.trafficLights.north.state === 'green') {
                    this.trafficLights.north.state = 'yellow';
                    this.trafficLights.north.toggleTime = Date.now();
                    this.trafficLights.north.effectTime = 0;
                    this.trafficLights.north.hasEffect = true;
                }
                
                if (this.trafficLights.south.state === 'green') {
                    this.trafficLights.south.state = 'yellow';
                    this.trafficLights.south.toggleTime = Date.now();
                    this.trafficLights.south.effectTime = 0;
                    this.trafficLights.south.hasEffect = true;
                }
            } else if (this.trafficLights.east.state === 'red' && this.trafficLights.west.state === 'red') {
                // If both east and west are red, north/south can be green
                if (this.trafficLights.north.state === 'red') {
                    this.trafficLights.north.state = 'green';
                    this.trafficLights.north.toggleTime = Date.now();
                    this.trafficLights.north.effectTime = 0;
                    this.trafficLights.north.hasEffect = true;
                }
                
                if (this.trafficLights.south.state === 'red') {
                    this.trafficLights.south.state = 'green';
                    this.trafficLights.south.toggleTime = Date.now();
                    this.trafficLights.south.effectTime = 0;
                    this.trafficLights.south.hasEffect = true;
                }
            }
        }
    }
    
    getTrafficLightState(direction) {
        return this.trafficLights[direction].state;
    }
    
    update(deltaTime) {
        // Update traffic light timers
        const directions = ['north', 'east', 'south', 'west'];
        
        for (const direction of directions) {
            const light = this.trafficLights[direction];
            light.timer += deltaTime;
            
            // Update effect time if there's an effect
            if (light.hasEffect) {
                light.effectTime += deltaTime;
                if (light.effectTime > 500) { // Effect lasts 500ms
                    light.hasEffect = false;
                }
            }
            
            // Auto-change yellow lights after 2 seconds
            if (light.state === 'yellow' && Date.now() - light.toggleTime > 2000) {
                light.state = 'red';
                light.toggleTime = Date.now();
                
                // Add effect for automatic light change
                light.effectTime = 0;
                light.hasEffect = true;
                
                console.log(`Traffic light ${direction} automatically changed to red`);
                
                // Check if we need to update perpendicular lights
                const perpendicularDirections = 
                    (direction === 'north' || direction === 'south') 
                    ? ['east', 'west'] 
                    : ['north', 'south'];
                
                // If all perpendicular lights are red, make them green
                const allPerpendicularsRed = perpendicularDirections.every(
                    dir => this.trafficLights[dir].state === 'red'
                );
                
                if (allPerpendicularsRed) {
                    for (const perpDir of perpendicularDirections) {
                        this.trafficLights[perpDir].state = 'green';
                        this.trafficLights[perpDir].toggleTime = Date.now();
                        this.trafficLights[perpDir].effectTime = 0;
                        this.trafficLights[perpDir].hasEffect = true;
                        console.log(`Traffic light ${perpDir} automatically changed to green`);
                    }
                }
            }
        }
    }
    
    render(ctx) {
        this.renderRoads(ctx);
        this.renderTrafficLights(ctx);
        
        // Debug: visualize the paths
        this.renderDebugPaths(ctx);
    }
    
    renderRoads(ctx) {
        // Draw the ground/background
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-color');
        ctx.fillStyle = bgColor || '#2c3e50';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw grass/terrain
        const grassColor = getComputedStyle(document.documentElement).getPropertyValue('--grass-color');
        ctx.fillStyle = grassColor || '#27ae60';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw the horizontal road
        const roadColor = getComputedStyle(document.documentElement).getPropertyValue('--road-color');
        ctx.fillStyle = roadColor || '#7f8c8d';
        ctx.fillRect(0, this.centerY - this.roadWidth/2, this.width, this.roadWidth);
        
        // Draw the vertical road
        ctx.fillStyle = roadColor || '#7f8c8d';
        ctx.fillRect(this.centerX - this.roadWidth/2, 0, this.roadWidth, this.height);
        
        // Draw center lines (yellow)
        const lightIndicatorColor = getComputedStyle(document.documentElement).getPropertyValue('--light-indicator');
        ctx.strokeStyle = lightIndicatorColor || '#f1c40f';
        ctx.lineWidth = 2;
        
        // Horizontal center line
        ctx.setLineDash([20, 10]);
        ctx.beginPath();
        ctx.moveTo(0, this.centerY);
        ctx.lineTo(this.width, this.centerY);
        ctx.stroke();
        
        // Vertical center line
        ctx.beginPath();
        ctx.moveTo(this.centerX, 0);
        ctx.lineTo(this.centerX, this.height);
        ctx.stroke();
        
        // Draw lane markings (white)
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        
        // North road lane marking
        ctx.setLineDash([20, 10]);
        ctx.beginPath();
        ctx.moveTo(this.centerX - this.roadWidth/2, 0);
        ctx.lineTo(this.centerX - this.roadWidth/2, this.centerY - this.roadWidth/2);
        ctx.stroke();
        
        // South road lane marking
        ctx.beginPath();
        ctx.moveTo(this.centerX + this.roadWidth/2, this.centerY + this.roadWidth/2);
        ctx.lineTo(this.centerX + this.roadWidth/2, this.height);
        ctx.stroke();
        
        // East road lane marking
        ctx.beginPath();
        ctx.moveTo(this.centerX + this.roadWidth/2, this.centerY - this.roadWidth/2);
        ctx.lineTo(this.width, this.centerY - this.roadWidth/2);
        ctx.stroke();
        
        // West road lane marking
        ctx.beginPath();
        ctx.moveTo(0, this.centerY + this.roadWidth/2);
        ctx.lineTo(this.centerX - this.roadWidth/2, this.centerY + this.roadWidth/2);
        ctx.stroke();
        
        // Reset line dash
        ctx.setLineDash([]);
        
        // Draw stop lines
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        
        // North approach stop line
        ctx.beginPath();
        ctx.moveTo(this.centerX - this.roadWidth/2, this.centerY - this.roadWidth/2 - 10);
        ctx.lineTo(this.centerX, this.centerY - this.roadWidth/2 - 10);
        ctx.stroke();
        
        // South approach stop line
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY + this.roadWidth/2 + 10);
        ctx.lineTo(this.centerX + this.roadWidth/2, this.centerY + this.roadWidth/2 + 10);
        ctx.stroke();
        
        // East approach stop line
        ctx.beginPath();
        ctx.moveTo(this.centerX + this.roadWidth/2 + 10, this.centerY - this.roadWidth/2);
        ctx.lineTo(this.centerX + this.roadWidth/2 + 10, this.centerY);
        ctx.stroke();
        
        // West approach stop line
        ctx.beginPath();
        ctx.moveTo(this.centerX - this.roadWidth/2 - 10, this.centerY);
        ctx.lineTo(this.centerX - this.roadWidth/2 - 10, this.centerY + this.roadWidth/2);
        ctx.stroke();
    }
    
    renderTrafficLights(ctx) {
        // Draw each traffic light
        const directions = ['north', 'east', 'south', 'west'];
        
        for (const direction of directions) {
            const light = this.lightPositions[direction];
            const state = this.trafficLights[direction].state;
            const x = this.centerX + light.x;
            const y = this.centerY + light.y;
            const size = light.size;
            
            // Traffic light housing
            ctx.fillStyle = '#34495e';
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            
            // Draw traffic light based on direction
            ctx.fillRect(x - size/2, y - size/2, size, size);
            ctx.strokeRect(x - size/2, y - size/2, size, size);
            
            // Traffic light color
            let lightColor;
            switch (state) {
                case 'red':
                    lightColor = '#e74c3c';
                    break;
                case 'yellow':
                    lightColor = '#f39c12';
                    break;
                case 'green':
                    lightColor = '#2ecc71';
                    break;
            }
            
            // Draw the colored light
            const lightSize = size * 0.6;
            ctx.fillStyle = lightColor;
            
            // Add effect if light just changed
            let glowSize = 0;
            if (this.trafficLights[direction].hasEffect) {
                const effectProgress = this.trafficLights[direction].effectTime / 500;
                glowSize = 10 * (1 - effectProgress);
                ctx.shadowColor = lightColor;
                ctx.shadowBlur = 15 + glowSize;
            } else {
                ctx.shadowColor = lightColor;
                ctx.shadowBlur = 10;
            }
            
            ctx.beginPath();
            ctx.arc(x, y, lightSize/2 + glowSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Reset shadow
            ctx.shadowBlur = 0;
            
            // Draw light housing again to clean up excessive glow
            if (glowSize > 0) {
                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - size/2, y - size/2, size, size);
            }
            
            // Direction indicator
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let directionText;
            switch (direction) {
                case 'north': directionText = 'N'; break;
                case 'east': directionText = 'E'; break;
                case 'south': directionText = 'S'; break;
                case 'west': directionText = 'W'; break;
            }
            
            // Position the text slightly outside the traffic light
            let textX = x;
            let textY = y;
            
            switch (direction) {
                case 'north':
                    textY = y - size/2 - 10;
                    break;
                case 'south':
                    textY = y + size/2 + 10;
                    break;
                case 'east':
                    textX = x + size/2 + 10;
                    break;
                case 'west':
                    textX = x - size/2 - 10;
                    break;
            }
            
            ctx.fillText(directionText, textX, textY);
        }
    }
    
    renderDebugPaths(ctx) {
        // Draw all paths to debug
        ctx.save();
        
        // Draw each path
        for (const pathName in this.lanes) {
            const path = this.lanes[pathName];
            
            // Skip if not a valid path
            if (!path.start || !path.end) continue;
            
            // Draw start and end points
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(path.start.x, path.start.y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(path.end.x, path.end.y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw control points if they exist
            if (path.control1 && path.control2) {
                ctx.fillStyle = 'purple';
                ctx.beginPath();
                ctx.arc(path.control1.x, path.control1.y, 3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(path.control2.x, path.control2.y, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw the actual path curve
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(path.start.x, path.start.y);
                
                // Draw the Bezier curve
                ctx.bezierCurveTo(
                    path.control1.x, path.control1.y,
                    path.control2.x, path.control2.y,
                    path.end.x, path.end.y
                );
                ctx.stroke();
            } else {
                // Draw straight path
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(path.start.x, path.start.y);
                ctx.lineTo(path.end.x, path.end.y);
                ctx.stroke();
            }
        }
        
        // Draw traffic light detection zones
        this.renderTrafficLightZones(ctx);
        
        ctx.restore();
    }
    
    renderTrafficLightZones(ctx) {
        // Visualize the traffic light detection zones
        const roadWidth = this.roadWidth;
        const centerX = this.centerX;
        const centerY = this.centerY;
        
        // North detection zone
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(
            centerX - roadWidth/2,
            centerY - roadWidth/2 - 50,
            roadWidth,
            50
        );
        
        // South detection zone
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(
            centerX - roadWidth/2,
            centerY + roadWidth/2,
            roadWidth,
            50
        );
        
        // East detection zone
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(
            centerX + roadWidth/2,
            centerY - roadWidth/2,
            50,
            roadWidth
        );
        
        // West detection zone
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(
            centerX - roadWidth/2 - 50,
            centerY - roadWidth/2,
            50,
            roadWidth
        );
        
        // Draw stop lines
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        
        // North stop line
        ctx.beginPath();
        ctx.moveTo(centerX - roadWidth/2, centerY - roadWidth/2);
        ctx.lineTo(centerX + roadWidth/2, centerY - roadWidth/2);
        ctx.stroke();
        
        // South stop line
        ctx.beginPath();
        ctx.moveTo(centerX - roadWidth/2, centerY + roadWidth/2);
        ctx.lineTo(centerX + roadWidth/2, centerY + roadWidth/2);
        ctx.stroke();
        
        // East stop line
        ctx.beginPath();
        ctx.moveTo(centerX + roadWidth/2, centerY - roadWidth/2);
        ctx.lineTo(centerX + roadWidth/2, centerY + roadWidth/2);
        ctx.stroke();
        
        // West stop line
        ctx.beginPath();
        ctx.moveTo(centerX - roadWidth/2, centerY - roadWidth/2);
        ctx.lineTo(centerX - roadWidth/2, centerY + roadWidth/2);
        ctx.stroke();
        
        // Add traffic light state indicators
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // North light state
        ctx.fillStyle = this.trafficLights.north.state === 'red' ? 'red' : 
                        this.trafficLights.north.state === 'yellow' ? 'yellow' : 'green';
        ctx.fillText(this.trafficLights.north.state, centerX, centerY - roadWidth/2 - 20);
        
        // South light state
        ctx.fillStyle = this.trafficLights.south.state === 'red' ? 'red' : 
                        this.trafficLights.south.state === 'yellow' ? 'yellow' : 'green';
        ctx.fillText(this.trafficLights.south.state, centerX, centerY + roadWidth/2 + 20);
        
        // East light state
        ctx.fillStyle = this.trafficLights.east.state === 'red' ? 'red' : 
                        this.trafficLights.east.state === 'yellow' ? 'yellow' : 'green';
        ctx.fillText(this.trafficLights.east.state, centerX + roadWidth/2 + 20, centerY);
        
        // West light state
        ctx.fillStyle = this.trafficLights.west.state === 'red' ? 'red' : 
                        this.trafficLights.west.state === 'yellow' ? 'yellow' : 'green';
        ctx.fillText(this.trafficLights.west.state, centerX - roadWidth/2 - 20, centerY);
    }
} 