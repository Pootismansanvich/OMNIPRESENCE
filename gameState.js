import * as THREE from 'three';

// Game state object to hold all shared state
export const gameState = {
    // Core game state
    isStarted: false,
    isOver: false,
    isWon: false,
    isMusicMuted: false,
    showOmniHint: false,

    // Player state  
    health: 100,
    bloodPresence: 0,
    moveForward: false,
    moveBackward: false, 
    moveLeft: false,
    moveRight: false,
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    canJump: true,
    onGround: true,

    // Weapon state
    currentWeapon: 'pistol',
    isScoping: false,
    canOpenerCharge: 0,
    unlockedWeapons: ['pistol', 'shotgun'],
    availableWeapons: ['rifle', 'moneymaker', 'slash', 'pearl', 'canopener', 'necronomicon', 'darkmatter', 'shockback', 'glitchgun'],
    hasAllBasicWeapons: false,
    appliedUpgrades: new Set(),

    // Cooldowns
    lastCoinFlip: 0,
    lastSlashTime: 0,
    lastOmniShot: 0,
    lastRicochetShot: 0,
    lastPearlThrow: 0,
    lastDarkMatterShot: 0,
    lastGravityGrenade: 0,

    // Game objects
    enemies: [],
    bullets: [],
    coins: [],
    beams: [], 
    slashes: [],
    deadBodies: [],
    pearls: [],
    ricochets: [],
    darkMatterWells: [],
    gravityGrenades: [],
    necroShots: [],

    // Upgrade definitions
    upgrades: {
        pistol: ['High Velocity Rounds', 'Recoil Control'],
        shotgun: ['Spread Control', 'Double Barrel'],
        rifle: ['Armor Piercing', 'Rapid Fire'],
        moneymaker: ['Golden Bullets', 'Fortune Favor'],
        slash: ['Extended Range', 'Quick Cooldown'],
        pearl: ['Blast Radius', 'Quick Recovery'],
        omnipresence: ['Chain Reaction', 'Time Dilation'],
        canopener: ['Extended Ricochet', 'Piercing Shot'],
        necronomicon: ['Cursed Projectiles', 'Soul Harvester'],
        darkmatter: ['Extended Radius', 'Reduced Cooldown'],
        gravitygrenade: ['Increased Radius', 'Longer Freeze'],
        shockback: ['Quick Reload', 'Increased Damage']
    },

    // Cooldown constants 
    COIN_COOLDOWN: 1000,
    SLASH_COOLDOWN: 10000,
    OMNI_COOLDOWN: 500,
    RICOCHET_COOLDOWN: 3000,
    PEARL_COOLDOWN: 3000,
    DARK_MATTER_COOLDOWN: 5000,
    GRAVITY_GRENADE_COOLDOWN: 1000,

    // Reset game state
    reset() {
        this.isStarted = false;
        this.isOver = false;
        this.isWon = false;
        this.health = 100;
        this.bloodPresence = 0;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.velocity = new THREE.Vector3();
        this.currentWeapon = 'pistol';
        this.unlockedWeapons = ['pistol', 'shotgun'];
        this.availableWeapons = ['rifle', 'moneymaker', 'slash', 'pearl', 'canopener', 'necronomicon', 'darkmatter', 'shockback', 'glitchgun'];
        this.hasAllBasicWeapons = false;
        this.appliedUpgrades = new Set();
        this.enemies = [];
        this.bullets = [];
        this.coins = [];
        this.beams = [];
        this.slashes = [];
        this.deadBodies = [];
        this.pearls = [];
        this.ricochets = [];
        this.darkMatterWells = [];
        this.gravityGrenades = [];
        this.necroShots = [];
    }
};