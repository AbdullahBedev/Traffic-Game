import { Car } from './car.js';

export class CarManager {
    constructor(intersection, game) {
        this.intersection = intersection;
        this.game = game;
        this.cars = [];
        this.totalSpawned = 0;
        this.totalCompleted = 0;
        
        // Car object pool for performance
        this.carPool = [];
        this.poolSize = 50; // Initial pool size
        this.initializePool();
        
        // Spawn rate in milliseconds
        this.spawnRate = 3000; // Default: 3 seconds between spawns
        this.lastSpawnTime = 0;
        
        // Path probabilities for different directions
        this.pathProbabilities = {
            // Probability of direction: straight, right, left
            north: [0.5, 0.3, 0.2], // North approach: 50% straight, 30% right, 20% left
            east: [0.5, 0.3, 0.2],  // East approach: 50% straight, 30% right, 20% left
            south: [0.5, 0.3, 0.2], // South approach: 50% straight, 30% right, 20% left
            west: [0.5, 0.3, 0.2]   // West approach: 50% straight, 30% right, 20% left
        };
        
        console.log('CarManager initialized');
    }
    
    initializePool() {
        // Pre-create car objects for the pool
        for (let i = 0; i < this.poolSize; i++) {
            this.carPool.push(new Car('north', -1, -1)); // Create with dummy values
        }
        console.log(`Created car pool with ${this.poolSize} cars`);
    }
    
    getCar(direction, x, y) {
        let car;
        
        // Get a car from the pool or create a new one if pool is empty
        if (this.carPool.length > 0) {
            car = this.carPool.pop();
            car.reset(direction, x, y); // Reset the car with new values
        } else {
            car = new Car(direction, x, y);
        }
        
        return car;
    }
    
    returnCarToPool(car) {
        // Return car to pool for reuse
        if (this.carPool.length < this.poolSize * 2) { // Cap the pool size
            this.carPool.push(car);
        }
    }
    
    reset() {
        this.cars = [];
        this.totalSpawned = 0;
        this.totalCompleted = 0;
        this.lastSpawnTime = 0;
    }
    
    setSpawnRate(rate) {
        this.spawnRate = rate;
    }
    
    update(deltaTime) {
        // Spawn new cars
        this.lastSpawnTime += deltaTime;
        if (this.lastSpawnTime >= this.spawnRate) {
            this.spawnCar();
            this.lastSpawnTime = 0;
        }
        
        // Update all active cars
        for (let i = this.cars.length - 1; i >= 0; i--) {
            const car = this.cars[i];
            const completed = car.update(deltaTime, this.intersection);
            
            if (completed) {
                // Car has reached its destination
                this.cars.splice(i, 1);
                this.totalCompleted++;
                
                // Return car to the pool for reuse
                this.returnCarToPool(car);
                
                // Notify game of successful passage
                if (this.intersection.game) {
                    this.intersection.game.carCompleted();
                }
            }
        }
        
        // Check for collisions between cars
        this.checkCollisions();
    }
    
    checkCollisions() {
        // Simple O(n²) collision check - in a real game, spatial partitioning would be used for better performance
        for (let i = 0; i < this.cars.length; i++) {
            const carA = this.cars[i];
            
            // Skip collided cars
            if (carA.collided) continue;
            
            for (let j = i + 1; j < this.cars.length; j++) {
                const carB = this.cars[j];
                
                // Skip collided cars
                if (carB.collided) continue;
                
                // Check for collision
                carA.checkCollision(carB);
            }
        }
    }
    
    spawnCar() {
        // Choose a random spawn direction
        const directions = ['north', 'east', 'south', 'west'];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        // Choose a path based on the direction probabilities
        const pathType = this.getRandomPathType(direction);
        
        // Get the appropriate path
        const path = this.getPath(direction, pathType);
        
        // Create and add the car
        const car = this.getCar(direction, path.start.x, path.start.y);
        car.setPath(path);
        this.cars.push(car);
        this.totalSpawned++;
        
        //console.log(`Spawned car #${car.id} from ${direction} taking ${pathType} path`);
    }
    
    getRandomPathType(direction) {
        const rand = Math.random();
        const probs = this.pathProbabilities[direction];
        
        if (rand < probs[0]) {
            return 'straight';
        } else if (rand < probs[0] + probs[1]) {
            return 'right';
        } else {
            return 'left';
        }
    }
    
    getPath(direction, pathType) {
        // Return the appropriate path based on direction and type
        switch (direction) {
            case 'north':
                if (pathType === 'straight') {
                    return this.intersection.lanes.northToSouth;
                } else if (pathType === 'right') {
                    // Fall back to straight path if turn path is not available
                    return this.intersection.lanes.northToSouth;
                } else { // left
                    // Fall back to straight path if turn path is not available
                    return this.intersection.lanes.northToSouth;
                }
            
            case 'east':
                if (pathType === 'straight') {
                    return this.intersection.lanes.eastToWest;
                } else if (pathType === 'right') {
                    // Fall back to straight path if turn path is not available
                    return this.intersection.lanes.eastToWest;
                } else { // left
                    // Fall back to straight path if turn path is not available
                    return this.intersection.lanes.eastToWest;
                }
            
            case 'south':
                if (pathType === 'straight') {
                    return this.intersection.lanes.southToNorth;
                } else if (pathType === 'right') {
                    // Fall back to straight path if turn path is not available
                    return this.intersection.lanes.southToNorth;
                } else { // left
                    // Fall back to straight path if turn path is not available
                    return this.intersection.lanes.southToNorth;
                }
            
            case 'west':
                if (pathType === 'straight') {
                    return this.intersection.lanes.westToEast;
                } else if (pathType === 'right') {
                    // Fall back to straight path if turn path is not available
                    return this.intersection.lanes.westToEast;
                } else { // left
                    // Fall back to straight path if turn path is not available
                    return this.intersection.lanes.westToEast;
                }
        }
    }
    
    render(ctx) {
        // Render all cars
        for (const car of this.cars) {
            car.render(ctx);
        }
    }
} 