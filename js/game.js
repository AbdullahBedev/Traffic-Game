import { Intersection } from './intersection.js';
import { GameState } from './gameState.js';
import { CarManager } from './carManager.js';
import { SoundManager } from './soundManager.js';

export class Game {
    constructor() {
        console.log('Initializing Traffic Light Management game');
        
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.timeStep = 1000 / 60; // 60 FPS
        
        // Game state
        this.state = 'menu'; // menu, playing, paused, gameOver
        this.difficulty = 'easy';
        this.score = 0;
        this.totalCars = 0;
        this.completedCars = 0;
        this.accidents = 0;
        this.longestWaitTime = 0;
        this.gameTime = 0;
        this.startTime = 0;
        // Track cars waiting too long
        this.carsWaitingTooLong = 0;
        this.waitingCarsMap = new Map(); // Track which cars are waiting too long
        // Track all waiting cars and their wait times
        this.waitingCars = new Map(); // Map of car ID to wait time
        
        // Initialize components
        this.setupCanvas();
        this.soundManager = new SoundManager();
        this.gameState = new GameState(this);
        this.intersection = new Intersection(this.canvas.width, this.canvas.height, this);
        this.carManager = new CarManager(this.intersection, this);
        
        // Bind events
        this.bindEvents();
        
        // Start game loop
        this.gameLoop();
        console.log('Game initialized');
    }
    
