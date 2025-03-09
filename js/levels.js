import { ROAD_TYPES } from './road.js';

export const LEVELS = {
    1: {
        name: "Learning the Basics",
        description: "Get started with simple traffic management",
        targetScore: 1000,
        timeLimit: 180, // 3 minutes
        gridSize: { width: 8, height: 8 },
        spawnRate: 5000, // New vehicle every 5 seconds
        initialRoads: [
            { x: 3, y: 3, type: ROAD_TYPES.INTERSECTION },
            { x: 2, y: 3, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            { x: 4, y: 3, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            { x: 3, y: 2, type: ROAD_TYPES.STRAIGHT_VERTICAL },
            { x: 3, y: 4, type: ROAD_TYPES.STRAIGHT_VERTICAL }
        ],
        winConditions: {
            minScore: 1000,
            maxCongestion: 50,
            minFlowRate: 10
        }
    },
    2: {
        name: "Rush Hour",
        description: "Handle increased traffic with multiple intersections",
        targetScore: 2500,
        timeLimit: 300, // 5 minutes
        gridSize: { width: 10, height: 10 },
        spawnRate: 3000, // New vehicle every 3 seconds
        initialRoads: [
            { x: 3, y: 3, type: ROAD_TYPES.INTERSECTION },
            { x: 6, y: 6, type: ROAD_TYPES.INTERSECTION },
            { x: 3, y: 6, type: ROAD_TYPES.INTERSECTION },
            { x: 6, y: 3, type: ROAD_TYPES.INTERSECTION },
            // Horizontal connections
            { x: 4, y: 3, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            { x: 5, y: 3, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            { x: 4, y: 6, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            { x: 5, y: 6, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            // Vertical connections
            { x: 3, y: 4, type: ROAD_TYPES.STRAIGHT_VERTICAL },
            { x: 3, y: 5, type: ROAD_TYPES.STRAIGHT_VERTICAL },
            { x: 6, y: 4, type: ROAD_TYPES.STRAIGHT_VERTICAL },
            { x: 6, y: 5, type: ROAD_TYPES.STRAIGHT_VERTICAL }
        ],
        winConditions: {
            minScore: 2500,
            maxCongestion: 40,
            minFlowRate: 15
        }
    },
    3: {
        name: "City Center",
        description: "Master complex traffic patterns in a busy city center",
        targetScore: 5000,
        timeLimit: 420, // 7 minutes
        gridSize: { width: 12, height: 12 },
        spawnRate: 2000, // New vehicle every 2 seconds
        initialRoads: [
            // Central intersection
            { x: 6, y: 6, type: ROAD_TYPES.INTERSECTION },
            // Surrounding intersections
            { x: 4, y: 4, type: ROAD_TYPES.INTERSECTION },
            { x: 8, y: 4, type: ROAD_TYPES.INTERSECTION },
            { x: 4, y: 8, type: ROAD_TYPES.INTERSECTION },
            { x: 8, y: 8, type: ROAD_TYPES.INTERSECTION },
            // Straight connections - horizontal
            { x: 5, y: 4, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            { x: 7, y: 4, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            { x: 5, y: 8, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            { x: 7, y: 8, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            // Straight connections - vertical
            { x: 4, y: 5, type: ROAD_TYPES.STRAIGHT_VERTICAL },
            { x: 4, y: 7, type: ROAD_TYPES.STRAIGHT_VERTICAL },
            { x: 8, y: 5, type: ROAD_TYPES.STRAIGHT_VERTICAL },
            { x: 8, y: 7, type: ROAD_TYPES.STRAIGHT_VERTICAL },
            // Connect to center
            { x: 5, y: 6, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            { x: 7, y: 6, type: ROAD_TYPES.STRAIGHT_HORIZONTAL },
            { x: 6, y: 5, type: ROAD_TYPES.STRAIGHT_VERTICAL },
            { x: 6, y: 7, type: ROAD_TYPES.STRAIGHT_VERTICAL }
        ],
        winConditions: {
            minScore: 5000,
            maxCongestion: 30,
            minFlowRate: 20
        }
    }
};

export class LevelManager {
    constructor(game) {
        console.log('Initializing LevelManager');
        this.game = game;
        this.currentLevel = 1;
        this.levelData = null;
        this.levelStartTime = 0;
        this.flowRate = 0;
        this.congestion = 0;
        this.vehiclesManaged = 0;
        
        // UI elements
        this.flowElement = document.getElementById('flow-value');
        this.congestionElement = document.getElementById('congestion-value');
        
        this.initializeLevelButtons();
        console.log('LevelManager initialized');
    }

    initializeLevelButtons() {
        const levelBtns = document.querySelectorAll('.level-btn');
        console.log('Level buttons found:', levelBtns.length);
        
        levelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                levelBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.currentLevel = parseInt(btn.dataset.level);
                console.log('Level selected:', this.currentLevel);
            });
        });
    }

    loadLevel(levelNumber) {
        console.log('Loading level:', levelNumber);
        this.currentLevel = levelNumber;
        this.levelData = LEVELS[levelNumber];
        
        if (!this.levelData) {
            console.error('Level data not found for level:', levelNumber);
            return null;
        }
        
        this.levelStartTime = Date.now();
        this.flowRate = 0;
        this.congestion = 0;
        this.vehiclesManaged = 0;

        // Configure game for level
        console.log('Configuring grid and vehicles for level', levelNumber);
        this.game.grid.resetGrid(this.levelData.gridSize);
        this.game.vehicleManager.setSpawnRate(this.levelData.spawnRate);
        
        // Place initial roads
        console.log('Placing initial roads for level', levelNumber);
        this.levelData.initialRoads.forEach(road => {
            this.game.grid.placePredefinedRoad(road.x, road.y, road.type);
        });
        
        // Initialize spawn points after placing roads
        this.game.vehicleManager.initializeSpawnPointsAndDestinations();

        return this.levelData;
    }

    update(deltaTime) {
        if (!this.levelData) return;

        // Update flow rate (vehicles per minute)
        const elapsedMinutes = (Date.now() - this.levelStartTime) / 60000;
        this.flowRate = this.vehiclesManaged / elapsedMinutes;
        
        // Update congestion (percentage of roads with waiting vehicles)
        const totalRoads = this.game.grid.countRoads();
        const congestedRoads = this.game.grid.countCongestedRoads();
        this.congestion = totalRoads > 0 ? (congestedRoads / totalRoads) * 100 : 0;

        // Update UI
        this.updateUI();

        // Check win/lose conditions
        this.checkGameConditions();
    }

    updateUI() {
        // Update flow rate display
        this.flowElement.textContent = Math.round(this.flowRate);
        this.updateFlowClass();

        // Update congestion display
        this.congestionElement.textContent = Math.round(this.congestion);
        this.updateCongestionClass();
    }

    updateFlowClass() {
        const flowElement = document.getElementById('traffic-flow');
        flowElement.classList.remove('good', 'medium', 'bad');
        
        if (this.flowRate >= this.levelData.winConditions.minFlowRate) {
            flowElement.classList.add('good');
        } else if (this.flowRate >= this.levelData.winConditions.minFlowRate * 0.6) {
            flowElement.classList.add('medium');
        } else {
            flowElement.classList.add('bad');
        }
    }

    updateCongestionClass() {
        const congestionElement = document.getElementById('congestion');
        congestionElement.classList.remove('good', 'medium', 'bad');
        
        if (this.congestion <= this.levelData.winConditions.maxCongestion * 0.5) {
            congestionElement.classList.add('good');
        } else if (this.congestion <= this.levelData.winConditions.maxCongestion) {
            congestionElement.classList.add('medium');
        } else {
            congestionElement.classList.add('bad');
        }
    }

    checkGameConditions() {
        const timeElapsed = (Date.now() - this.levelStartTime) / 1000;
        
        // Check for game over
        if (timeElapsed >= this.levelData.timeLimit) {
            this.game.gameState.gameOver();
            return;
        }

        // Check for win conditions
        if (this.game.gameState.score >= this.levelData.winConditions.minScore &&
            this.flowRate >= this.levelData.winConditions.minFlowRate &&
            this.congestion <= this.levelData.winConditions.maxCongestion) {
            this.game.gameState.levelComplete();
        }
    }

    vehicleCompleted() {
        this.vehiclesManaged++;
        // Add score based on current flow rate and congestion
        const basePoints = 10;
        const flowMultiplier = this.flowRate / this.levelData.winConditions.minFlowRate;
        const congestionPenalty = 1 - (this.congestion / 100);
        const points = Math.round(basePoints * flowMultiplier * congestionPenalty);
        this.game.gameState.addScore(points);
    }
} 