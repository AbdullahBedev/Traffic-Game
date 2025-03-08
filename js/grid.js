import { Road, ROAD_TYPES } from './road.js';
import { VehicleManager } from './vehicleManager.js';

export class Grid {
    constructor(width, height, game) {
        this.width = width;
        this.height = height;
        this.game = game; // Store reference to the game
        this.tileSize = 64; // Base size of each tile
        this.gridWidth = 10; // Number of tiles horizontally
        this.gridHeight = 10; // Number of tiles vertically
        
        // Grid offset for centering
        this.offsetX = width / 2;
        this.offsetY = height / 4;
        
        this.initializeGrid();
        
        // Mouse position in grid coordinates
        this.hoveredTile = { x: -1, y: -1 };
        
        // Current road type for placement
        this.currentRoadType = ROAD_TYPES.STRAIGHT_HORIZONTAL;
        this.roadTypeElement = document.getElementById('road-type');
        this.updateRoadTypeDisplay();
        
        // Initialize vehicle manager with access to grid and game
        this.vehicleManager = new VehicleManager(this);
        // Give vehicle manager access to the game through grid reference
        this.vehicleManager.grid = this;
        
        console.log('Grid initialized with size:', this.gridWidth, 'x', this.gridHeight);
    }

    initializeGrid() {
        // Initialize grid data
        this.tiles = Array(this.gridHeight).fill().map(() => 
            Array(this.gridWidth).fill().map(() => ({
                type: 'grass',
                selected: false,
                road: null,
                hasWaitingVehicle: false
            }))
        );
    }

    resetGrid(size) {
        console.log('Resetting grid to size:', size.width, 'x', size.height);
        this.gridWidth = size.width;
        this.gridHeight = size.height;
        this.initializeGrid();
        this.vehicleManager.reset();
    }

    placePredefinedRoad(x, y, type) {
        console.log('Placing predefined road at:', x, y, 'type:', type);
        if (this.isValidTile(x, y)) {
            this.tiles[y][x].road = new Road(type);
        }
    }

    removeRoadAtCursor() {
        if (this.isValidTile(this.hoveredTile.x, this.hoveredTile.y)) {
            const tile = this.tiles[this.hoveredTile.y][this.hoveredTile.x];
            if (tile.road) {
                tile.road = null;
            }
        }
    }

    countRoads() {
        let count = 0;
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.tiles[y][x].road) count++;
            }
        }
        return count;
    }

    countCongestedRoads() {
        let count = 0;
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const tile = this.tiles[y][x];
                if (tile.road && tile.hasWaitingVehicle) count++;
            }
        }
        return count;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.offsetX = width / 2;
        this.offsetY = height / 4;
    }

    // Convert screen coordinates to isometric grid coordinates
    screenToIso(screenX, screenY) {
        // Translate to origin
        const x = screenX - this.offsetX;
        const y = screenY - this.offsetY;
        
        // Convert to grid coordinates
        const tileX = Math.floor((x / (this.tileSize / 2) + y / (this.tileSize / 4)) / 2);
        const tileY = Math.floor((y / (this.tileSize / 4) - x / (this.tileSize / 2)) / 2);
        
        return { x: tileX, y: tileY };
    }

    // Convert isometric coordinates to screen coordinates
    isoToScreen(gridX, gridY) {
        const screenX = (gridX - gridY) * (this.tileSize / 2) + this.offsetX;
        const screenY = (gridX + gridY) * (this.tileSize / 4) + this.offsetY;
        return { x: screenX, y: screenY };
    }

    handleMouseMove(x, y) {
        const gridPos = this.screenToIso(x, y);
        if (this.isValidTile(gridPos.x, gridPos.y)) {
            this.hoveredTile = gridPos;
        } else {
            this.hoveredTile = { x: -1, y: -1 };
        }
    }

    handleClick(x, y) {
        const gridPos = this.screenToIso(x, y);
        if (this.isValidTile(gridPos.x, gridPos.y)) {
            const tile = this.tiles[gridPos.y][gridPos.x];
            
            if (tile.road) {
                // If it's an intersection, toggle traffic light
                if (tile.road.hasTrafficLight) {
                    tile.road.toggleTrafficLight();
                }
            } else {
                // Place new road
                tile.road = new Road(this.currentRoadType);
                // Recalculate vehicle spawn points
                this.vehicleManager.initializeSpawnPointsAndDestinations();
            }
        }
    }

    // Add method to cycle through road types
    cycleRoadType() {
        const types = Object.values(ROAD_TYPES);
        const currentIndex = types.indexOf(this.currentRoadType);
        this.currentRoadType = types[(currentIndex + 1) % types.length];
        this.updateRoadTypeDisplay();
    }

    updateRoadTypeDisplay() {
        const displayNames = {
            [ROAD_TYPES.STRAIGHT_HORIZONTAL]: 'Straight Horizontal',
            [ROAD_TYPES.STRAIGHT_VERTICAL]: 'Straight Vertical',
            [ROAD_TYPES.CURVE_NE]: 'Curve North-East',
            [ROAD_TYPES.CURVE_SE]: 'Curve South-East',
            [ROAD_TYPES.CURVE_SW]: 'Curve South-West',
            [ROAD_TYPES.CURVE_NW]: 'Curve North-West',
            [ROAD_TYPES.INTERSECTION]: 'Intersection'
        };
        this.roadTypeElement.textContent = displayNames[this.currentRoadType];
    }

    isValidTile(x, y) {
        return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
    }

    update(deltaTime) {
        // Reset waiting vehicle flags
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.tiles[y][x].hasWaitingVehicle = false;
            }
        }
        
        // Update vehicles
        this.vehicleManager.update(deltaTime);
    }

    render(ctx) {
        // Render grid from back to front
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.renderTile(ctx, x, y);
            }
        }

        // Render vehicles
        this.vehicleManager.render(ctx);
    }

    renderTile(ctx, x, y) {
        const tile = this.tiles[y][x];
        const pos = this.isoToScreen(x, y);
        
        // Draw base tile
        ctx.save();
        ctx.translate(pos.x, pos.y);
        
        // Create tile path
        ctx.beginPath();
        ctx.moveTo(0, -this.tileSize / 4);
        ctx.lineTo(this.tileSize / 2, 0);
        ctx.lineTo(0, this.tileSize / 4);
        ctx.lineTo(-this.tileSize / 2, 0);
        ctx.closePath();
        
        // Fill based on tile type
        ctx.fillStyle = '#90EE90'; // Grass color
        
        // Highlight if hovered
        if (x === this.hoveredTile.x && y === this.hoveredTile.y) {
            ctx.fillStyle = '#ADD8E6';
        }
        
        ctx.fill();
        ctx.stroke();
        
        // Draw road if present
        if (tile.road) {
            tile.road.render(ctx, 0, 0, this.tileSize);
        }
        
        ctx.restore();
    }

    // Add method to get tile at position
    getTileAt(x, y) {
        if (this.isValidTile(x, y)) {
            return this.tiles[y][x];
        }
        return null;
    }
} 