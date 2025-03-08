export class GameState {
    constructor(game) {
        this.game = game;
        
        // Game state UI elements
        this.startScreen = document.getElementById('start-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.uiOverlay = document.getElementById('ui-overlay');
        this.controlsHelp = document.getElementById('controls-help');
        
        console.log('GameState initialized');
        this.showStartScreen();
    }
    
    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.uiOverlay.style.display = 'none';
        this.controlsHelp.style.display = 'none';
    }
    
    showPauseScreen() {
        this.startScreen.classList.add('hidden');
        this.pauseScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
    }
    
    showGameOverScreen() {
        this.startScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
    }
    
    hideAllScreens() {
        this.startScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.uiOverlay.style.display = 'block';
        this.controlsHelp.style.display = 'block';
    }
    
    startGame() {
        console.log('Starting game');
        this.hideAllScreens();
        this.game.startGame();
    }
    
    togglePause() {
        if (this.game.state === 'playing') {
            this.pauseGame();
        } else if (this.game.state === 'paused') {
            this.resumeGame();
        }
    }
    
    pauseGame() {
        if (this.game.state === 'playing') {
            this.game.state = 'paused';
            this.showPauseScreen();
            console.log('Game paused');
        }
    }
    
    resumeGame() {
        if (this.game.state === 'paused') {
            this.game.state = 'playing';
            this.hideAllScreens();
            console.log('Game resumed');
        }
    }
    
    restartGame() {
        this.hideAllScreens();
        this.game.startGame();
        console.log('Game restarted');
    }
    
    quitToMenu() {
        this.game.state = 'menu';
        this.showStartScreen();
        console.log('Quit to menu');
    }

    gameOver() {
        this.state = GAME_STATES.GAME_OVER;
        this.isPaused = true;
        
        // Update final stats
        this.finalScoreElement.textContent = this.score;
        this.vehiclesManagedElement.textContent = this.game.levelManager.vehiclesManaged;
        this.avgFlowRateElement.textContent = Math.round(this.game.levelManager.flowRate);
        this.timePlayedElement.textContent = this.formatTime(this.time);
        
        // Show game over screen
        this.showGameOverScreen();
    }

    levelComplete() {
        console.log('Level complete!');
        // If there are more levels, load the next one
        const levelKeys = Object.keys(LEVELS);
        if (this.game.levelManager.currentLevel < levelKeys.length) {
            this.game.levelManager.currentLevel++;
            this.startGame();
        } else {
            this.gameOver();
        }
    }

    update(deltaTime) {
        if (this.state !== GAME_STATES.PLAYING) return;

        // Update game time
        this.time += deltaTime;
        
        // Update UI
        this.updateUI();
    }

    updateUI() {
        // Update score
        this.scoreElement.textContent = this.score;
        
        // Update timer
        this.timerElement.textContent = this.formatTime(this.time);
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    addScore(points) {
        this.score += points;
        this.updateUI();
    }

    render(ctx) {
        // No need to render anything here as we're using HTML overlays
    }
} 