    setupCanvas() {
        // Adjust canvas size to match container
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            // Update intersection position if needed
            if (this.intersection) {
                this.intersection.resize(this.canvas.width, this.canvas.height);
            }
        });
    }
    
    bindEvents() {
        // Handle mouse click for traffic light toggling
        this.canvas.addEventListener('click', (e) => {
            if (this.state !== 'playing') return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // If clicked on a traffic light
            if (this.intersection.handleClick(x, y)) {
                this.soundManager.play('trafficLightChange');
            }
        });
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                this.gameState.togglePause();
                this.soundManager.play('buttonClick');
            }
        });
        
        // Difficulty buttons
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Play sound
                this.soundManager.play('buttonClick');
                
                // Remove selected class from all buttons
                difficultyButtons.forEach(btn => btn.classList.remove('selected'));
                // Add selected class to clicked button
                button.classList.add('selected');
                // Set difficulty
                this.difficulty = button.dataset.difficulty;
            });
        });
        
        // Add mute button functionality
        // First, add a mute button to the HTML
        const uiOverlay = document.getElementById('ui-overlay');
        const muteBtn = document.createElement('div');
        muteBtn.id = 'mute-btn';
        muteBtn.className = 'control-btn';
        muteBtn.innerHTML = '🔊';
        muteBtn.title = 'Toggle Sound';
        muteBtn.style.position = 'absolute';
        muteBtn.style.top = '10px';
        muteBtn.style.right = '10px';
        muteBtn.style.cursor = 'pointer';
        muteBtn.style.zIndex = '10';
        muteBtn.style.fontSize = '24px';
        muteBtn.style.color = 'white';
        muteBtn.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        document.getElementById('game-container').appendChild(muteBtn);
        
        // Add event listener
        muteBtn.addEventListener('click', () => {
            const isMuted = this.soundManager.toggleMute();
            muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
        });
        
        // Game control buttons
        document.getElementById('start-btn').addEventListener('click', () => {
            this.soundManager.play('buttonClick');
            this.soundManager.play('gameStart');
            this.gameState.startGame();
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.soundManager.play('buttonClick');
            this.gameState.resumeGame();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.soundManager.play('buttonClick');
            this.soundManager.play('gameStart');
            this.gameState.restartGame();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.soundManager.play('buttonClick');
            this.gameState.quitToMenu();
        });
        
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.soundManager.play('buttonClick');
            this.soundManager.play('gameStart');
            this.gameState.restartGame();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.soundManager.play('buttonClick');
            this.gameState.quitToMenu();
        });
        
        // Add theme toggle button
        const themeToggle = document.createElement('div');
        themeToggle.id = 'theme-toggle';
        themeToggle.className = 'control-btn';
        themeToggle.innerHTML = '☀️';
        themeToggle.title = 'Toggle Dark/Light Theme';
        document.getElementById('game-container').appendChild(themeToggle);
        
        // Add event listener for theme toggle
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            themeToggle.innerHTML = document.body.classList.contains('dark-theme') ? '🌙' : '☀️';
            this.soundManager.play('buttonClick');
        });
    }
    
    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.totalCars = 0;
        this.completedCars = 0;
        this.accidents = 0;
        this.longestWaitTime = 0;
        this.gameTime = 0;
        this.startTime = Date.now();
        // Reset waiting cars
        this.carsWaitingTooLong = 0;
        this.waitingCarsMap = new Map();
        this.waitingCars = new Map();
        
        // Initialize components for the game
        this.intersection.reset();
        this.carManager.reset();
        
        // Set spawn rate based on difficulty
        switch (this.difficulty) {
            case 'easy':
                this.carManager.setSpawnRate(3000); // ms between spawns
                break;
            case 'medium':
                this.carManager.setSpawnRate(2000);
                break;
            case 'hard':
                this.carManager.setSpawnRate(1000);
                break;
        }
        
        // Update UI
        document.getElementById('score-value').textContent = '0';
        document.getElementById('accident-value').textContent = '0';
        document.getElementById('flow-value').textContent = '0';
        document.getElementById('wait-value').textContent = '0';
        
        console.log(`Game started with ${this.difficulty} difficulty`);
    }
    
    gameOver(reason) {
        this.state = 'gameOver';
        
        // Play game over sound
        this.soundManager.play('gameOver');
        
        // Update game over screen
        document.getElementById('game-over-reason').textContent = reason;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('vehicles-managed').textContent = this.completedCars;
        document.getElementById('avg-flow-rate').textContent = 
            Math.round((this.completedCars / (this.gameTime / 60000)) * 10) / 10;
        document.getElementById('time-played').textContent = this.formatTime(this.gameTime);
        document.getElementById('total-accidents').textContent = this.accidents;
        document.getElementById('max-wait-time').textContent = Math.round(this.longestWaitTime / 1000);
        
        console.log('Game over:', reason);
    }
    
    addScore(points) {
        this.score += points;
        document.getElementById('score-value').textContent = this.score;
    }
    
    updateMaxWaitTime(waitTime, carId) {
        // If car is waiting, update its wait time in our tracking map
        if (waitTime > 0) {
            this.waitingCars.set(carId, waitTime);
        } else if (this.waitingCars.has(carId)) {
            // Car is no longer waiting, remove it from our tracking
            this.waitingCars.delete(carId);
            
            // Recalculate the longest wait time from remaining waiting cars
            this.recalculateLongestWaitTime();
        }
        
        // Only update the max wait time UI if a car has been waiting for more than 10 seconds
        if (waitTime > 10000 && waitTime > this.longestWaitTime) {
            this.longestWaitTime = waitTime;
            
            // Update UI
            const waitSeconds = Math.round(this.longestWaitTime / 1000);
            document.getElementById('wait-value').textContent = waitSeconds;
            
            // Update wait time color class
            const waitElement = document.getElementById('max-wait');
            waitElement.classList.remove('good', 'medium', 'bad');
            
            if (waitSeconds > 25) {
                waitElement.classList.add('bad');
                // Play warning sound for critical wait time
                if (waitSeconds === 25 || waitSeconds === 28) {
                    this.soundManager.play('carHorn', 0.5);
                }
            } else if (waitSeconds > 15) {
                waitElement.classList.add('medium');
            } else {
                waitElement.classList.add('good');
            }
        }
        
        // Track cars waiting too long - using carId to avoid counting the same car multiple times
        if (waitTime >= 30000) {
            if (carId && !this.waitingCarsMap.has(carId)) {
                this.waitingCarsMap.set(carId, true);
                this.carsWaitingTooLong++;
                
                // Update the UI to show warning about waiting cars
                const waitCountElement = document.getElementById('wait-count');
                if (waitCountElement) {
                    waitCountElement.textContent = `${this.carsWaitingTooLong}/3`;
                    waitCountElement.style.color = this.carsWaitingTooLong >= 2 ? 'red' : 'orange';
                } else {
                    // Create warning element if it doesn't exist
                    const uiOverlay = document.getElementById('ui-overlay');
                    if (uiOverlay) {
                        const warningDiv = document.createElement('div');
                        warningDiv.id = 'wait-warning';
                        warningDiv.style.position = 'absolute';
                        warningDiv.style.top = '70px';
                        warningDiv.style.left = '10px';
                        warningDiv.style.padding = '5px';
                        warningDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
                        warningDiv.style.borderRadius = '5px';
                        warningDiv.style.color = 'white';
                        warningDiv.innerHTML = `Cars waiting too long: <span id="wait-count" style="color: orange;">${this.carsWaitingTooLong}/3</span>`;
                        uiOverlay.appendChild(warningDiv);
                    }
                }
                
                // Play warning sound
                this.soundManager.play('carHorn', 0.7);
                
                // Game over if 3 cars have waited more than 30 seconds
                if (this.carsWaitingTooLong >= 3) {
                    this.gameOver('3 cars were waiting for more than 30 seconds!');
                }
            }
        } else if (carId && this.waitingCarsMap.has(carId)) {
            // If car is no longer waiting too long, remove it from the map
            this.waitingCarsMap.delete(carId);
            this.carsWaitingTooLong--;
            
            // Update the UI
            const waitCountElement = document.getElementById('wait-count');
            if (waitCountElement) {
                waitCountElement.textContent = `${this.carsWaitingTooLong}/3`;
                waitCountElement.style.color = this.carsWaitingTooLong >= 2 ? 'red' : 'orange';
            }
        }
    }
    
    // New method to recalculate the longest wait time from all waiting cars
    recalculateLongestWaitTime() {
        let newLongestWaitTime = 0;
        
        // Find the new longest wait time among all waiting cars
        this.waitingCars.forEach((waitTime, carId) => {
            if (waitTime > 10000 && waitTime > newLongestWaitTime) {
                newLongestWaitTime = waitTime;
            }
        });
        
        // If the longest wait time has changed, update it
        if (newLongestWaitTime !== this.longestWaitTime) {
            this.longestWaitTime = newLongestWaitTime;
            
            // Update UI
            const waitSeconds = Math.round(this.longestWaitTime / 1000);
            document.getElementById('wait-value').textContent = waitSeconds;
            
            // Update wait time color class
            const waitElement = document.getElementById('max-wait');
            waitElement.classList.remove('good', 'medium', 'bad');
            
            if (waitSeconds > 25) {
                waitElement.classList.add('bad');
            } else if (waitSeconds > 15) {
                waitElement.classList.add('medium');
            } else if (waitSeconds > 0) {
                waitElement.classList.add('good');
            }
            
            // If there are no cars waiting more than 10 seconds, reset the counter to 0
            if (newLongestWaitTime === 0) {
                document.getElementById('wait-value').textContent = '0';
                waitElement.classList.remove('good', 'medium', 'bad');
                waitElement.classList.add('good');
            }
        }
    }
    
    carCompleted() {
        this.completedCars++;
        this.addScore(10);
        
        // Play car passing sound occasionally
        if (Math.random() < 0.3) {
            this.soundManager.play('carPass', 0.3);
        }
        
        // Update flow rate
        const flowRate = Math.round((this.completedCars / (this.gameTime / 60000)) * 10) / 10;
        document.getElementById('flow-value').textContent = flowRate;
        
        // Update flow rate color
        const flowElement = document.getElementById('traffic-flow');
        flowElement.classList.remove('good', 'medium', 'bad');
        
        if (flowRate > 30) {
            flowElement.classList.add('good');
        } else if (flowRate > 15) {
            flowElement.classList.add('medium');
        } else {
            flowElement.classList.add('bad');
        }
    }
    
    carAccident() {
        this.accidents++;
        this.addScore(-50); // Penalty for accident
        
        // Play crash sound
        this.soundManager.play('carCrash');
        
        // Update UI
        document.getElementById('accident-value').textContent = this.accidents;
        
        // Game over if too many accidents
        if (this.accidents >= 3) {
            this.gameOver('Too many accidents! (3)');
        }
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update timing accumulators
        this.accumulator += deltaTime;
        
        if (this.state === 'playing') {
            this.gameTime = Date.now() - this.startTime;
            document.getElementById('timer-value').textContent = this.formatTime(this.gameTime);
        }
        
        // Fixed time step updates
        while (this.accumulator >= this.timeStep) {
            this.update(this.timeStep);
            this.accumulator -= this.timeStep;
        }
        
        // Render at screen refresh rate
        this.render();
        
        // Continue game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        if (this.state === 'playing') {
            this.intersection.update(deltaTime);
            this.carManager.update(deltaTime);
        }
    }
    
    render() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render game elements
        this.intersection.render(this.ctx);
        this.carManager.render(this.ctx);
    }
} 