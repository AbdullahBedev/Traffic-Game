import { Vehicle, VEHICLE_TYPES } from './vehicle.js';

export class VehicleManager {
    constructor(grid) {
        this.grid = grid;
        this.vehicles = [];
        this.spawnPoints = [];
        this.destinations = [];
        this.spawnTimer = 0;
        this.spawnInterval = 3000; // Spawn a new vehicle every 3 seconds
        
        this.initializeSpawnPointsAndDestinations();
        console.log('VehicleManager initialized');
    }

    reset() {
        console.log('Resetting VehicleManager');
        this.vehicles = [];
        this.spawnPoints = [];
        this.destinations = [];
        this.spawnTimer = 0;
        this.initializeSpawnPointsAndDestinations();
    }

    setSpawnRate(rate) {
        console.log('Setting spawn rate to:', rate);
        this.spawnInterval = rate;
    }

    initializeSpawnPointsAndDestinations() {
        this.spawnPoints = []; // Clear existing spawn points
        this.destinations = []; // Clear existing destinations
        
        // Find road tiles at the edges of the grid that can be spawn points
        for (let x = 0; x < this.grid.gridWidth; x++) {
            if (this.isValidSpawnPoint(x, 0)) {
                this.spawnPoints.push({ x, y: 0, direction: 'south' });
            }
            if (this.isValidSpawnPoint(x, this.grid.gridHeight - 1)) {
                this.spawnPoints.push({ x, y: this.grid.gridHeight - 1, direction: 'north' });
            }
        }
        
        for (let y = 0; y < this.grid.gridHeight; y++) {
            if (this.isValidSpawnPoint(0, y)) {
                this.spawnPoints.push({ x: 0, y, direction: 'east' });
            }
            if (this.isValidSpawnPoint(this.grid.gridWidth - 1, y)) {
                this.spawnPoints.push({ x: this.grid.gridWidth - 1, y, direction: 'west' });
            }
        }

        // Destinations are the same as spawn points
        this.destinations = [...this.spawnPoints];
        
        console.log('Spawn points initialized:', this.spawnPoints.length);
    }

    isValidSpawnPoint(x, y) {
        const tile = this.grid.getTileAt(x, y);
        return tile && tile.road && !tile.road.hasTrafficLight;
    }

    findPath(start, end) {
        // Simple A* pathfinding implementation
        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const getKey = (pos) => `${pos.x},${pos.y}`;
        const heuristic = (pos) => Math.abs(pos.x - end.x) + Math.abs(pos.y - end.y);
        
        gScore.set(getKey(start), 0);
        fScore.set(getKey(start), heuristic(start));
        
        while (openSet.length > 0) {
            let current = openSet[0];
            let lowestF = fScore.get(getKey(current));
            
            for (let i = 1; i < openSet.length; i++) {
                const f = fScore.get(getKey(openSet[i]));
                if (f < lowestF) {
                    current = openSet[i];
                    lowestF = f;
                }
            }
            
            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current);
            }
            
            openSet.splice(openSet.indexOf(current), 1);
            
            for (const neighbor of this.getNeighbors(current)) {
                const tentativeG = gScore.get(getKey(current)) + 1;
                
                if (!gScore.has(getKey(neighbor)) || tentativeG < gScore.get(getKey(neighbor))) {
                    cameFrom.set(getKey(neighbor), current);
                    gScore.set(getKey(neighbor), tentativeG);
                    fScore.set(getKey(neighbor), tentativeG + heuristic(neighbor));
                    
                    if (!openSet.find(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        
        return null;
    }

    getNeighbors(pos) {
        const neighbors = [];
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        
        for (const dir of directions) {
            const newX = pos.x + dir.dx;
            const newY = pos.y + dir.dy;
            
            if (this.grid.isValidTile(newX, newY)) {
                const tile = this.grid.getTileAt(newX, newY);
                if (tile && tile.road) {
                    neighbors.push({ x: newX, y: newY });
                }
            }
        }
        
        return neighbors;
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        const getKey = (pos) => `${pos.x},${pos.y}`;
        
        while (cameFrom.has(getKey(current))) {
            current = cameFrom.get(getKey(current));
            path.unshift(current);
        }
        
        return path;
    }

    spawnVehicle() {
        if (this.spawnPoints.length === 0) return;

        // Randomly select spawn point and destination
        const spawnPoint = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        let destination;
        do {
            destination = this.destinations[Math.floor(Math.random() * this.destinations.length)];
        } while (destination.x === spawnPoint.x && destination.y === spawnPoint.y);

        // Find path
        const path = this.findPath(spawnPoint, destination);
        if (!path) return;

        // Create vehicle
        const vehicleTypes = Object.values(VEHICLE_TYPES);
        const randomType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        const vehicle = new Vehicle(randomType, spawnPoint.x, spawnPoint.y, spawnPoint.direction);
        vehicle.setPath(path);

        this.vehicles.push(vehicle);
    }

    update(deltaTime) {
        // Don't update if we have no spawn points
        if (this.spawnPoints.length === 0) {
            return;
        }

        // Update spawn timer
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnVehicle();
        }

        // Update vehicles
        for (let i = this.vehicles.length - 1; i >= 0; i--) {
            const vehicle = this.vehicles[i];
            const finished = vehicle.update(deltaTime, this.grid);
            
            if (finished) {
                // Vehicle has reached destination
                this.vehicles.splice(i, 1);
                
                // Notify game that a vehicle completed its journey
                if (this.grid.game && this.grid.game.levelManager) {
                    this.grid.game.levelManager.vehicleCompleted();
                }
            }
        }
    }

    render(ctx) {
        for (const vehicle of this.vehicles) {
            vehicle.render(ctx, (x, y) => this.grid.isoToScreen(x, y));
        }
    }
} 