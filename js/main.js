import { Game } from './game.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game');
    
    try {
        // Create and start the game
        const game = new Game();
        
        // Debug helper
        window.game = game; // For debugging in console
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}); 