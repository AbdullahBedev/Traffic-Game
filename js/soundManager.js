export class SoundManager {
    constructor() {
        this.sounds = {};
        this.supported = this.checkAudioSupport();
        this.muted = false;
        
        if (this.supported) {
            this.loadSounds();
            console.log('Sound system initialized');
        } else {
            console.warn('Audio not supported in this browser, sound disabled');
        }
    }
    
    checkAudioSupport() {
        try {
            // Try to create an audio context to check support
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                return false;
            }
            
            // Check for basic Audio element support
            const audio = new Audio();
            if (!audio || typeof audio.play !== 'function') {
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking audio support:', error);
            return false;
        }
    }
    
    loadSounds() {
        if (!this.supported) return;
        
        // Define all sound effects
        const soundFiles = {
            trafficLightChange: 'assets/sounds/traffic_light.mp3',
            carHorn: 'assets/sounds/car_horn.mp3',
            carCrash: 'assets/sounds/car_crash.mp3',
            gameStart: 'assets/sounds/game_start.mp3',
            gameOver: 'assets/sounds/game_over.mp3',
            carPass: 'assets/sounds/car_pass.mp3',
            buttonClick: 'assets/sounds/button_click.mp3'
        };
        
        // Create Audio objects for each sound
        for (const [name, path] of Object.entries(soundFiles)) {
            this.sounds[name] = new Audio();
            this.sounds[name].src = path;
            
            // Handle loading errors without breaking the game
            this.sounds[name].onerror = () => {
                console.warn(`Could not load sound: ${path}`);
                // Create a silent dummy sound in case of error
                this.sounds[name] = {
                    play: () => {},
                    pause: () => {},
                    currentTime: 0
                };
            };
        }
    }
    
    play(soundName, volume = 1.0) {
        if (!this.supported || this.muted) return;
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound ${soundName} not found`);
            return;
        }
        
        // Reset the sound to the beginning in case it's already playing
        sound.currentTime = 0;
        sound.volume = volume;
        
        // Play the sound with error handling
        try {
            const playPromise = sound.play();
            
            // Handle the promise returned by play() in modern browsers
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Error playing sound ${soundName}:`, error);
                });
            }
        } catch (error) {
            console.warn(`Error playing sound ${soundName}:`, error);
        }
    }
    
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
    
    setMute(isMuted) {
        this.muted = isMuted;
    }
    
    isMuted() {
        return this.muted;
    }
    
    isSupported() {
        return this.supported;
    }
} 