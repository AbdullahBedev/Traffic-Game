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
        
        // Lane entry and exit points (for car pathing)
        this.lanes = {
            // Format: [startX, startY, endX, endY]
            northToSouth: {
                start: { x: this.centerX - this.laneWidth/2, y: 0 },
                end: { x: this.centerX - this.laneWidth/2, y: this.height }
            },
            northToEast: {
                start: { x: this.centerX - this.laneWidth/2, y: 0 },
                end: { x: this.width, y: this.centerY - this.laneWidth/2 }
            },
            northToWest: {
                start: { x: this.centerX - this.laneWidth/2, y: 0 },
                end: { x: 0, y: this.centerY - this.laneWidth/2 }
            },
            southToNorth: {
                start: { x: this.centerX + this.laneWidth/2, y: this.height },
                end: { x: this.centerX + this.laneWidth/2, y: 0 }
            },
            southToEast: {
                start: { x: this.centerX + this.laneWidth/2, y: this.height },
                end: { x: this.width, y: this.centerY - this.laneWidth/2 }
            },
            southToWest: {
                start: { x: this.centerX + this.laneWidth/2, y: this.height },
                end: { x: 0, y: this.centerY - this.laneWidth/2 }
            },
            eastToWest: {
                start: { x: this.width, y: this.centerY + this.laneWidth/2 },
                end: { x: 0, y: this.centerY + this.laneWidth/2 }
            },
            eastToNorth: {
                start: { x: this.width, y: this.centerY + this.laneWidth/2 },
                end: { x: this.centerX + this.laneWidth/2, y: 0 }
            },
            eastToSouth: {
                start: { x: this.width, y: this.centerY + this.laneWidth/2 },
                end: { x: this.centerX + this.laneWidth/2, y: this.height }
            },
            westToEast: {
                start: { x: 0, y: this.centerY - this.laneWidth/2 },
                end: { x: this.width, y: this.centerY - this.laneWidth/2 }
            },
            westToNorth: {
                start: { x: 0, y: this.centerY - this.laneWidth/2 },
                end: { x: this.centerX - this.laneWidth/2, y: 0 }
            },
            westToSouth: {
                start: { x: 0, y: this.centerY - this.laneWidth/2 },
                end: { x: this.centerX - this.laneWidth/2, y: this.height }
            }
        };
        
        // Control points for curved paths
        this.initializeControlPoints();
    }
    
    initializeControlPoints() {
        // Add control points for curved paths
        // These control points help smooth out turns through the intersection
        
        const offset = this.laneWidth * 0.8;
        
        // Add control points to each path that involves a turn
        // North to East (right turn)
        this.lanes.northToEast.control1 = { 
            x: this.centerX - this.laneWidth/2, 
            y: this.centerY - this.roadWidth 
        };
        this.lanes.northToEast.control2 = { 
            x: this.centerX + this.roadWidth, 
            y: this.centerY - this.laneWidth/2 
        };
        
        // North to West (left turn)
        this.lanes.northToWest.control1 = { 
            x: this.centerX - this.laneWidth/2, 
            y: this.centerY - offset 
        };
        this.lanes.northToWest.control2 = { 
            x: this.centerX - offset, 
            y: this.centerY - this.laneWidth/2 
        };
        
        // South to East (left turn)
        this.lanes.southToEast.control1 = { 
            x: this.centerX + this.laneWidth/2, 
            y: this.centerY + offset 
        };
        this.lanes.southToEast.control2 = { 
            x: this.centerX + offset, 
            y: this.centerY - this.laneWidth/2 
        };
        
        // South to West (right turn)
        this.lanes.southToWest.control1 = { 
            x: this.centerX + this.laneWidth/2, 
            y: this.centerY + this.roadWidth 
        };
        this.lanes.southToWest.control2 = { 
            x: this.centerX - this.roadWidth, 
            y: this.centerY - this.laneWidth/2 
        };
        
        // East to North (left turn)
        this.lanes.eastToNorth.control1 = { 
            x: this.centerX + offset, 
            y: this.centerY + this.laneWidth/2 
        };
        this.lanes.eastToNorth.control2 = { 
            x: this.centerX + this.laneWidth/2, 
            y: this.centerY - offset 
        };
        
        // East to South (right turn)
        this.lanes.eastToSouth.control1 = { 
            x: this.centerX + this.roadWidth, 
            y: this.centerY + this.laneWidth/2 
        };
        this.lanes.eastToSouth.control2 = { 
            x: this.centerX + this.laneWidth/2, 
            y: this.centerY + this.roadWidth 
        };
        
        // West to North (right turn)
        this.lanes.westToNorth.control1 = { 
            x: this.centerX - this.roadWidth, 
            y: this.centerY - this.laneWidth/2 
        };
        this.lanes.westToNorth.control2 = { 
            x: this.centerX - this.laneWidth/2, 
            y: this.centerY - this.roadWidth 
        };
        
        // West to South (left turn)
        this.lanes.westToSouth.control1 = { 
            x: this.centerX - offset, 
            y: this.centerY - this.laneWidth/2 
        };
        this.lanes.westToSouth.control2 = { 
            x: this.centerX - this.laneWidth/2, 
            y: this.centerY + offset 
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
        
        // Re-initialize lane entry/exit points and control points
        this.lanes = {
            // Format: [startX, startY, endX, endY]
            northToSouth: {
                start: { x: this.centerX - this.laneWidth/2, y: 0 },
                end: { x: this.centerX - this.laneWidth/2, y: this.height }
            },
            northToEast: {
                start: { x: this.centerX - this.laneWidth/2, y: 0 },
                end: { x: this.width, y: this.centerY - this.laneWidth/2 }
            },
            northToWest: {
                start: { x: this.centerX - this.laneWidth/2, y: 0 },
                end: { x: 0, y: this.centerY - this.laneWidth/2 }
            },
            southToNorth: {
                start: { x: this.centerX + this.laneWidth/2, y: this.height },
                end: { x: this.centerX + this.laneWidth/2, y: 0 }
            },
            southToEast: {
                start: { x: this.centerX + this.laneWidth/2, y: this.height },
                end: { x: this.width, y: this.centerY - this.laneWidth/2 }
            },
            southToWest: {
                start: { x: this.centerX + this.laneWidth/2, y: this.height },
                end: { x: 0, y: this.centerY - this.laneWidth/2 }
            },
            eastToWest: {
                start: { x: this.width, y: this.centerY + this.laneWidth/2 },
                end: { x: 0, y: this.centerY + this.laneWidth/2 }
            },
            eastToNorth: {
                start: { x: this.width, y: this.centerY + this.laneWidth/2 },
                end: { x: this.centerX + this.laneWidth/2, y: 0 }
            },
            eastToSouth: {
                start: { x: this.width, y: this.centerY + this.laneWidth/2 },
                end: { x: this.centerX + this.laneWidth/2, y: this.height }
            },
            westToEast: {
                start: { x: 0, y: this.centerY - this.laneWidth/2 },
                end: { x: this.width, y: this.centerY - this.laneWidth/2 }
            },
            westToNorth: {
                start: { x: 0, y: this.centerY - this.laneWidth/2 },
                end: { x: this.centerX - this.laneWidth/2, y: 0 }
            },
            westToSouth: {
                start: { x: 0, y: this.centerY - this.laneWidth/2 },
                end: { x: this.centerX - this.laneWidth/2, y: this.height }
            }
        };
        
        this.initializeControlPoints();
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
        const light = this.trafficLights[direction];
        
        // Cycle through states: red -> green -> yellow -> red
        switch (light.state) {
            case 'red':
                light.state = 'green';
                break;
            case 'green':
                light.state = 'yellow';
                break;
            case 'yellow':
                light.state = 'red';
                break;
        }
        
        light.toggleTime = Date.now();
        
        // Add visual effect for light change
        light.effectTime = 0;
        light.hasEffect = true;
        
        // Debug traffic light change
        console.log(`Traffic light ${direction} changed to ${light.state}`);
        
        return true; // Indicate successful toggle
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
            }
        }
    }
    
    render(ctx) {
        // Render the roads
        this.renderRoads(ctx);
        
        // Render the traffic lights
        this.renderTrafficLights(ctx);
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
} 