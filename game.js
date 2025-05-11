import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { gameState } from './gameState.js';

let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();
let isMusicMuted = false; // Track music mute state
let showOmniHint = false; // Track if we should show the "Press T" hint

let viewmodelScene, viewmodelCamera;
let currentViewModel;
let viewmodels = {};

function initViewModels() {
    viewmodelScene = new THREE.Scene();
    viewmodelCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10);
    
    // Pistol (based on Glock)
    const pistolModel = new THREE.Group();
    const slide = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x2b2b2b })
    );
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.15, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    frame.position.y = -0.08;
    const grip = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.2, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    grip.position.set(0, -0.2, 0.07);
    grip.rotation.x = 0.3;
    pistolModel.add(slide, frame, grip);
    viewmodels.pistol = pistolModel;

    // Shotgun (based on Remington 870)
    const shotgunModel = new THREE.Group();
    const receiver = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.15, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    const barrel = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x2b2b2b })
    );
    barrel.position.z = 0.5;
    const pump = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.09, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    pump.position.z = 0.3;
    const stock = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.12, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    stock.position.z = -0.35;
    shotgunModel.add(receiver, barrel, pump, stock);
    viewmodels.shotgun = shotgunModel;

    // Rifle (based on M4)
    const rifleModel = new THREE.Group();
    const upperReceiver = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x2b2b2b })
    );
    const lowerReceiver = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.15, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x2b2b2b })
    );
    lowerReceiver.position.y = -0.08;
    const rifleBarrel = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x2b2b2b })
    );
    rifleBarrel.position.z = 0.4;
    const handguard = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    handguard.position.z = 0.35;
    const rifleStock = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.1, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x2b2b2b })
    );
    rifleStock.position.z = -0.3;
    rifleModel.add(upperReceiver, lowerReceiver, rifleBarrel, handguard, rifleStock);
    viewmodels.rifle = rifleModel;

    // MoneyMaker (stylized black and gold pistol)
    const moneyMakerModel = new THREE.Group();
    const mmSlide = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xFFD700 })  // Gold slide
    );
    const mmFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.18, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x111111 })  // Black frame
    );
    mmFrame.position.y = -0.1;
    const mmGrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.25, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x111111 })  // Black grip
    );
    mmGrip.position.set(0, -0.25, 0.08);
    mmGrip.rotation.x = 0.3;
    const mmAccents = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.02, 0.31),
        new THREE.MeshStandardMaterial({ color: 0xFFD700 })  // Gold accents
    );
    mmAccents.position.y = -0.05;
    moneyMakerModel.add(mmSlide, mmFrame, mmGrip, mmAccents);
    viewmodels.moneymaker = moneyMakerModel;

    // Slash weapon (energy sword style)
    const slashModel = new THREE.Group();
    const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.6, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.5 })
    );
    const crossguard = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.05, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    crossguard.position.y = -0.3;
    const hilt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    hilt.position.y = -0.4;
    slashModel.add(blade, crossguard, hilt);
    viewmodels.slash = slashModel;

    // Pearl weapon model
    const pearlModel = new THREE.Group();
    const pearl = new THREE.Mesh(
        new THREE.SphereGeometry(0.2),
        new THREE.MeshStandardMaterial({ color: 0x800080, emissive: 0x400040 })
    );
    const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.z = -0.2;
    pearlModel.add(pearl, handle);
    viewmodels.pearl = pearlModel;

    // Omni Presence weapon model
    const omniModel = new THREE.Group();
    const omniBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.08, 0.8, 8),
        new THREE.MeshStandardMaterial({ 
            color: 0x4B0082,
            metalness: 0.9,
            roughness: 0.2
        }) // Deep purple with metallic finish
    );
    omniBarrel.rotation.z = Math.PI / 2;
    const omniBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.15, 0.15),
        new THREE.MeshStandardMaterial({ 
            color: 0x800080,
            metalness: 0.8,
            roughness: 0.3
        })
    );
    omniBody.position.x = -0.2;
    const omniEnergy = new THREE.Mesh(
        new THREE.SphereGeometry(0.05),
        new THREE.MeshStandardMaterial({ 
            color: 0xFF00FF,
            emissive: 0xFF00FF,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        })
    );
    omniEnergy.position.x = 0.4;
    omniModel.add(omniBarrel, omniBody, omniEnergy);
    viewmodels.omnipresence = omniModel;

    // Can Opener weapon model
    const canOpenerModel = new THREE.Group();
    const canOpenerBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    canOpenerBarrel.rotation.z = Math.PI / 2;
    canOpenerBarrel.position.x = 0.4;
    
    const canOpenerBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.12, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    
    const canOpenerScope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.07, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    canOpenerScope.rotation.z = Math.PI / 2;
    canOpenerScope.position.set(0.1, 0.1, 0);
    
    canOpenerModel.add(canOpenerBarrel, canOpenerBody, canOpenerScope);
    viewmodels.canopener = canOpenerModel;

    // Necronomicon weapon model
    const necroModel = new THREE.Group();
    const necroBook = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.4, 0.1),
        new THREE.MeshStandardMaterial({ 
            color: 0x330000, 
            roughness: 0.9,
            metalness: 0.2
        })
    );
    necroBook.rotation.x = Math.PI / 4;
    
    const necroSymbol = new THREE.Mesh(
        new THREE.CircleGeometry(0.1, 5),
        new THREE.MeshStandardMaterial({ 
            color: 0x990000, 
            emissive: 0x990000,
            emissiveIntensity: 0.3
        })
    );
    necroSymbol.position.set(0, 0, 0.051);
    necroSymbol.rotation.x = Math.PI / 4;
    
    necroModel.add(necroBook, necroSymbol);
    viewmodels.necronomicon = necroModel;

    // Dark Matter Gauntlet
    const darkMatterModel = new THREE.Group();
    const gauntlet = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.2, 0.5),
        new THREE.MeshStandardMaterial({ 
            color: 0x330066, 
            metalness: 0.7,
            roughness: 0.3 
        })
    );
    
    const fingers = new THREE.Group();
    for (let i = 0; i < 5; i++) {
        const finger = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8),
            new THREE.MeshStandardMaterial({ 
                color: 0x330066,
                metalness: 0.8,
                roughness: 0.2
            })
        );
        finger.position.set(0.15 - i * 0.07, 0.15, 0.2);
        finger.rotation.x = -0.3;
        fingers.add(finger);
    }
    
    const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.08),
        new THREE.MeshStandardMaterial({ 
            color: 0x9900CC, 
            emissive: 0x9900CC,
            emissiveIntensity: 0.5
        })
    );
    core.position.set(0, 0.1, 0.3);
    
    darkMatterModel.add(gauntlet, fingers, core);
    viewmodels.darkmatter = darkMatterModel;

    // ShockBack Shotgun
    const shockbackModel = new THREE.Group();
    const shockReceiver = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.15, 0.3),
        new THREE.MeshStandardMaterial({ 
            color: 0x000066,
            metalness: 0.8,
            roughness: 0.2
        })
    );
    const shockBarrel = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.7),
        new THREE.MeshStandardMaterial({ 
            color: 0x000033,
            metalness: 0.9,
            roughness: 0.1
        })
    );
    shockBarrel.position.z = 0.5;
    const shockPump = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.09, 0.15),
        new THREE.MeshStandardMaterial({ 
            color: 0x0000ff,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x000066
        })
    );
    shockPump.position.z = 0.3;
    const shockStock = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.12, 0.4),
        new THREE.MeshStandardMaterial({ 
            color: 0x000033,
            metalness: 0.8,
            roughness: 0.2
        })
    );
    shockStock.position.z = -0.35;
    
    // Add energy effects
    const energyRing1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.06, 0.01, 8, 16),
        new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        })
    );
    energyRing1.position.z = 0.6;
    energyRing1.rotation.y = Math.PI / 2;
    
    const energyRing2 = energyRing1.clone();
    energyRing2.position.z = 0.4;
    
    shockbackModel.add(shockReceiver, shockBarrel, shockPump, shockStock, energyRing1, energyRing2);
    viewmodels.shockback = shockbackModel;

    // Glitch Gun model
    const glitchModel = new THREE.Group();
    const glitchParts = [];
    // Create random glitchy parts
    for (let i = 0; i < 30; i++) {
        const size = Math.random() * 0.2 + 0.05;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
            emissive: Math.random() * 0xffffff,
            emissiveIntensity: Math.random(),
            transparent: true,
            opacity: Math.random() * 0.5 + 0.5
        });
        const part = new THREE.Mesh(geometry, material);
        
        // Position randomly but maintain rough gun shape
        part.position.x = Math.random() * 1 - 0.5; // Width
        part.position.y = Math.random() * 0.3 - 0.15; // Height
        part.position.z = Math.random() * 1.2 - 0.6; // Length
        
        part.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        glitchParts.push(part);
        glitchModel.add(part);
    }
    
    // Add base shape to maintain gun silhouette
    const baseShape = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.2, 1.2),
        new THREE.MeshStandardMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        })
    );
    glitchModel.add(baseShape);
    
    viewmodels.glitchgun = glitchModel;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    viewmodelScene.add(light);
    const ambient = new THREE.AmbientLight(0x666666);
    viewmodelScene.add(ambient);

    viewmodelCamera.position.set(0, 0, 2);

    currentViewModel = viewmodels.pistol;
    viewmodelScene.add(currentViewModel);
    
    Object.values(viewmodels).forEach(model => {
        if (!model || !model.children || model.children.length === 0) {
            console.warn('Potentially invalid viewmodel detected');
        }
    });
}

function updateViewModel() {
    if (currentViewModel) {
        const bobAmount = (moveForward || moveBackward || moveLeft || moveRight) ? 0.05 : 0;
        currentViewModel.position.y = Math.sin(performance.now() * 0.01) * bobAmount;
        
        let recoilMultiplier = 1;
        if (gameState.currentWeapon === 'pistol' && gameState.appliedUpgrades.has('pistol-Recoil Control')) {
            recoilMultiplier = 0.5;
        }
        
        if (gameState.currentWeapon === 'rifle' && gameState.appliedUpgrades.has('rifle-Rapid Fire')) {
            currentViewModel.rotation.x = Math.sin(performance.now() * 0.03) * 0.05 * recoilMultiplier;
        } else {
            currentViewModel.rotation.x = 0;
        }
        
        // Handle Can Opener scoping animation
        if (gameState.currentWeapon === 'canopener' && gameState.isScoping) {
            // Move viewmodel toward center when scoping
            currentViewModel.position.set(0.1, -0.15, -0.5);
            // Add slight sway while scoped
            currentViewModel.position.x += Math.sin(performance.now() * 0.001) * 0.01;
            currentViewModel.position.y += Math.cos(performance.now() * 0.001) * 0.01;
            
            // Charge effect
            gameState.canOpenerCharge = Math.min(1, gameState.canOpenerCharge + 0.02);
            document.getElementById('crosshair').style.color = `rgb(255, ${255 - gameState.canOpenerCharge * 255}, ${255 - gameState.canOpenerCharge * 255})`;
            document.getElementById('crosshair').textContent = '⊕';
        } else {
            currentViewModel.position.set(0.3, -0.2, -0.7);
            document.getElementById('crosshair').style.color = 'red';
            document.getElementById('crosshair').textContent = '+';
        }
    }
}

function init() {
    // Initialize audio tracks
    const tracks = [
        document.getElementById('background-music1'),
        document.getElementById('background-music2'),
        document.getElementById('background-music3')
    ];
    
    // Add ended event listener to each track
    tracks.forEach(track => {
        track.addEventListener('ended', () => {
            playRandomTrack(tracks);
        });
    });
    
    // Add click listener for initial playback
    document.addEventListener('click', function() {
        if (!isMusicMuted && !tracks.some(track => !track.paused)) {
            playRandomTrack(tracks);
        }
    });
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 0); // Set initial spawn position explicitly

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Setup main menu controls
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('show-instructions').addEventListener('click', () => {
        const instructions = document.getElementById('instructions');
        instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    });

    const light = new THREE.AmbientLight(0x404040);
    scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Walls with dark blue lines
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x505050,
        roughness: 0.6,
        metalness: 0.1
    });

    const lineMaterial = new THREE.MeshStandardMaterial({
        color: 0x0000ff, 
        roughness: 0.4,
        metalness: 0.2
    });

    function createWallWithLines(width, height, depth, position, rotation) {
        const wallGroup = new THREE.Group();
        
        // Main wall
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            wallMaterial
        );
        wallGroup.add(wall);

        // Add random lines
        for (let i = 0; i < 15; i++) {
            const lineWidth = Math.random() * 0.3 + 0.1;
            const lineHeight = Math.random() * 10 + 5;
            const line = new THREE.Mesh(
                new THREE.BoxGeometry(lineWidth, lineHeight, depth + 0.1),
                lineMaterial
            );
            
            // Position the line randomly on the wall
            line.position.y = Math.random() * 15 - 5;
            line.position.x = Math.random() * (width - lineWidth) - (width/2 - lineWidth/2);
            line.position.z = rotation ? 0 : (depth/2 + 0.05);
            
            wallGroup.add(line);
        }

        wallGroup.position.copy(position);
        if (rotation) {
            wallGroup.rotation.y = Math.PI / 2;
        }
        
        return wallGroup;
    }

    // Create walls with lines
    const northWall = createWallWithLines(100, 20, 2, new THREE.Vector3(0, 10, -50), false);
    scene.add(northWall);

    const southWall = createWallWithLines(100, 20, 2, new THREE.Vector3(0, 10, 50), false);
    scene.add(southWall);

    const eastWall = createWallWithLines(100, 20, 2, new THREE.Vector3(50, 10, 0), true);
    scene.add(eastWall);

    const westWall = createWallWithLines(100, 20, 2, new THREE.Vector3(-50, 10, 0), true);
    scene.add(westWall);

    // Add some architectural details
    const columnGeometry = new THREE.BoxGeometry(2, 20, 2);
    const columnMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x404040,
        roughness: 0.5,
        metalness: 0.3
    });

    // Add columns in the corners
    const cornerPositions = [
        [-49, 10, -49],
        [-49, 10, 49],
        [49, 10, -49],
        [49, 10, 49]
    ];

    cornerPositions.forEach(pos => {
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.set(...pos);
        scene.add(column);
    });

    // Add support beams across the ceiling
    const beamGeometry = new THREE.BoxGeometry(100, 1, 1);
    const beamMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x303030,
        roughness: 0.4,
        metalness: 0.4
    });

    for (let i = -40; i <= 40; i += 20) {
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(0, 19.5, i);
        scene.add(beam);
    }

    const platformGeometry = new THREE.BoxGeometry(5, 1, 5);
    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Changed to blue
    
    const platformPositions = [
        { x: 10, y: 3, z: 10 },
        { x: -8, y: 5, z: -8 },
        { x: 15, y: 7, z: -12 },
        { x: -12, y: 4, z: 15 },
        { x: 0, y: 6, z: -20 },
        { x: 20, y: 8, z: 0 },
        { x: 7, y: 3, z: 13 }, // New platform next to stairs
    ];

    // Add stairs to the first platform
    const stairCount = 6;
    const stairHeight = platformPositions[0].y / stairCount;
    const stairDepth = 1;
    const stairWidth = 2;
    
    for (let i = 0; i < stairCount; i++) {
        const stairGeometry = new THREE.BoxGeometry(stairWidth, stairHeight, stairDepth);
        const stairMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const stair = new THREE.Mesh(stairGeometry, stairMaterial);
        
        // Position each stair leading to the first platform
        stair.position.set(
            platformPositions[0].x - 3, // Offset from platform
            (stairHeight * i) + (stairHeight / 2),
            platformPositions[0].z + i
        );
        
        stair.userData.isPlatform = true;
        scene.add(stair);
    }

    platformPositions.forEach(pos => {
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(pos.x, pos.y, pos.z);
        platform.userData.isPlatform = true;
        scene.add(platform);
    });

    controls = new PointerLockControls(camera, document.body);

    controls.addEventListener('lock', function () {
        if (gameState.gameStarted) {
            document.getElementById('game-ui').style.display = 'block';
        }
    });

    controls.addEventListener('unlock', function () {
        document.getElementById('game-ui').style.display = 'none';
        
        // Only reset movement if game is active and not over
        if (gameState.gameStarted && !gameState.gameOver) {
            moveForward = false;
            moveBackward = false;
            moveLeft = false;
            moveRight = false;
        }
    });

    document.addEventListener('click', function(event) {
        // Ignore clicks on the game over overlay
        if (event.target.closest('.game-over-overlay') || 
            event.target.closest('.weapon-choice-overlay') ||
            event.target.closest('.upgrade-overlay')) {
            return;
        }
        
        if (gameState.gameStarted && !gameState.gameOver) {
            try {
                controls.lock();
            } catch (error) {
                console.warn('Pointer lock request was rejected:', error);
            }
        }
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keypress', onKeypress);
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    initViewModels();
    
    // Add movement pattern assignment to enemy creation
    spawnEnemies();
    
    // Add mute button listener
    document.getElementById('mute-button').addEventListener('click', toggleMute);
}

function spawnEnemies() {
    // First, make sure we don't already have too many enemies
    if (gameState.enemies.length >= 17) {
        console.log("Too many enemies already present, removing excess");
        // Remove excess enemies to maintain the cap
        while (gameState.enemies.length > 15) {
            const enemyToRemove = gameState.enemies.pop();
            scene.remove(enemyToRemove);
        }
        return; // Don't spawn more if we're already at the cap
    }

    const movementPatterns = ['direct', 'flanking', 'circling', 'zigzag'];
    
    // Set a consistent enemy count for all waves (15-17)
    let enemyCount = 15;
    
    // Small variation based on game progression
    if (gameState.unlockedWeapons.includes('omnipresence')) {
        enemyCount = 17; // Maximum challenge when player has Omnipresence
    } else if (gameState.unlockedWeapons.length > 4) {
        enemyCount = 16; // Medium challenge with multiple weapons
    }
    
    // Ensure we don't exceed the cap when combining existing and new enemies
    const remainingSlots = 17 - gameState.enemies.length;
    enemyCount = Math.min(enemyCount, remainingSlots);
    
    console.log(`Spawning ${enemyCount} enemies. Current count: ${gameState.enemies.length}`);
    
    for (let i = 0; i < enemyCount; i++) {
        const enemy = new THREE.Group();
        
        const torsoGeometry = new THREE.BoxGeometry(0.6, 1, 0.3);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333 
        });
        const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
        torso.position.y = 0.5;
        enemy.add(torso);

        const headGeometry = new THREE.SphereGeometry(0.2);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.2;
        enemy.add(head);
        
        // Add skull for post-omnipresence enemies
        if (gameState.gameWon) {
            const skullGeometry = new THREE.SphereGeometry(0.15);
            const skullMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
            const skull = new THREE.Mesh(skullGeometry, skullMaterial);
            skull.position.y = 1.5;
            enemy.add(skull);
            
            // Add eye sockets to the skull
            const eyeSocketGeometry = new THREE.SphereGeometry(0.05);
            const eyeSocketMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            
            const leftEyeSocket = new THREE.Mesh(eyeSocketGeometry, eyeSocketMaterial);
            leftEyeSocket.position.set(-0.05, 1.5, 0.1);
            enemy.add(leftEyeSocket);
            
            const rightEyeSocket = new THREE.Mesh(eyeSocketGeometry, eyeSocketMaterial);
            rightEyeSocket.position.set(0.05, 1.5, 0.1);
            enemy.add(rightEyeSocket);
        }

        const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.4, 0.6, 0);
        enemy.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.4, 0.6, 0);
        enemy.add(rightArm);

        const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.2, 0, 0);
        enemy.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.2, 0, 0);
        enemy.add(rightLeg);

        let validPosition = false;
        let attempts = 0;
        let position;

        // Try to find a valid spawn position that doesn't overlap with other enemies
        while (!validPosition && attempts < 50) {
            position = new THREE.Vector3(
                Math.random() * 90 - 45,
                1,
                Math.random() * 90 - 45
            );

            validPosition = true;
            for (const existingEnemy of gameState.enemies) {
                if (position.distanceTo(existingEnemy.position) < 3) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        }

        enemy.position.copy(position);
        enemy.health = 100;
        enemy.hitCooldown = 0;
        enemy.damageCooldown = 0;
        enemy.startY = enemy.position.y;
        enemy.bobOffset = Math.random() * Math.PI * 2;
        enemy.movementPattern = movementPatterns[Math.floor(Math.random() * movementPatterns.length)];
        enemy.patternTimer = 0;
        enemy.lastValidPosition = enemy.position.clone();
        enemy.isFrozen = false;
        enemy.lastShockbackShot = 0;

        gameState.enemies.push(enemy);
        scene.add(enemy);
    }
    
    // Final safety check - if we somehow exceeded our cap, remove excess
    if (gameState.enemies.length > 17) {
        console.warn(`Enemy cap exceeded with ${gameState.enemies.length} enemies. Trimming to 17.`);
        while (gameState.enemies.length > 17) {
            const enemyToRemove = gameState.enemies.pop();
            scene.remove(enemyToRemove);
        }
    }
}

function clearAllGameObjects() {
    // Clear all enemies and related objects
    gameState.enemies.forEach(enemy => scene.remove(enemy));
    gameState.bullets.forEach(bullet => scene.remove(bullet));
    gameState.coins.forEach(coin => scene.remove(coin));
    gameState.beams.forEach(beam => scene.remove(beam));
    gameState.slashes.forEach(slash => scene.remove(slash));
    gameState.deadBodies.forEach(body => scene.remove(body));
    gameState.pearls.forEach(pearl => scene.remove(pearl));
    gameState.ricochets.forEach(ricochet => scene.remove(ricochet));
    gameState.darkMatterWells.forEach(well => scene.remove(well));
    gameState.gravityGrenades.forEach(grenade => scene.remove(grenade));
    
    // More thorough cleanup of other potential enemies/objects
    scene.children.forEach(object => {
        // Remove any remaining enemy-like objects (those with health property)
        if (object.health !== undefined) {
            scene.remove(object);
        }
        // Remove any explosion fields from grenades
        if (object.material && object.material.color && 
            object.material.color.getHex() === 0x00ffff &&
            object.geometry && object.geometry.type === 'SphereGeometry') {
            scene.remove(object);
        }
    });
    
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.coins = [];
    gameState.beams = [];
    gameState.slashes = [];
    gameState.deadBodies = [];
    gameState.pearls = [];
    gameState.ricochets = [];
    gameState.darkMatterWells = [];
    gameState.gravityGrenades = [];
}

function startGame() {
    gameState.gameStarted = true;
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    
    // Play random track if not muted
    const tracks = [
        document.getElementById('background-music1'),
        document.getElementById('background-music2'),
        document.getElementById('background-music3')
    ];
    
    if (!isMusicMuted && !tracks.some(track => !track.paused)) {
        playRandomTrack(tracks);
    }
    
    // Reset to initial state
    gameState.health = 100;
    gameState.gameOver = false;
    gameState.gameWon = false;
    
    clearAllGameObjects();
    
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
    gameState.unlockedWeapons = ['pistol', 'shotgun']; // Start with basic weapons only
    gameState.availableWeapons = ['rifle', 'moneymaker', 'slash', 'pearl', 'canopener', 'necronomicon', 'darkmatter', 'shockback', 'glitchgun'];
    gameState.hasAllBasicWeapons = false;
    gameState.currentWeapon = 'pistol';
    gameState.bloodPresence = 0;
    gameState.appliedUpgrades = new Set();
    
    if (viewmodelScene && currentViewModel) {
        viewmodelScene.remove(currentViewModel);
        currentViewModel = viewmodels[gameState.currentWeapon];
        viewmodelScene.add(currentViewModel);
    }
    
    controls.lock();
    spawnEnemies();
    updateHealthUI();
    updateWeaponUI();
}

function animate() {
    requestAnimationFrame(animate);

    if (gameState.gameStarted && controls.isLocked && !gameState.gameOver) {
        const time = performance.now();
        const delta = Math.min((time - prevTime) / 1000, 0.1); // Cap delta time to prevent large jumps

        // Update player movement
        velocity.y -= 20 * delta; // Gravity strength

        camera.position.y += velocity.y * delta;

        if (camera.position.y < 2) { 
            camera.position.y = 2;
            velocity.y = 0;
            gameState.onGround = true;
        }

        const raycaster = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0));
        const intersects = raycaster.intersectObjects(scene.children);

        for (const intersect of intersects) {
            if (intersect.object.userData.isPlatform && 
                intersect.distance < 2 && 
                velocity.y <= 0) {
                camera.position.y = intersect.point.y + 2;
                velocity.y = 0;
                gameState.onGround = true;
                break;
            }
        }

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 250.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 250.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // Prevent going through walls
        const playerRadius = 1;
        if (camera.position.x > 49 - playerRadius) camera.position.x = 49 - playerRadius;
        if (camera.position.x < -49 + playerRadius) camera.position.x = -49 + playerRadius;
        if (camera.position.z > 49 - playerRadius) camera.position.z = 49 - playerRadius;
        if (camera.position.z < -49 + playerRadius) camera.position.z = -49 + playerRadius;

        // Periodic enemy cap check (every 5 seconds)
        if (Math.floor(time / 5000) !== Math.floor(prevTime / 5000)) {
            if (gameState.enemies.length > 17) {
                console.warn(`Runtime enemy cap check: Found ${gameState.enemies.length} enemies, trimming to 17`);
                while (gameState.enemies.length > 17) {
                    const enemyToRemove = gameState.enemies.pop();
                    scene.remove(enemyToRemove);
                }
            }
        }

        updateEnemies(delta, time);

        updateBullets();
        updateCoins();
        updateBeams();
        updateSlashes();
        updatePearls();
        updateRicochets();
        updateDarkMatterWells();
        updateGravityGrenades();
        checkForEatableCorpses();
        
        // Check if all enemies are defeated
        if (gameState.enemies.length === 0) {
            // Clear ALL wave-related objects
            clearAllGameObjects();
            
            // Add a pause before showing weapon choice
            const pauseMessage = document.createElement('div');
            pauseMessage.textContent = 'Wave Cleared!';
            pauseMessage.style.position = 'fixed';
            pauseMessage.style.top = '50%';
            pauseMessage.style.left = '50%';
            pauseMessage.style.transform = 'translate(-50%, -50%)';
            pauseMessage.style.color = '#00f';
            pauseMessage.style.fontSize = '48px';
            pauseMessage.style.fontFamily = 'monospace';
            pauseMessage.style.zIndex = '1001';
            document.body.appendChild(pauseMessage);
            
            setTimeout(() => {
                document.body.removeChild(pauseMessage);
                if (gameState.availableWeapons.length > 0) {
                    showWeaponChoice();
                    // Vending machine will be shown after weapon selection in the showWeaponChoice function
                } else {
                    spawnEnemies(); // Only spawn immediately if no weapon choices left
                }
            }, 3000);
            
            gameState.health = Math.min(100, gameState.health + 25);
            updateHealthUI();
        }
        
        updateViewModel();
        updateWeaponUI();
    }

    prevTime = performance.now();
    renderer.render(scene, camera);
    
    if (gameState.gameStarted && controls.isLocked && !gameState.gameOver) {
        renderer.autoClear = false;
        renderer.render(viewmodelScene, viewmodelCamera);
        renderer.autoClear = true;
    }
    
    // Update Blood Presence UI
    document.getElementById('blood-presence').textContent = `Blood Presence: ${gameState.bloodPresence}`;
    
    // Show/hide Omni hint
    document.getElementById('omni-hint').style.display = showOmniHint ? 'block' : 'none';
}

function showGameOver() {
    gameState.gameOver = true;
    controls.unlock();
    
    const overlay = document.createElement('div');
    overlay.classList.add('game-over-overlay');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.color = '#f00';
    overlay.style.fontSize = '32px';
    overlay.style.fontFamily = 'monospace';
    overlay.style.zIndex = '1000';

    const title = document.createElement('div');
    title.textContent = 'GAME OVER';
    title.style.marginBottom = '40px';
    overlay.appendChild(title);

    const button = document.createElement('button');
    button.textContent = 'RESTART';
    button.style.margin = '10px';
    button.style.padding = '15px 30px';
    button.style.fontSize = '24px';
    button.style.background = '#000';
    button.style.border = '2px solid #f00';
    button.style.color = '#f00';
    button.style.cursor = 'pointer';
    button.style.fontFamily = 'monospace';

    button.addEventListener('mouseenter', () => {
        button.style.background = '#f00';
        button.style.color = '#000';
    });

    button.addEventListener('mouseleave', () => {
        button.style.background = '#000';
        button.style.color = '#f00';
    });

    button.addEventListener('click', () => {
        document.body.removeChild(overlay);
        gameState.gameOver = false;
        startGame();
    });

    overlay.appendChild(button);
    document.body.appendChild(overlay);
}

function showWeaponChoice() {
    // Only show weapon choice if game is active and not over
    if (!gameState.gameStarted || gameState.gameOver) return;
    
    // Don't show weapon choice if player has OMNIPRESENCE
    if (gameState.unlockedWeapons.includes('omnipresence')) {
        spawnEnemies();
        return;
    }

    // Unlock controls before showing the menu
    if (controls.isLocked) {
        controls.unlock();
    }

    // Check if overlay already exists
    const existingOverlay = document.querySelector('.weapon-choice-overlay');
    if (existingOverlay) {
        document.body.removeChild(existingOverlay); // Remove existing overlay instead of returning
    }
    
    // Check if player has all basic weapons - they should get Omnipresence
    const allBasicWeaponsUnlocked = ['rifle', 'moneymaker', 'slash', 'pearl', 'canopener', 'necronomicon', 'darkmatter', 'shockback']
        .every(weapon => gameState.unlockedWeapons.includes(weapon));
    
    // If player has all basic weapons but not Omnipresence
    if (allBasicWeaponsUnlocked && !gameState.unlockedWeapons.includes('omnipresence')) {
        // Automatically give them Omnipresence
        gameState.unlockedWeapons.push('omnipresence');
        // Remove omnipresence from available weapons if it was there
        gameState.availableWeapons = gameState.availableWeapons.filter(w => w !== 'omnipresence');
        
        // Show a notification message
        const omniMessage = document.createElement('div');
        omniMessage.textContent = 'You have collected all weapons! Omnipresence is now available!';
        omniMessage.style.position = 'fixed';
        omniMessage.style.top = '50%';
        omniMessage.style.left = '50%';
        omniMessage.style.transform = 'translate(-50%, -50%)';
        omniMessage.style.color = '#FFD700';
        omniMessage.style.fontSize = '32px';
        omniMessage.style.fontFamily = 'monospace';
        omniMessage.style.textAlign = 'center';
        omniMessage.style.zIndex = '1001';
        omniMessage.style.background = 'rgba(0, 0, 0, 0.8)';
        omniMessage.style.padding = '20px';
        omniMessage.style.borderRadius = '10px';
        omniMessage.style.border = '2px solid #FFD700';
        omniMessage.style.boxShadow = '0 0 15px #FFD700';
        document.body.appendChild(omniMessage);
        
        // Show the hint to press T
        showOmniHint = true;
        
        // Remove the message after a delay
        setTimeout(() => {
            document.body.removeChild(omniMessage);
            if (gameState.availableWeapons.length > 0) {
                showWeaponChoice(); // Show standard weapon choice for remaining weapons
            } else {
                spawnEnemies(); // No more weapons to choose, just spawn enemies
            }
        }, 4000);
        
        return;
    }
    
    // Filter available weapons to only include those not already unlocked
    const filteredWeapons = gameState.availableWeapons.filter(weapon => !gameState.unlockedWeapons.includes(weapon));
    
    // If no new weapons available, just spawn enemies
    if (filteredWeapons.length === 0) {
        spawnEnemies();
        return;
    }
    
    // Create overlay for weapon selection - this is the regular weapon selection screen
    const overlay = document.createElement('div');
    overlay.classList.add('weapon-choice-overlay');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.color = '#00f';
    overlay.style.fontSize = '32px';
    overlay.style.fontFamily = 'monospace';
    overlay.style.zIndex = '1000';

    const title = document.createElement('div');
    title.textContent = 'Choose Your Next Weapon';
    title.style.marginBottom = '40px';
    overlay.appendChild(title);

    // Store all filtered weapons to check if reroll is possible
    const allAvailableWeapons = [...filteredWeapons];
    
    // Randomly select up to 3 weapons from filtered pool
    let choices = [];
    const tempWeapons = [...filteredWeapons];
    for (let i = 0; i < Math.min(3, tempWeapons.length); i++) {
        const index = Math.floor(Math.random() * tempWeapons.length);
        choices.push(tempWeapons.splice(index, 1)[0]);
    }

    // Create container for weapon buttons
    const weaponButtonsContainer = document.createElement('div');
    weaponButtonsContainer.style.display = 'flex';
    weaponButtonsContainer.style.flexDirection = 'column';
    weaponButtonsContainer.style.alignItems = 'center';
    weaponButtonsContainer.style.marginBottom = '30px';
    
    choices.forEach(weapon => {
        let weaponSlot = {
            'rifle': '3',
            'moneymaker': '4',
            'slash': '5',
            'pearl': '6',
            'omnipresence': 'T',
            'canopener': '7',
            'necronomicon': '8',
            'darkmatter': '9',
            'shockback': '0',
            'glitchgun': '-'
        }[weapon];
        
        const button = document.createElement('button');
        button.textContent = `${weapon.toUpperCase()} (Press ${weaponSlot} to equip)`;
        button.style.margin = '10px';
        button.style.padding = '15px 30px';
        button.style.fontSize = '24px';
        button.style.background = '#000';
        button.style.border = '2px solid #00f';
        button.style.color = '#00f';
        button.style.cursor = 'pointer';
        button.style.fontFamily = 'monospace';

        button.addEventListener('click', () => {
            if (!gameState.gameStarted || gameState.gameOver) return;
            
            gameState.unlockedWeapons.push(weapon);
            gameState.availableWeapons = gameState.availableWeapons.filter(w => w !== weapon);
            
            document.body.removeChild(overlay);
            
            // Check if this was the last weapon needed for Omnipresence
            const allBasicWeaponsUnlockedAfter = ['rifle', 'moneymaker', 'slash', 'pearl', 'canopener', 'necronomicon', 'darkmatter', 'shockback']
                .every(w => gameState.unlockedWeapons.includes(w));
                
            if (allBasicWeaponsUnlockedAfter && !gameState.unlockedWeapons.includes('omnipresence')) {
                // Add omnipresence to unlocked weapons
                gameState.unlockedWeapons.push('omnipresence');
                
                // Show notification message
                const omniMessage = document.createElement('div');
                omniMessage.textContent = 'You have collected all weapons! Omnipresence is now available!';
                omniMessage.style.position = 'fixed';
                omniMessage.style.top = '50%';
                omniMessage.style.left = '50%';
                omniMessage.style.transform = 'translate(-50%, -50%)';
                omniMessage.style.color = '#FFD700';
                omniMessage.style.fontSize = '32px';
                omniMessage.style.fontFamily = 'monospace';
                omniMessage.style.textAlign = 'center';
                omniMessage.style.zIndex = '1001';
                omniMessage.style.background = 'rgba(0, 0, 0, 0.8)';
                omniMessage.style.padding = '20px';
                omniMessage.style.borderRadius = '10px';
                omniMessage.style.border = '2px solid #FFD700';
                omniMessage.style.boxShadow = '0 0 15px #FFD700';
                document.body.appendChild(omniMessage);
                
                // Show the hint to press T
                showOmniHint = true;
                
                // Remove the message after a delay
                setTimeout(() => {
                    document.body.removeChild(omniMessage);
                    // Show vending machine after getting Omnipresence
                    gameState.bloodPresence > 0 ? showUpgradeScreen() : spawnEnemies();
                }, 4000);
            } else {
                // Show vending machine after weapon selection
                gameState.bloodPresence > 0 ? showUpgradeScreen() : spawnEnemies();
            }
        });

        weaponButtonsContainer.appendChild(button);
    });
    
    overlay.appendChild(weaponButtonsContainer);
    
    // Add reroll button if there are more weapons available than currently shown
    if (allAvailableWeapons.length > choices.length) {
        const rerollButton = document.createElement('button');
        rerollButton.textContent = 'REROLL OPTIONS';
        rerollButton.id = 'reroll-button';
        rerollButton.style.margin = '20px';
        rerollButton.style.padding = '15px 30px';
        rerollButton.style.fontSize = '24px';
        rerollButton.style.background = '#000';
        rerollButton.style.border = '2px solid #00f';
        rerollButton.style.color = '#00f';
        rerollButton.style.cursor = 'pointer';
        rerollButton.style.fontFamily = 'monospace';
        
        rerollButton.addEventListener('click', (event) => {
            // Prevent event from propagating up
            event.stopPropagation();
            
            // Remove the reroll button after use
            rerollButton.remove();
            
            // Remove current weapon buttons
            while (weaponButtonsContainer.firstChild) {
                weaponButtonsContainer.removeChild(weaponButtonsContainer.firstChild);
            }
            
            // Select new weapons
            const newChoices = [];
            const remainingWeapons = allAvailableWeapons.filter(w => !choices.includes(w));
            const tempNewWeapons = [...remainingWeapons];
            
            // Fill with new options if possible, or reuse old ones if needed
            for (let i = 0; i < Math.min(3, allAvailableWeapons.length); i++) {
                if (tempNewWeapons.length > 0) {
                    const index = Math.floor(Math.random() * tempNewWeapons.length);
                    newChoices.push(tempNewWeapons.splice(index, 1)[0]);
                } else {
                    // If we don't have enough new options, use some original ones
                    const index = Math.floor(Math.random() * allAvailableWeapons.length);
                    if (index < allAvailableWeapons.length) {
                        newChoices.push(allAvailableWeapons[index]);
                        allAvailableWeapons.splice(index, 1);
                    }
                }
            }
            
            // Add new weapon buttons
            newChoices.forEach(weapon => {
                let weaponSlot = {
                    'rifle': '3',
                    'moneymaker': '4',
                    'slash': '5',
                    'pearl': '6',
                    'omnipresence': 'T',
                    'canopener': '7',
                    'necronomicon': '8',
                    'darkmatter': '9',
                    'shockback': '0',
                    'glitchgun': '-'
                }[weapon];
                
                const button = document.createElement('button');
                button.textContent = `${weapon.toUpperCase()} (Press ${weaponSlot} to equip)`;
                button.style.margin = '10px';
                button.style.padding = '15px 30px';
                button.style.fontSize = '24px';
                button.style.background = '#000';
                button.style.border = '2px solid #00f';
                button.style.color = '#00f';
                button.style.cursor = 'pointer';
                button.style.fontFamily = 'monospace';

                button.addEventListener('click', () => {
                    if (!gameState.gameStarted || gameState.gameOver) return;
                    
                    gameState.unlockedWeapons.push(weapon);
                    gameState.availableWeapons = gameState.availableWeapons.filter(w => w !== weapon);
                    
                    document.body.removeChild(overlay);
                    
                    // Check if this was the last weapon needed for Omnipresence
                    const allBasicWeaponsUnlockedAfter = ['rifle', 'moneymaker', 'slash', 'pearl', 'canopener', 'necronomicon', 'darkmatter', 'shockback']
                        .every(w => gameState.unlockedWeapons.includes(w));
                        
                    if (allBasicWeaponsUnlockedAfter && !gameState.unlockedWeapons.includes('omnipresence')) {
                        // Add omnipresence to unlocked weapons
                        gameState.unlockedWeapons.push('omnipresence');
                        
                        // Show notification message
                        const omniMessage = document.createElement('div');
                        omniMessage.textContent = 'You have collected all weapons! Omnipresence is now available!';
                        omniMessage.style.position = 'fixed';
                        omniMessage.style.top = '50%';
                        omniMessage.style.left = '50%';
                        omniMessage.style.transform = 'translate(-50%, -50%)';
                        omniMessage.style.color = '#FFD700';
                        omniMessage.style.fontSize = '32px';
                        omniMessage.style.fontFamily = 'monospace';
                        omniMessage.style.textAlign = 'center';
                        omniMessage.style.zIndex = '1001';
                        omniMessage.style.background = 'rgba(0, 0, 0, 0.8)';
                        omniMessage.style.padding = '20px';
                        omniMessage.style.borderRadius = '10px';
                        omniMessage.style.border = '2px solid #FFD700';
                        omniMessage.style.boxShadow = '0 0 15px #FFD700';
                        document.body.appendChild(omniMessage);
                        
                        // Show the hint to press T
                        showOmniHint = true;
                        
                        // Remove the message after a delay
                        setTimeout(() => {
                            document.body.removeChild(omniMessage);
                            // Show vending machine after getting Omnipresence
                            gameState.bloodPresence > 0 ? showUpgradeScreen() : spawnEnemies();
                        }, 4000);
                    } else {
                        // Show vending machine
                        gameState.bloodPresence > 0 ? showUpgradeScreen() : spawnEnemies();
                    }
                });

                weaponButtonsContainer.appendChild(button);
            });
            
            // Explicitly ensure controls remain unlocked
            if (controls.isLocked) {
                controls.unlock();
            }
            
            // Prevent default browser behavior
            return false;
        });
        
        overlay.appendChild(rerollButton);
    }

    document.body.appendChild(overlay);
}

function showUpgradeScreen() {
    // Unlock controls before showing the upgrade menu
    if (controls.isLocked) {
        controls.unlock();
    }

    // Check if overlay already exists
    const existingOverlay = document.querySelector('.upgrade-overlay');
    if (existingOverlay) {
        document.body.removeChild(existingOverlay);
    }

    // Create upgrade UI
    const overlay = document.createElement('div');
    overlay.classList.add('upgrade-overlay');
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.backgroundColor = 'rgba(0, 40, 0, 0.95)';
    overlay.style.padding = '20px';
    overlay.style.borderRadius = '10px';
    overlay.style.border = '2px solid #00f';
    overlay.style.color = '#00f';
    overlay.style.fontFamily = 'monospace';
    overlay.style.zIndex = '1000';

    const title = document.createElement('div');
    title.textContent = `Blood Presence: ${gameState.bloodPresence}`;
    title.style.fontSize = '24px';
    title.style.marginBottom = '20px';
    title.style.textAlign = 'center';
    overlay.appendChild(title);

    // Select 2 random weapons from unlocked weapons
    const availableWeapons = [...gameState.unlockedWeapons];
    const selectedWeapons = [];
    for (let i = 0; i < Math.min(2, availableWeapons.length); i++) {
        const index = Math.floor(Math.random() * availableWeapons.length);
        selectedWeapons.push(availableWeapons.splice(index, 1)[0]);
    }

    selectedWeapons.forEach(weapon => {
        if (!gameState.upgrades[weapon]) return; // Skip if weapon has no upgrades

        const weaponUpgrades = gameState.upgrades[weapon];
        const upgradeCost = weapon === 'omnipresence' ? 15 : 10;

        const upgradeContainer = document.createElement('div');
        upgradeContainer.style.marginBottom = '15px';
        
        const weaponTitle = document.createElement('div');
        weaponTitle.textContent = weapon.toUpperCase();
        weaponTitle.style.fontSize = '20px';
        weaponTitle.style.marginBottom = '10px';
        upgradeContainer.appendChild(weaponTitle);

        weaponUpgrades.forEach(upgrade => {
            if (!gameState.appliedUpgrades.has(`${weapon}-${upgrade}`)) {
                const button = document.createElement('button');
                button.textContent = `${upgrade} (${upgradeCost} Blood)`;
                button.style.display = 'block';
                button.style.width = '100%';
                button.style.padding = '10px';
                button.style.margin = '5px 0';
                button.style.backgroundColor = 'black';
                button.style.color = '#00f';
                button.style.border = '1px solid #00f';
                button.style.cursor = gameState.bloodPresence >= upgradeCost ? 'pointer' : 'not-allowed';
                button.style.opacity = gameState.bloodPresence >= upgradeCost ? '1' : '0.5';

                button.addEventListener('click', () => {
                    if (gameState.bloodPresence >= upgradeCost) {
                        gameState.bloodPresence -= upgradeCost;
                        gameState.appliedUpgrades.add(`${weapon}-${upgrade}`);
                        applyUpgrade(weapon, upgrade);
                        document.body.removeChild(overlay);
                        controls.lock();
                        spawnEnemies(); // Spawn enemies after upgrade
                    }
                });
                upgradeContainer.appendChild(button);
            }
        });
        overlay.appendChild(upgradeContainer);
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = '#00f';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        controls.lock();
        spawnEnemies(); // Spawn enemies after closing
    });
    overlay.appendChild(closeButton);

    document.body.appendChild(overlay);
}

function applyUpgrade(weapon, upgrade) {
    console.log(`Applying upgrade: ${weapon}-${upgrade}`);
    switch(`${weapon}-${upgrade}`) {
        case 'pistol-High Velocity Rounds':
            // Increase bullet speed and damage for pistol
            break;
        case 'pistol-Recoil Control':
            // Improve accuracy
            break;
        case 'shotgun-Spread Control':
            // Tighter spread for shotgun
            break;
        case 'shotgun-Double Barrel':
            // Double projectiles with delay - implemented in onMouseDown
            break;
        case 'rifle-Armor Piercing':
            // Increase damage
            break;
        case 'rifle-Rapid Fire':
            // Increase fire rate
            break;
        case 'moneymaker-Golden Bullets':
            // Increase damage
            break;
        case 'moneymaker-Fortune Favor':
            // Improved coin ricochet
            break;
        case 'slash-Extended Range':
            // Increase slash radius
            break;
        case 'slash-Quick Cooldown':
            // Reduce cooldown
            break;
        case 'pearl-Blast Radius':
            // Increase blast radius
            break;
        case 'pearl-Quick Recovery':
            // Reduce cooldown
            break;
        case 'omnipresence-Chain Reaction':
            // More chain targets
            break;
        case 'omnipresence-Time Dilation':
            // Slower enemy movement when active
            break;
        case 'canopener-Extended Ricochet':
            // Increase ricochet distance
            break;
        case 'canopener-Piercing Shot':
            // Increase piercing damage
            break;
        case 'necronomicon-Cursed Projectiles':
            // Increase damage
            break;
        case 'necronomicon-Soul Harvester':
            // Increase damage
            break;
        case 'darkmatter-Extended Radius':
            // Increase dark matter radius
            break;
        case 'darkmatter-Reduced Cooldown':
            // Reduce dark matter cooldown
            break;
        case 'shockback-Quick Reload':
            // Faster reload
            break;
        case 'shockback-Increased Damage':
            // Increase damage
            break;
    }
}

function updateWeaponUI() {
    document.getElementById('current-weapon').textContent = gameState.currentWeapon.toUpperCase();
    
    // Update cooldown indicators
    const cooldownIndicator = document.getElementById('cooldown-indicator');
    if (gameState.currentWeapon === 'slash') {
        const remainingCooldown = Math.max(0, gameState.SLASH_COOLDOWN - (performance.now() - gameState.lastSlashTime)) / 1000;
        if (remainingCooldown > 0) {
            cooldownIndicator.style.display = 'block';
            cooldownIndicator.textContent = `Slash Cooldown: ${remainingCooldown.toFixed(1)}s`;
        } else {
            cooldownIndicator.style.display = 'none';
        }
    } else {
        cooldownIndicator.style.display = 'none';
    }
    
    // Update coin cooldown indicator
    const coinCooldown = document.getElementById('coin-cooldown');
    if (gameState.currentWeapon === 'moneymaker') {
        const coinReady = performance.now() - gameState.lastCoinFlip >= gameState.COIN_COOLDOWN;
        coinCooldown.style.display = 'block';
        coinCooldown.textContent = coinReady ? 'Coin Ready!' : 'Flipping...';
    } else {
        coinCooldown.style.display = 'none';
    }
    
    // Update dark matter cooldown indicator
    const darkMatterCooldown = document.getElementById('dark-matter-cooldown');
    if (gameState.currentWeapon === 'darkmatter') {
        const darkMatterReady = performance.now() - gameState.lastDarkMatterShot >= gameState.DARK_MATTER_COOLDOWN;
        darkMatterCooldown.style.display = 'block';
        darkMatterCooldown.textContent = darkMatterReady ? 'Dark Matter Ready!' : 'Charging...';
    } else {
        darkMatterCooldown.style.display = 'none';
    }
}

function flipCoin() {
    if (!controls.isLocked || gameState.gameOver) return;
    
    const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
    const coinMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        metalness: 0.9,
        roughness: 0.3
    });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Adjust direction slightly upward for a nice arc
    direction.y += 0.2;
    direction.normalize();
    
    // Position the coin in front of the player
    coin.position.copy(camera.position).add(direction.clone().multiplyScalar(2));
    
    // Set coin velocity based on look direction
    coin.velocity = direction.multiplyScalar(1.5);
    
    // Add some random rotation to the coin as it flies
    coin.rotationSpeed = {
        x: Math.random() * 0.2 + 0.1,
        y: Math.random() * 0.2 + 0.1,
        z: Math.random() * 0.2 + 0.1
    };
    
    // Initialize lifetime counter
    coin.lifetime = 0;
    
    // Add the coin to the scene and tracking array
    gameState.coins.push(coin);
    scene.add(coin);
    
    // Update UI
    const coinCooldown = document.getElementById('coin-cooldown');
    coinCooldown.textContent = 'Flipping...';
    setTimeout(() => {
        if (gameState.currentWeapon === 'moneymaker') {
            coinCooldown.textContent = 'Coin Ready!';
        }
    }, gameState.COIN_COOLDOWN);
}

function onMouseDown(event) {
    if (!controls.isLocked) return;

    if (event.button === 2) { // Right click
        if (gameState.currentWeapon === 'pistol') {
            const now = performance.now();
            if (now - gameState.lastRicochetShot >= gameState.RICOCHET_COOLDOWN) {
                shootRicochet();
                gameState.lastRicochetShot = now;
            }
        } else if (gameState.currentWeapon === 'moneymaker') {
            const now = performance.now();
            if (now - gameState.lastCoinFlip >= gameState.COIN_COOLDOWN) {
                flipCoin();
                gameState.lastCoinFlip = now;
            }
        } else if (gameState.currentWeapon === 'omnipresence') {
            // Trigger stuck bullets
            gameState.bullets.forEach(bullet => {
                if (bullet.isOmniShot && bullet.stuckEnemy && !bullet.triggered) {
                    bullet.triggered = true;
                    
                    // Find 3 closest enemies
                    let targetEnemies = [...gameState.enemies]
                        .filter(e => e !== bullet.stuckEnemy)
                        .sort((a, b) => 
                            a.position.distanceTo(bullet.position) - 
                            b.position.distanceTo(bullet.position)
                        )
                        .slice(0, 3);

                    // Create visual effect for main target
                    const mainBeam = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.1, 0.1, 20, 8),
                        new THREE.MeshBasicMaterial({
                            color: 0xFF00FF,
                            transparent: true,
                            opacity: 0.8
                        })
                    );
                    mainBeam.position.copy(bullet.position);
                    scene.add(mainBeam);

                    // Create beams to additional targets
                    targetEnemies.forEach(targetEnemy => {
                        const beam = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.05, 0.05, 20, 8),
                            new THREE.MeshBasicMaterial({
                                color: 0xFF00FF,
                                transparent: true,
                                opacity: 0.5
                            })
                        );
                        beam.position.copy(bullet.position);
                        scene.add(beam);

                        // Damage additional targets
                        if (targetEnemy.health > 0) {
                            targetEnemy.health = 0; 
                            scene.remove(targetEnemy);
                            const deadBody = targetEnemy.clone();
                            deadBody.rotation.x = Math.PI / 2;
                            scene.add(deadBody);
                            gameState.deadBodies.push(deadBody);
                            gameState.enemies = gameState.enemies.filter(e => e !== targetEnemy);
                        }
                        setTimeout(() => scene.remove(beam), 1000);
                    });

                    // Kill main target
                    if (bullet.stuckEnemy.health > 0) {
                        bullet.stuckEnemy.health = 0;
                        scene.remove(bullet.stuckEnemy);
                        const deadBody = bullet.stuckEnemy.clone();
                        deadBody.rotation.x = Math.PI / 2;
                        scene.add(deadBody);
                        gameState.deadBodies.push(deadBody);
                        gameState.enemies = gameState.enemies.filter(e => e !== bullet.stuckEnemy);
                    }

                    setTimeout(() => {
                        scene.remove(mainBeam);
                        scene.remove(bullet);
                        gameState.bullets = gameState.bullets.filter(b => b !== bullet);
                    }, 1000);
                }
            });
        }
        return;
    }

    if (gameState.currentWeapon === 'pearl') {
        throwPearl();
        return;
    }

    if (gameState.currentWeapon === 'slash') {
        const now = performance.now();
        if (now - gameState.lastSlashTime >= gameState.SLASH_COOLDOWN) {
            createSlash();
            gameState.lastSlashTime = now;
        }
        return;
    }

    if (gameState.currentWeapon === 'omnipresence') {
        shoot(1);
        return;
    }
    
    if (gameState.currentWeapon === 'necronomicon') {
        fireNecronomicon();
        return;
    }
    
    if (gameState.currentWeapon === 'darkmatter') {
        fireDarkMatter();
        return;
    }

    if (window.rifleInterval) {
        clearInterval(window.rifleInterval);
        window.rifleInterval = null;
    }

    if (gameState.currentWeapon === 'pistol') {
        shoot(1);
    } else if (gameState.currentWeapon === 'shotgun') {
        for (let i = 0; i < 8; i++) {
            shoot(0.8, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05);
        }
        
        // Add second shot for Double Barrel upgrade
        if (gameState.appliedUpgrades.has('shotgun-Double Barrel')) {
            setTimeout(() => {
                if (gameState.currentWeapon === 'shotgun' && controls.isLocked) {  // Check if still using shotgun and controls locked
                    for (let i = 0; i < 8; i++) {
                        shoot(0.8, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05);
                    }
                }
            }, 500);  // 0.5 second delay
        }
    } else if (gameState.currentWeapon === 'rifle') {
        shoot(1.2);
        window.rifleInterval = setInterval(() => {
            if (controls.isLocked && gameState.currentWeapon === 'rifle') shoot(1.2);
        }, 100);
    } else if (gameState.currentWeapon === 'moneymaker') {
        shoot(1.5);
    } else if (gameState.currentWeapon === 'canopener') {
        gameState.isScoping = true;
        gameState.canOpenerCharge = 0;
        // Change FOV for scoping effect
        viewmodelCamera.fov = 30;
        viewmodelCamera.updateProjectionMatrix();
        return;
    } else if (gameState.currentWeapon === 'shockback') {
        const now = performance.now();
        const lastShot = gameState.enemies[0]?.lastShockbackShot || 0;
        if (now - lastShot >= 700) { // 0.7 second cooldown
            // Get camera direction for recoil
            const recoilDir = new THREE.Vector3();
            camera.getWorldDirection(recoilDir);
            recoilDir.multiplyScalar(-30); // Strong backwards force
            
            // Apply recoil to velocity
            velocity.add(recoilDir);
            
            // Fire projectiles
            let hitEnemy = false;
            for (let i = 0; i < 8; i++) {
                if (!hitEnemy) {
                    const bullet = shoot(0.8, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, true);
                    bullet.isShockback = true;
                    bullet.shotNumber = i;
                }
            }
            gameState.enemies[0].lastShockbackShot = now;
        }
    } else if (gameState.currentWeapon === 'glitchgun') {
        fireGlitchGun();
    }
}

document.addEventListener('mouseup', (event) => {
    if (event.button === 0) {
        if (gameState.currentWeapon === 'rifle') {
            clearInterval(window.rifleInterval);
            window.rifleInterval = null;
        } else if (gameState.currentWeapon === 'canopener' && gameState.isScoping) {
            // Fire the Can Opener when mouse is released
            fireCanOpener();
            gameState.isScoping = false;
            // Reset FOV after scoping
            viewmodelCamera.fov = 60;
            viewmodelCamera.updateProjectionMatrix();
        }
    }
});

function fireCanOpener() {
    if (!controls.isLocked || gameState.gameOver) return;
    
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    raycaster.set(camera.position, direction);
    
    // Create beam effect
    const beamGeometry = new THREE.CylinderGeometry(0.01, 0.01, 100, 8);
    const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        transparent: true,
        opacity: 0.7
    });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    
    // Position beam
    beam.position.copy(camera.position);
    beam.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction
    );
    beam.position.add(direction.multiplyScalar(50));
    
    beam.lifetime = 0;
    beam.maxLifetime = 30; // 3 seconds at 10 frames per second
    beam.ricochetCount = 0;
    beam.maxRicochets = 5;
    gameState.beams.push(beam);
    scene.add(beam);
    
    // Check for hits
    const hits = raycaster.intersectObjects(gameState.enemies);
    if (hits.length > 0) {
        const enemy = hits[0].object.parent;
        gameState.bloodPresence++; // Add Blood Presence for each kill
        scene.remove(enemy);
        const deadBody = enemy.clone();
        deadBody.rotation.x = Math.PI / 2;
        scene.add(deadBody);
        gameState.deadBodies.push(deadBody);
        gameState.enemies = gameState.enemies.filter(e => e !== enemy);
        
        // Start ricochet - now using the same method as for pistol ricochet
        const ricochetGeometry = new THREE.SphereGeometry(0.2);
        const ricochetMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.5
        });
        const ricochet = new THREE.Mesh(ricochetGeometry, ricochetMaterial);
        
        // Position at hit point
        ricochet.position.copy(hits[0].point);
        ricochet.position.y = 1; // Force at enemy height level
        
        // Get a horizontal direction (ignore Y component)
        const horizontalDir = new THREE.Vector3(direction.x, 0, direction.z).normalize();
        
        // Fast projectile that travels horizontally
        ricochet.velocity = horizontalDir.multiplyScalar(2);
        ricochet.bounceCount = 0;
        ricochet.maxBounces = 20; // Allow many bounces
        ricochet.createdAt = performance.now();
        ricochet.lifetime = 10000; // 10 seconds lifetime
        
        gameState.ricochets.push(ricochet);
        scene.add(ricochet);
    }
}

function updateBullets() {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        
        // Skip if bullet is undefined/null
        if (!bullet) {
            gameState.bullets.splice(i, 1);
            continue;
        }
        
        if (bullet.isOmniShot) {
            if (!bullet.stuckEnemy) {
                bullet.position.add(bullet.velocity);
                for (const enemy of gameState.enemies) {
                    if (bullet.position.distanceTo(enemy.position) < 1) {
                        bullet.stuckEnemy = enemy;
                        bullet.stuckPosition = new THREE.Vector3().copy(bullet.position);
                        bullet.relativePos = new THREE.Vector3().subVectors(bullet.position, enemy.position);
                        break;
                    }
                }
            } else {
                // Update position relative to stuck enemy
                if (bullet.stuckEnemy && bullet.relativePos) {
                    bullet.position.copy(bullet.stuckEnemy.position).add(bullet.relativePos);
                } else {
                    // If references are lost, remove the bullet
                    scene.remove(bullet);
                    gameState.bullets.splice(i, 1);
                    continue;
                }
            }
        } else if (bullet.isNecroShot) {
            bullet.position.add(bullet.velocity);
            bullet.lifetime += 1;
            
            // Check if hit wall
            if (Math.abs(bullet.position.x) > 49 || Math.abs(bullet.position.z) > 49) {
                scene.remove(bullet);
                gameState.bullets.splice(i, 1);
                continue;
            }

            // Check for enemies in path
            if (bullet.hitEnemies) {  
                for (const enemy of gameState.enemies) {
                    if (bullet.hitEnemies.has(enemy)) continue; // Skip already hit enemies
                    
                    if (bullet.position.distanceTo(enemy.position) < 1) {
                        // Add enemy to hit list
                        bullet.hitEnemies.add(enemy);
                        bullet.pierceCount++;
                        
                        // Apply damage
                        let damage = 100; // Instant kill
                        
                        if (enemy.hitCooldown === 0) {
                            enemy.health -= damage;
                            enemy.hitCooldown = 0.1;
                        }
                        
                        if (enemy.health <= 0) {
                            gameState.bloodPresence++; // Add Blood Presence for each kill
                            scene.remove(enemy);
                            const deadBody = enemy.clone();
                            deadBody.rotation.x = Math.PI / 2;
                            scene.add(deadBody);
                            gameState.deadBodies.push(deadBody);
                            gameState.enemies = gameState.enemies.filter(e => e !== enemy);
                        }
                        
                        // Remove after max pierces
                        if (bullet.pierceCount >= bullet.maxPierceCount) {
                            scene.remove(bullet);
                            gameState.bullets.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            
            // Remove if lifetime expired
            if (bullet.lifetime > 100) {
                scene.remove(bullet);
                gameState.bullets.splice(i, 1);
            }
        } else {
            if (!bullet.position || !bullet.velocity) {
                scene.remove(bullet);
                gameState.bullets.splice(i, 1);
                continue;
            }
            
            bullet.position.add(bullet.velocity);
            bullet.lifetime += 1;

            if (!bullet.alive || bullet.lifetime > 100) {
                scene.remove(bullet);
                gameState.bullets.splice(i, 1);
                continue;
            }

            for (const enemy of gameState.enemies) {
                if (bullet.position.distanceTo(enemy.position) < 1) {
                    let damage;
                    if (bullet.isShockback) {
                        damage = 100; // Instant kill
                        // Remove ALL other shockback bullets from this shot
                        for (let j = gameState.bullets.length - 1; j >= 0; j--) {
                            const otherBullet = gameState.bullets[j];
                            if (otherBullet && otherBullet.isShockback && otherBullet.shotNumber !== bullet.shotNumber) {
                                scene.remove(otherBullet);
                                gameState.bullets.splice(j, 1);
                            }
                        }
                    } else {
                        damage = gameState.currentWeapon === 'shotgun' ? 15 : 
                                gameState.currentWeapon === 'rifle' ? 20 :
                                gameState.currentWeapon === 'moneymaker' ? 100 : 25;
                    }
                    
                    // Apply damage upgrades
                    if (gameState.currentWeapon === 'pistol' && gameState.appliedUpgrades.has('pistol-High Velocity Rounds')) {
                        damage *= 1.5;
                    } else if (gameState.currentWeapon === 'rifle' && gameState.appliedUpgrades.has('rifle-Armor Piercing')) {
                        damage *= 1.7;
                    } else if (gameState.currentWeapon === 'moneymaker' && gameState.appliedUpgrades.has('moneymaker-Golden Bullets')) {
                        damage *= 2;
                    }
                    
                    if (bullet.isCoinshot) damage *= 3;
                    
                    if (enemy.hitCooldown === 0) {
                        enemy.health -= damage;
                        enemy.hitCooldown = 0.1;
                    }

                    if (enemy.health <= 0) {
                        scene.remove(enemy);
                        const deadBody = enemy.clone();
                        deadBody.rotation.x = Math.PI / 2;
                        scene.add(deadBody);
                        gameState.deadBodies.push(deadBody);
                        gameState.enemies = gameState.enemies.filter(e => e !== enemy);
                    }
                    bullet.alive = false;
                    break;
                }
            }
        }
    }
}

function updateCoins() {
    for (let i = gameState.coins.length - 1; i >= 0; i--) {
        const coin = gameState.coins[i];
        coin.velocity.y -= 0.01; 
        coin.position.add(coin.velocity);
        coin.rotation.x += coin.rotationSpeed.x;
        coin.rotation.y += coin.rotationSpeed.y;
        coin.rotation.z += coin.rotationSpeed.z;
        coin.lifetime += 1;
        
        for (let j = gameState.bullets.length - 1; j >= 0; j--) {
            const bullet = gameState.bullets[j];
            if (bullet.position.distanceTo(coin.position) < 0.4) {
                let nearestEnemy = null;
                let minDist = Infinity;
                gameState.enemies.forEach(enemy => {
                    const dist = coin.position.distanceTo(enemy.position);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestEnemy = enemy;
                    }
                });
                
                if (nearestEnemy) {
                    const beamGeometry = new THREE.CylinderGeometry(0.05, 0.05, minDist, 8);
                    const beamMaterial = new THREE.MeshBasicMaterial({
                        color: 0xffff00,
                        transparent: true,
                        opacity: 0.8
                    });
                    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
                    
                    beam.position.copy(coin.position);
                    const direction = new THREE.Vector3()
                        .subVectors(coin.position, nearestEnemy.position);
                    beam.quaternion.setFromUnitVectors(
                        new THREE.Vector3(0, 1, 0),
                        direction.normalize()
                    );
                    beam.position.add(direction.multiplyScalar(minDist / 2));
                    
                    beam.lifetime = 0;
                    gameState.beams.push(beam);
                    scene.add(beam);

                    const ricochetBullet = bullet.clone();
                    const bulletDirection = new THREE.Vector3()
                        .subVectors(nearestEnemy.position, coin.position)
                        .normalize();
                    ricochetBullet.position.copy(coin.position);
                    ricochetBullet.velocity = bulletDirection.multiplyScalar(2);
                    ricochetBullet.isCoinshot = true;
                    gameState.bullets.push(ricochetBullet);
                    scene.add(ricochetBullet);
                }
                
                scene.remove(coin);
                gameState.coins.splice(i, 1);
                scene.remove(bullet);
                gameState.bullets.splice(j, 1);
                break;
            }
        }
        
        if (coin.lifetime > 200) {
            scene.remove(coin);
            gameState.coins.splice(i, 1);
        }
    }
}

function updateBeams() {
    for (let i = gameState.beams.length - 1; i >= 0; i--) {
        const beam = gameState.beams[i];
        beam.lifetime += 1;
        beam.material.opacity = Math.max(0, beam.material.opacity - 0.01);
        
        if (beam.lifetime > (beam.maxLifetime || 8)) {
            scene.remove(beam);
            gameState.beams.splice(i, 1);
        }
    }
}

function shoot(speed, offsetX = 0, offsetY = 0, returnBullet = false) {
    if (!controls.isLocked || gameState.gameOver) return;
    
    if (gameState.currentWeapon === 'omnipresence') {
        const now = performance.now();
        if (now - gameState.lastOmniShot >= gameState.OMNI_COOLDOWN) {
            const bulletGeometry = new THREE.SphereGeometry(0.1);
            const bulletMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFF00FF,
                transparent: true,
                opacity: 0.8,
                metalness: 0.9,
                roughness: 0.1
            });
            const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
            
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            bullet.position.copy(camera.position).add(direction.multiplyScalar(2));
            
            const baseSpeed = 2;
            const speedMultiplier = gameState.appliedUpgrades.has(`${gameState.currentWeapon}-Time Dilation`) ? 1.5 : 1;
            bullet.velocity = direction.multiplyScalar(baseSpeed * speedMultiplier);
            bullet.isOmniShot = true;
            bullet.lifetime = 0;
            bullet.stuckEnemy = null;
            bullet.triggered = false;
            bullet.chainTargets = gameState.appliedUpgrades.has(`${gameState.currentWeapon}-Chain Reaction`) ? 5 : 3;
            
            gameState.bullets.push(bullet);
            scene.add(bullet);
            
            gameState.lastOmniShot = now;
            return;
        }
    }

    if (gameState.currentWeapon === 'pistol' || gameState.currentWeapon === 'moneymaker') {
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3();
        
        camera.getWorldDirection(direction);
        direction.x += offsetX;
        direction.y += offsetY;
        direction.normalize();
        
        const startPosition = camera.position.clone().add(direction.clone().multiplyScalar(2));
        raycaster.set(startPosition, direction);
        
        raycaster.far = 70;
        
        let coinHit = false;
        gameState.coins.forEach(coin => {
            if (raycaster.ray.distanceToPoint(coin.position) < 1) {
                coinHit = true;
                let nearestEnemy = null;
                let minDist = Infinity;
                gameState.enemies.forEach(enemy => {
                    const dist = coin.position.distanceTo(enemy.position);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestEnemy = enemy;
                    }
                });
                
                if (nearestEnemy) {
                    const beamGeometry = new THREE.CylinderGeometry(0.05, 0.05, minDist, 8);
                    const beamMaterial = new THREE.MeshBasicMaterial({
                        color: 0xFFD700, 
                        transparent: true,
                        opacity: 0.8
                    });
                    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
                    
                    beam.position.copy(coin.position);
                    const beamDirection = new THREE.Vector3()
                        .subVectors(nearestEnemy.position, coin.position);
                    beam.quaternion.setFromUnitVectors(
                        new THREE.Vector3(0, 1, 0),
                        beamDirection.normalize()
                    );
                    beam.position.add(beamDirection.multiplyScalar(minDist / 2));
                    
                    beam.lifetime = 0;
                    gameState.beams.push(beam);
                    scene.add(beam);

                    const damage = gameState.currentWeapon === 'moneymaker' ? 100 : 25; 
                    
                    if (nearestEnemy.hitCooldown === 0) {
                        nearestEnemy.health -= damage * 3; 
                        nearestEnemy.hitCooldown = 0.1;
                    }

                    if (nearestEnemy.health <= 0) {
                        scene.remove(nearestEnemy);
                        const deadBody = nearestEnemy.clone();
                        deadBody.rotation.x = Math.PI / 2;
                        scene.add(deadBody);
                        gameState.deadBodies.push(deadBody);
                        gameState.enemies = gameState.enemies.filter(e => e !== nearestEnemy);
                    }

                    scene.remove(coin);
                    gameState.coins = gameState.coins.filter(c => c !== coin);
                }
            }
        });

        if (!coinHit) {
            const damage = gameState.currentWeapon === 'moneymaker' ? 1 : 25;
            
            const beamGeometry = new THREE.CylinderGeometry(0.02, 0.02, 70, 8); 
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: gameState.currentWeapon === 'moneymaker' ? 0x666666 : 0xffff00, 
                transparent: true,
                opacity: 0.8
            });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            
            beam.position.copy(startPosition);
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            beam.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                direction
            );
            beam.position.add(direction.multiplyScalar(35)); 
            
            beam.lifetime = 0;
            gameState.beams.push(beam);
            scene.add(beam);
            
            const hits = raycaster.intersectObjects(gameState.enemies);
            if (hits.length > 0) {
                const enemy = hits[0].object.parent;
                if (enemy.hitCooldown === 0) {
                    enemy.health -= damage;
                    enemy.hitCooldown = 0.1;
                }
                
                if (enemy.health <= 0) {
                    gameState.bloodPresence++; // Add Blood Presence for each kill
                    scene.remove(enemy);
                    const deadBody = enemy.clone();
                    deadBody.rotation.x = Math.PI / 2;
                    scene.add(deadBody);
                    gameState.deadBodies.push(deadBody);
                    gameState.enemies = gameState.enemies.filter(e => e !== enemy);
                }
            }
        }
    } else {
        const bulletGeometry = new THREE.SphereGeometry(0.1);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.x += offsetX;
        direction.y += offsetY;
        direction.normalize();
        
        bullet.position.copy(camera.position).add(direction.clone().multiplyScalar(2));
        
        bullet.velocity = direction.multiplyScalar(speed);
        bullet.alive = true;
        bullet.lifetime = 0;
        
        gameState.bullets.push(bullet);
        scene.add(bullet);
        if (returnBullet) return bullet;
    }
}

function createSlash() {
    if (!controls.isLocked || gameState.gameOver) return;
    
    const now = performance.now();
    if (now - gameState.lastSlashTime >= gameState.SLASH_COOLDOWN) {
        const slashGeometry = new THREE.RingGeometry(0.1, 0.5, 32);
        const slashMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const slash = new THREE.Mesh(slashGeometry, slashMaterial);
        
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        slash.position.copy(camera.position).add(direction.multiplyScalar(2));
        
        slash.lookAt(camera.position);
        
        slash.scale.set(1, 1, 1);
        slash.lifetime = 0;
        slash.enemiesHit = new Set();
        // Apply slash range upgrade
        slash.rangeMultiplier = gameState.appliedUpgrades.has('slash-Extended Range') ? 1.5 : 1;
        
        gameState.slashes.push(slash);
        scene.add(slash);
        
        // Apply cooldown reduction if upgraded
        if (gameState.appliedUpgrades.has('slash-Quick Cooldown')) {
            gameState.lastSlashTime = performance.now() - gameState.SLASH_COOLDOWN * 0.5; // 50% cooldown reduction
        } else {
            gameState.lastSlashTime = performance.now();
        }
    }
}

function updateSlashes() {
    for (let i = gameState.slashes.length - 1; i >= 0; i--) {
        const slash = gameState.slashes[i];
        slash.lifetime += 1;
        
        const baseScale = 1 + (slash.lifetime * 0.2);
        const scale = baseScale * (slash.rangeMultiplier || 1);
        slash.scale.set(scale, scale, scale);
        
        slash.material.opacity = Math.max(0, 0.7 - (slash.lifetime * 0.01));
        
        gameState.enemies.forEach(enemy => {
            if (!slash.enemiesHit.has(enemy) && 
                enemy.position.distanceTo(slash.position) < (0.5 * scale)) {
                if (enemy.hitCooldown === 0) {
                    enemy.health = 0; 
                    enemy.hitCooldown = 0.1;
                    slash.enemiesHit.add(enemy);
                }
                
                scene.remove(enemy);
                const deadBody = enemy.clone();
                deadBody.rotation.x = Math.PI / 2;
                scene.add(deadBody);
                gameState.deadBodies.push(deadBody);
                gameState.enemies = gameState.enemies.filter(e => e !== enemy);
            }
        });
        
        if (slash.enemiesHit.size >= 5 || slash.lifetime > 60) {
            scene.remove(slash);
            gameState.slashes.splice(i, 1);
        }
    }
}

function updateHealthUI() {
    document.getElementById('health').textContent = gameState.health;
    document.getElementById('health-bar').style.width = gameState.health + '%';
}

function eatNearbyCorpse() {
    if (!gameState.gameStarted || gameState.gameOver || gameState.deadBodies.length === 0) return;
    
    const playerPosition = camera.position;
    // Check all corpses within 3 units
    const nearbyCorpseIndex = gameState.deadBodies.findIndex(body => 
        body.position.distanceTo(playerPosition) <= 3
    );
    
    if (nearbyCorpseIndex !== -1) {
        const corpse = gameState.deadBodies[nearbyCorpseIndex];
        gameState.health = Math.min(100, gameState.health + 25);
        updateHealthUI();
        scene.remove(corpse);
        gameState.deadBodies.splice(nearbyCorpseIndex, 1);
    }
}

function checkForEatableCorpses() {
    if (!gameState.gameStarted || gameState.gameOver) return;
    
    const playerPosition = camera.position;
    const hasNearbyCorpse = gameState.deadBodies.some(body => 
        body.position.distanceTo(playerPosition) <= 3
    );
    
    // Always show the prompt if there's a nearby corpse
    const eatPrompt = document.getElementById('eat-prompt');
    eatPrompt.style.display = hasNearbyCorpse ? 'block' : 'none';
}

function onKeypress(e) {
    if (!gameState.gameStarted) return;
    
    if (e.key === 'e' || e.key === 'E') {
        eatNearbyCorpse();
    } else if (e.key === 'g' || e.key === 'G') {
        throwGravityGrenade();
    } else if (e.key === '1' && gameState.unlockedWeapons.includes('pistol')) {
        gameState.currentWeapon = 'pistol';
        updateWeaponUI();
    } else if (e.key === '2' && gameState.unlockedWeapons.includes('shotgun')) {
        gameState.currentWeapon = 'shotgun';
        updateWeaponUI();
    } else if (e.key === '3' && gameState.unlockedWeapons.includes('rifle')) {
        gameState.currentWeapon = 'rifle';
        updateWeaponUI();
    } else if (e.key === '4' && gameState.unlockedWeapons.includes('moneymaker')) {
        gameState.currentWeapon = 'moneymaker';
        updateWeaponUI();
    } else if (e.key === '5' && gameState.unlockedWeapons.includes('slash')) {
        gameState.currentWeapon = 'slash';
        updateWeaponUI();
    } else if (e.key === '6' && gameState.unlockedWeapons.includes('pearl')) {
        gameState.currentWeapon = 'pearl';
        updateWeaponUI();
    } else if ((e.key === 't' || e.key === 'T') && gameState.unlockedWeapons.includes('omnipresence')) {
        gameState.currentWeapon = 'omnipresence';
        updateWeaponUI();
        // Hide the "Press T" hint when the player presses T
        showOmniHint = false;
    } else if (e.key === '7' && gameState.unlockedWeapons.includes('canopener')) {
        gameState.currentWeapon = 'canopener';
        updateWeaponUI();
    } else if (e.key === '8' && gameState.unlockedWeapons.includes('necronomicon')) {
        gameState.currentWeapon = 'necronomicon';
        updateWeaponUI();
    } else if (e.key === '9' && gameState.unlockedWeapons.includes('darkmatter')) {
        gameState.currentWeapon = 'darkmatter';
        updateWeaponUI();
    } else if (e.key === '0' && gameState.unlockedWeapons.includes('shockback')) {
        gameState.currentWeapon = 'shockback';
        updateWeaponUI();
    } else if (e.key === '-' && gameState.unlockedWeapons.includes('glitchgun')) {
        gameState.currentWeapon = 'glitchgun';
        updateWeaponUI();
    }

    if (viewmodelScene && currentViewModel) {
        viewmodelScene.remove(currentViewModel);
        currentViewModel = viewmodels[gameState.currentWeapon];
        viewmodelScene.add(currentViewModel);
    }
}

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('keypress', onKeypress);
document.addEventListener('contextmenu', (e) => e.preventDefault());

function onKeyDown(event) {
    if (!gameState.gameStarted) return;
    
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (gameState.onGround) {
                velocity.y = 8; // Jump velocity
                gameState.onGround = false;
            }
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function toggleMute() {
    const tracks = [
        document.getElementById('background-music1'),
        document.getElementById('background-music2'),
        document.getElementById('background-music3')
    ];
    const muteButton = document.getElementById('mute-button');
    
    isMusicMuted = !isMusicMuted;
    
    if (isMusicMuted) {
        tracks.forEach(track => {
            track.pause();
            track.currentTime = 0;
        });
        muteButton.textContent = '🔇';
    } else {
        // Only start playing if no track is currently playing
        if (!tracks.some(track => !track.paused)) {
            playRandomTrack(tracks);
        }
        muteButton.textContent = '🔊';
    }
}

function playRandomTrack(tracks) {
    // Stop any currently playing tracks
    tracks.forEach(track => {
        track.pause();
        track.currentTime = 0;
    });
    
    // Pick a random track
    const randomIndex = Math.floor(Math.random() * tracks.length);
    const selectedTrack = tracks[randomIndex];
    
    // Only play if not muted
    if (!isMusicMuted) {
        selectedTrack.play().catch(e => console.log("Audio play failed:", e));
    }
}

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    viewmodelCamera.aspect = window.innerWidth / window.innerHeight;
    viewmodelCamera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateEnemies(delta, time) {
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        
        // Skip frozen enemies
        if (enemy.isFrozen) {
            continue;
        }
        
        // Apply bobbing animation
        enemy.position.y = enemy.startY + Math.sin(time * 0.002 + enemy.bobOffset) * 0.1;

        // Handle enemy movement cooldowns
        if (enemy.hitCooldown > 0) {
            enemy.hitCooldown -= delta;
            if (enemy.hitCooldown < 0) enemy.hitCooldown = 0;
        }

        if (enemy.damageCooldown > 0) {
            enemy.damageCooldown -= delta;
            if (enemy.damageCooldown < 0) enemy.damageCooldown = 0;
        }
        
        // Skip movement if the player has the Time Dilation upgrade active
        if (gameState.currentWeapon === 'omnipresence' && gameState.appliedUpgrades.has('omnipresence-Time Dilation')) {
            // Move at 50% speed
            delta *= 0.5;
        }

        // Store the last valid position before attempting to move
        enemy.lastValidPosition.copy(enemy.position);

        // Get direction to player
        const dirToPlayer = new THREE.Vector3()
            .subVectors(camera.position, enemy.position)
            .normalize();
            
        // Define player-equivalent speed (player uses 250.0 * delta)
        const playerSpeed = 10.0; // Slightly faster than player (player equivalent would be ~8.0)
            
        // Handle different movement patterns
        switch (enemy.movementPattern) {
            case 'direct':
                // Move directly toward the player
                enemy.position.add(dirToPlayer.clone().multiplyScalar(delta * playerSpeed));
                break;
                
            case 'flanking':
                // Try to flank the player by moving perpendicular occasionally
                enemy.patternTimer += delta;
                if (enemy.patternTimer > 3) { // Switch direction every 3 seconds
                    enemy.patternTimer = 0;
                    // Rotate direction 90 degrees occasionally
                    const perpDir = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x);
                    dirToPlayer.copy(perpDir);
                }
                enemy.position.add(dirToPlayer.clone().multiplyScalar(delta * playerSpeed * 1.1));
                break;
                
            case 'circling':
                // Circle around the player
                const circleDir = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x);
                // Move both toward player and around
                enemy.position.add(dirToPlayer.clone().multiplyScalar(delta * playerSpeed * 0.5));
                enemy.position.add(circleDir.clone().multiplyScalar(delta * playerSpeed));
                break;
                
            case 'zigzag':
                // Zigzag toward player
                enemy.patternTimer += delta;
                const zigzagFactor = Math.sin(enemy.patternTimer * 5);
                const zigzagDir = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x);
                enemy.position.add(dirToPlayer.clone().multiplyScalar(delta * playerSpeed * 0.75));
                enemy.position.add(zigzagDir.clone().multiplyScalar(zigzagFactor * delta * playerSpeed * 0.75));
                break;
        }
        
        // Check wall collisions
        const playerRadius = 0.6;
        if (enemy.position.x > 49 - playerRadius) enemy.position.x = 49 - playerRadius;
        if (enemy.position.x < -49 + playerRadius) enemy.position.x = -49 + playerRadius;
        if (enemy.position.z > 49 - playerRadius) enemy.position.z = 49 - playerRadius;
        if (enemy.position.z < -49 + playerRadius) enemy.position.z = -49 + playerRadius;
        
        // Check collision with player
        if (enemy.position.distanceTo(camera.position) < 2 && enemy.damageCooldown === 0) {
            gameState.health -= 20;
            enemy.damageCooldown = 1.0; // 1 second cooldown
            
            if (gameState.health <= 0) {
                gameState.health = 0;
                gameState.gameOver = true;
                showGameOver();
            }
            
            updateHealthUI();
        }
        
        // Make enemy look at player
        const lookDir = new THREE.Vector3().subVectors(camera.position, enemy.position);
        lookDir.y = 0; // Keep level
        if (lookDir.length() > 0.1) {
            enemy.lookAt(enemy.position.clone().add(lookDir));
        }
    }
}

function throwGravityGrenade() {
    if (!controls.isLocked || gameState.gameOver) return;
    
    const now = performance.now();
    if (now - gameState.lastGravityGrenade < gameState.GRAVITY_GRENADE_COOLDOWN) return;
    
    const grenadeGeometry = new THREE.SphereGeometry(0.3);
    const grenadeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan color
    const grenade = new THREE.Mesh(grenadeGeometry, grenadeMaterial);
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    grenade.position.copy(camera.position).add(direction.multiplyScalar(2));
    
    grenade.velocity = direction.multiplyScalar(1.5);
    grenade.velocity.y += 0.3; // Add upward arc
    grenade.lifetime = 0;
    grenade.maxLifetime = 60; // 2 seconds before explosion
    grenade.exploded = false;
    grenade.affectedEnemies = new Set();
    
    scene.add(grenade);
    
    gameState.lastGravityGrenade = now;
}

function updateGravityGrenades() {
    for (let i = scene.children.length - 1; i >= 0; i--) {
        const object = scene.children[i];
        
        if (object.geometry && object.geometry.type === 'SphereGeometry' && object.material && object.material.color.getHex() === 0x00ffff) {
            const grenade = object;
            
            if (!grenade.exploded) {
                // Update position if not yet exploded
                grenade.velocity.y -= 0.05; // Gravity
                grenade.position.add(grenade.velocity);
                grenade.lifetime += 1;
                
                // Rotate the grenade as it flies
                grenade.rotation.x += 0.05;
                grenade.rotation.y += 0.03;
                
                // Check if hit wall or floor
                if (grenade.position.y <= 0.3 || 
                    Math.abs(grenade.position.x) > 49 || 
                    Math.abs(grenade.position.z) > 49 ||
                    grenade.lifetime >= grenade.maxLifetime) {
                    explodeGravityGrenade(grenade);
                }
            } else {
                // Handle exploded state
                grenade.lifetime += 1;
                
                // Pulse the explosion field
                const pulseScale = 1 + 0.1 * Math.sin(grenade.lifetime * 0.2);
                grenade.scale.set(pulseScale, pulseScale, pulseScale);
                
                // Check if freeze time is over (3 seconds = 90 frames at 30fps)
                if (grenade.lifetime > 90) {
                    // Remove the grenade and unfreeze enemies
                    for (const enemy of gameState.enemies) {
                        if (grenade.affectedEnemies.has(enemy)) {
                            enemy.isFrozen = false;
                            // Reset head color for visual indicator
                            enemy.children.forEach(part => {
                                if (part.geometry.type === 'SphereGeometry') {
                                    part.material.color.set(0xffdbac);
                                }
                            });
                        }
                    }
                    
                    scene.remove(grenade);
                }
            }
        }
    }
}

function explodeGravityGrenade(grenade) {
    // Mark as exploded
    grenade.exploded = true;
    grenade.lifetime = 0;
    
    // Change appearance to explosion field
    const fieldGeometry = new THREE.SphereGeometry(7); // 7 unit radius
    const fieldMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
        wireframe: true
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.position.copy(grenade.position);
    field.affectedEnemies = new Set();
    field.exploded = true;
    field.lifetime = 0;
    
    // Replace the grenade with the field in the scene
    scene.remove(grenade);
    scene.add(field);
    
    // Freeze all enemies within radius
    gameState.enemies.forEach(enemy => {
        if (enemy.position.distanceTo(field.position) <= 7) {
            enemy.isFrozen = true;
            field.affectedEnemies.add(enemy);
            
            // Visual indicator - change head color
            enemy.children.forEach(part => {
                if (part.geometry.type === 'SphereGeometry') {
                    part.material = part.material.clone(); // Clone to not affect other enemies
                    part.material.color.set(0x00ffff); // Cyan color
                }
            });
        }
    });
}

function fireNecronomicon() {
    if (!controls.isLocked || gameState.gameOver) return;
    
    const bulletGeometry = new THREE.SphereGeometry(0.15);
    const bulletMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x990000,
        emissive: 0x990000,
        emissiveIntensity: 0.8
    });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    bullet.position.copy(camera.position).add(direction.multiplyScalar(2));
    
    bullet.velocity = direction.multiplyScalar(3); // Fast projectile
    bullet.lifetime = 0;
    bullet.isNecroShot = true;
    bullet.pierceCount = 0;
    bullet.maxPierceCount = 5;
    bullet.hitEnemies = new Set(); // Track which enemies have been hit
    
    // Add trailing effect
    const trail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8),
        new THREE.MeshBasicMaterial({
            color: 0x330000,
            transparent: true,
            opacity: 0.7
        })
    );
    bullet.add(trail);
    trail.position.z = -0.5;
    trail.rotation.x = Math.PI / 2;
    
    gameState.bullets.push(bullet);
    scene.add(bullet);
}

function fireDarkMatter() {
    if (!controls.isLocked || gameState.gameOver) return;
    
    const now = performance.now();
    if (now - gameState.lastDarkMatterShot < gameState.DARK_MATTER_COOLDOWN) {
        return; // Still on cooldown
    }
    
    const wellGeometry = new THREE.SphereGeometry(1);
    const wellMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x330066, 
        transparent: true, 
        opacity: 0.8,
        emissive: 0x9900CC,
        emissiveIntensity: 0.5
    });
    const well = new THREE.Mesh(wellGeometry, wellMaterial);
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    well.position.copy(camera.position).add(direction.clone().multiplyScalar(3));
    
    well.velocity = direction.multiplyScalar(1.5); // Slower than normal projectiles
    well.lifetime = 0;
    well.maxLifetime = 300; // 10 seconds at 30fps
    well.radius = gameState.appliedUpgrades.has('darkmatter-Extended Radius') ? 7 : 5; // Absorption radius
    well.absorbedEnemies = new Set();
    
    // Visual effect for the gravity well
    const particles = new THREE.Group();
    for (let i = 0; i < 20; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.1 + Math.random() * 0.1),
            new THREE.MeshBasicMaterial({
                color: 0x9900CC,
                transparent: true,
                opacity: 0.7
            })
        );
        
        // Random position within the sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 0.9 * Math.random() + 0.1;
        
        particle.position.x = r * Math.sin(phi) * Math.cos(theta);
        particle.position.y = r * Math.sin(phi) * Math.sin(theta);
        particle.position.z = r * Math.cos(phi);
        
        particles.add(particle);
    }
    well.add(particles);
    
    gameState.darkMatterWells.push(well);
    scene.add(well);
    
    // Apply cooldown reduction if upgraded
    if (gameState.appliedUpgrades.has('darkmatter-Reduced Cooldown')) {
        gameState.lastDarkMatterShot = now - gameState.DARK_MATTER_COOLDOWN * 0.4; // 40% cooldown reduction
    } else {
        gameState.lastDarkMatterShot = now;
    }
    
    // Update cooldown UI
    const darkMatterCooldown = document.getElementById('dark-matter-cooldown');
    darkMatterCooldown.style.display = 'block';
    darkMatterCooldown.textContent = 'Charging...';
    
    setTimeout(() => {
        if (gameState.currentWeapon === 'darkmatter') {
            darkMatterCooldown.textContent = 'Dark Matter Ready!';
        }
    }, gameState.DARK_MATTER_COOLDOWN);
}

function throwPearl() {
    if (!controls.isLocked || gameState.gameOver) return;
    
    const now = performance.now();
    if (now - gameState.lastPearlThrow < gameState.PEARL_COOLDOWN) return;
    
    const pearlGeometry = new THREE.SphereGeometry(0.2);
    const pearlMaterial = new THREE.MeshBasicMaterial({ color: 0x800080 }); // Purple color
    const pearl = new THREE.Mesh(pearlGeometry, pearlMaterial);
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    pearl.position.copy(camera.position).add(direction.multiplyScalar(2));
    
    // Apply pearl upgrades
    const baseSpeed = 2;
    const speedBoost = gameState.appliedUpgrades.has('pearl-Quick Recovery') ? 1.5 : 1;
    pearl.velocity = direction.multiplyScalar(baseSpeed * speedBoost);
    pearl.velocity.y += 0.5; // Add upward arc
    pearl.lifetime = 0;
    pearl.blastRadiusMultiplier = gameState.appliedUpgrades.has('pearl-Blast Radius') ? 1.5 : 1;
    
    gameState.pearls.push(pearl);
    scene.add(pearl);
    
    // Apply cooldown reduction if upgraded
    if (gameState.appliedUpgrades.has('pearl-Quick Recovery')) {
        gameState.lastPearlThrow = performance.now() - gameState.PEARL_COOLDOWN * 0.4; // 40% cooldown reduction
    } else {
        gameState.lastPearlThrow = performance.now();
    }
}

function updatePearls() {
    for (let i = gameState.pearls.length - 1; i >= 0; i--) {
        const pearl = gameState.pearls[i];
        pearl.position.add(pearl.velocity);
        pearl.velocity.y -= 0.1; // Gravity effect
        pearl.lifetime += 1;

        // Check for collisions with enemies
        let hitEnemy = false;
        gameState.enemies.forEach(enemy => {
            if (pearl.position.distanceTo(enemy.position) < 1) {
                hitEnemy = true;
                // Create AOE blast effect
                const baseBlastRadius = 15;
                const blastRadius = baseBlastRadius * (pearl.blastRadiusMultiplier || 1);
                gameState.enemies.forEach(targetEnemy => {
                    const dist = pearl.position.distanceTo(targetEnemy.position);
                    if (dist <= blastRadius) {
                        targetEnemy.health = 0; 
                        scene.remove(targetEnemy);
                        const deadBody = targetEnemy.clone();
                        deadBody.rotation.x = Math.PI / 2;
                        scene.add(deadBody);
                        gameState.deadBodies.push(deadBody);
                        gameState.enemies = gameState.enemies.filter(e => e !== targetEnemy);
                    }
                });

                // Visual effect for blast
                const blastGeometry = new THREE.SphereGeometry(blastRadius, 32, 32);
                const blastMaterial = new THREE.MeshBasicMaterial({
                    color: 0x800080,
                    transparent: true,
                    opacity: 0.3
                });
                const blast = new THREE.Mesh(blastGeometry, blastMaterial);
                blast.position.copy(pearl.position);
                scene.add(blast);

                // Fade out and remove blast effect
                setTimeout(() => {
                    scene.remove(blast);
                }, 500);
            }
        });
        
        // Check for any collision (floor, walls, enemies)
        if (hitEnemy || pearl.position.y <= 0 || pearl.lifetime > 200 ||
            Math.abs(pearl.position.x) > 49 || Math.abs(pearl.position.z) > 49) {
            // Don't teleport if hit enemy - this creates better gameplay
            if (!hitEnemy) {
                camera.position.copy(pearl.position);
                camera.position.y = Math.max(2, pearl.position.y); // Ensure minimum height
            }
            
            scene.remove(pearl);
            gameState.pearls.splice(i, 1);
        }
    }
}

function shootRicochet() {
    if (!controls.isLocked || gameState.gameOver) return;
    
    const ricochetGeometry = new THREE.SphereGeometry(0.2);
    const ricochetMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 0.5
    });
    const ricochet = new THREE.Mesh(ricochetGeometry, ricochetMaterial);
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Force horizontal movement regardless of vertical aim
    direction.y = 0;
    direction.normalize();
    
    // Position at player height but at enemy level (around y=1)
    ricochet.position.copy(camera.position);
    ricochet.position.y = 1; // Set at enemy height level
    
    // Fast projectile that travels horizontally
    ricochet.velocity = direction.multiplyScalar(2);
    ricochet.bounceCount = 0;
    ricochet.maxBounces = 20; // Allow many bounces
    ricochet.createdAt = performance.now();
    ricochet.lifetime = 10000; // 10 seconds lifetime
    
    gameState.ricochets.push(ricochet);
    scene.add(ricochet);
}

function updateRicochets() {
    const now = performance.now();
    
    for (let i = gameState.ricochets.length - 1; i >= 0; i--) {
        const ricochet = gameState.ricochets[i];
        const oldPos = ricochet.position.clone();
        ricochet.position.add(ricochet.velocity);
        
        // Force Y position to remain at enemy level
        ricochet.position.y = 1;
        
        // Check if lifetime expired
        if (now - ricochet.createdAt > ricochet.lifetime || ricochet.bounceCount > ricochet.maxBounces) {
            scene.remove(ricochet);
            gameState.ricochets.splice(i, 1);
            continue;
        }
        
        // Check wall collisions (bounce only horizontally)
        if (Math.abs(ricochet.position.x) > 49) {
            ricochet.velocity.x *= -1;
            ricochet.bounceCount++;
            // Adjust position to prevent getting stuck in walls
            ricochet.position.x = Math.sign(ricochet.position.x) * 49;
        }
        if (Math.abs(ricochet.position.z) > 49) {
            ricochet.velocity.z *= -1;
            ricochet.bounceCount++;
            // Adjust position to prevent getting stuck in walls
            ricochet.position.z = Math.sign(ricochet.position.z) * 49;
        }
        
        // Remove vertical bounce checks since we're only moving horizontally
        
        // Add tracer effect
        const tracer = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, ricochet.position.distanceTo(oldPos)),
            new THREE.MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.5 })
        );
        tracer.position.copy(oldPos.add(ricochet.position).multiplyScalar(0.5));
        const direction = new THREE.Vector3().subVectors(ricochet.position, oldPos).normalize();
        tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
        scene.add(tracer);
        
        // Fade out and remove tracer after a short time
        setTimeout(() => {
            scene.remove(tracer);
        }, 200);
        
        // Check enemy collisions (instant kill)
        for (const enemy of gameState.enemies) {
            if (ricochet.position.distanceTo(enemy.position) < 1.2) {
                // Instant kill
                gameState.bloodPresence++; // Add Blood Presence for each kill
                scene.remove(enemy);
                const deadBody = enemy.clone();
                deadBody.rotation.x = Math.PI / 2;
                scene.add(deadBody);
                gameState.deadBodies.push(deadBody);
                gameState.enemies = gameState.enemies.filter(e => e !== enemy);
                break;
            }
        }
    }
}

function updateDarkMatterWells() {
    for (let i = gameState.darkMatterWells.length - 1; i >= 0; i--) {
        const well = gameState.darkMatterWells[i];
        well.position.add(well.velocity);
        well.lifetime += 1;
        
        // Scale pulsing effect
        const scale = 1 + 0.1 * Math.sin(well.lifetime * 0.1);
        well.scale.set(scale, scale, scale);
        
        // Check for wall collisions
        if (Math.abs(well.position.x) > 49 || 
            Math.abs(well.position.z) > 49 || 
            well.position.y < 0 || 
            well.position.y > 20) {
            scene.remove(well);
            gameState.darkMatterWells.splice(i, 1);
            continue;
        }
        
        // Rotate the particles
        if (well.children[0]) {
            well.children[0].rotation.x += 0.01;
            well.children[0].rotation.y += 0.02;
            well.children[0].rotation.z += 0.01;
        }
        
        // Check for enemies within absorption radius
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            const distance = well.position.distanceTo(enemy.position);
            
            if (distance <= well.radius && !well.absorbedEnemies.has(enemy)) {
                // Start pulling enemy towards well
                const direction = new THREE.Vector3()
                    .subVectors(well.position, enemy.position)
                    .normalize();
                
                // Create purple beam effect between well and enemy
                const beamGeometry = new THREE.CylinderGeometry(0.05, 0.05, distance, 8);
                const beamMaterial = new THREE.MeshBasicMaterial({
                    color: 0x9900CC,
                    transparent: true,
                    opacity: 0.5
                });
                const beam = new THREE.Mesh(beamGeometry, beamMaterial);
                
                beam.position.copy(enemy.position);
                beam.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    direction
                );
                beam.position.add(direction.multiplyScalar(distance / 2));
                
                beam.lifetime = 0;
                gameState.beams.push(beam);
                scene.add(beam);

                // Move enemy towards well with increasing speed
                const pullStrength = Math.max(0.2, 1 - distance / well.radius);
                enemy.position.add(direction.multiplyScalar(pullStrength));
                
                // If enemy is very close, absorb it
                if (distance < 1.5) {
                    // Add to absorbed set
                    well.absorbedEnemies.add(enemy);
                    
                    // Visual effect - enemy shrinking and disappearing
                    const shrinkAnimation = setInterval(() => {
                        enemy.scale.multiplyScalar(0.8);
                        if (enemy.scale.x < 0.1) {
                            clearInterval(shrinkAnimation);
                            gameState.bloodPresence++; // Add Blood Presence for each kill
                            scene.remove(enemy);
                            gameState.enemies.splice(gameState.enemies.indexOf(enemy), 1);
                            
                            // Grow the dark matter well slightly
                            well.scale.addScalar(0.05);
                        }
                    }, 50);
                }
            }
        }
        
        // Remove if lifetime expired
        if (well.lifetime > well.maxLifetime) {
            // Final implosion effect
            const implosion = new THREE.Mesh(
                new THREE.SphereGeometry(well.radius),
                new THREE.MeshBasicMaterial({
                    color: 0x9900CC,
                    transparent: true,
                    opacity: 0.5
                })
            );
            implosion.position.copy(well.position);
            scene.add(implosion);

            // Animate implosion
            const startSize = well.radius;
            const implodeAnimation = setInterval(() => {
                implosion.scale.multiplyScalar(0.9);
                implosion.material.opacity *= 0.9;
                if (implosion.scale.x < 0.1) {
                    clearInterval(implodeAnimation);
                    scene.remove(implosion);
                }
            }, 50);
            
            scene.remove(well);
            gameState.darkMatterWells.splice(i, 1);
        }
    }
}

function fireGlitchGun() {
    if (!controls.isLocked || gameState.gameOver) return;
    
    // List of possible shot types
    const shotTypes = [
        'normal',
        'shotgun',
        'shockback',
        'darkMatter',
        'omni',
        'ricochet',
        'pearl',
        'necro'
    ];
    
    // Randomly select shot type
    const shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];
    
    switch(shotType) {
        case 'normal':
            shoot(1.5);
            break;
            
        case 'shotgun':
            for (let i = 0; i < 8; i++) {
                shoot(0.8, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05);
            }
            break;
            
        case 'shockback':
            // Get camera direction for recoil
            const recoilDir = new THREE.Vector3();
            camera.getWorldDirection(recoilDir);
            recoilDir.multiplyScalar(-30);
            velocity.add(recoilDir);
            
            for (let i = 0; i < 8; i++) {
                const bullet = shoot(0.8, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, true);
                bullet.isShockback = true;
                bullet.shotNumber = i;
            }
            break;
            
        case 'darkMatter':
            const well = createDarkMatterWell();
            gameState.darkMatterWells.push(well);
            scene.add(well);
            break;
            
        case 'omni':
            const bullet = createOmniShot();
            if (bullet) {
                gameState.bullets.push(bullet);
                scene.add(bullet);
                // Immediately trigger the omni effect
                setTimeout(() => {
                    if (bullet.stuckEnemy && !bullet.triggered) {
                        bullet.triggered = true;
                        triggerOmniEffect(bullet);
                    }
                }, 500);
            }
            break;
            
        case 'ricochet':
            shootRicochet();
            break;
            
        case 'pearl':
            throwPearl();
            break;
            
        case 'necro':
            fireNecronomicon();
            break;
    }
    
    // Animate glitch parts
    if (currentViewModel) {
        currentViewModel.children.forEach(part => {
            if (part !== currentViewModel.children[currentViewModel.children.length - 1]) {
                part.position.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                ));
            }
        });
    }
}

function createDarkMatterWell() {
    const wellGeometry = new THREE.SphereGeometry(1);
    const wellMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x330066, 
        transparent: true, 
        opacity: 0.8,
        emissive: 0x9900CC,
        emissiveIntensity: 0.5
    });
    const well = new THREE.Mesh(wellGeometry, wellMaterial);
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    well.position.copy(camera.position).add(direction.clone().multiplyScalar(3));
    
    well.velocity = direction.multiplyScalar(1.5);
    well.lifetime = 0;
    well.maxLifetime = 300;
    well.radius = 5;
    well.absorbedEnemies = new Set();
    
    return well;
}

function createOmniShot() {
    const bulletGeometry = new THREE.SphereGeometry(0.1);
    const bulletMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF00FF,
        transparent: true,
        opacity: 0.8,
        metalness: 0.9,
        roughness: 0.1
    });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    bullet.position.copy(camera.position).add(direction.multiplyScalar(2));
    
    bullet.velocity = direction.multiplyScalar(2);
    bullet.isOmniShot = true;
    bullet.lifetime = 0;
    bullet.stuckEnemy = null;
    bullet.triggered = false;
    bullet.chainTargets = 3;
    
    return bullet;
}

function triggerOmniEffect(bullet) {
    // Find closest enemies
    let targetEnemies = [...gameState.enemies]
        .filter(e => e !== bullet.stuckEnemy)
        .sort((a, b) => 
            a.position.distanceTo(bullet.position) - 
            b.position.distanceTo(bullet.position)
        )
        .slice(0, bullet.chainTargets);

    // Create visual effects and damage enemies
    const mainBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 20, 8),
        new THREE.MeshBasicMaterial({
            color: 0xFF00FF,
            transparent: true,
            opacity: 0.8
        })
    );
    mainBeam.position.copy(bullet.position);
    scene.add(mainBeam);

    targetEnemies.forEach(targetEnemy => {
        const beam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 20, 8),
            new THREE.MeshBasicMaterial({
                color: 0xFF00FF,
                transparent: true,
                opacity: 0.5
            })
        );
        beam.position.copy(bullet.position);
        scene.add(beam);

        if (targetEnemy.health > 0) {
            targetEnemy.health = 0;
            scene.remove(targetEnemy);
            const deadBody = targetEnemy.clone();
            deadBody.rotation.x = Math.PI / 2;
            scene.add(deadBody);
            gameState.deadBodies.push(deadBody);
            gameState.enemies = gameState.enemies.filter(e => e !== targetEnemy);
        }
        setTimeout(() => scene.remove(beam), 1000);
    });

    // Kill main target
    if (bullet.stuckEnemy && bullet.stuckEnemy.health > 0) {
        bullet.stuckEnemy.health = 0;
        scene.remove(bullet.stuckEnemy);
        const deadBody = bullet.stuckEnemy.clone();
        deadBody.rotation.x = Math.PI / 2;
        scene.add(deadBody);
        gameState.deadBodies.push(deadBody);
        gameState.enemies = gameState.enemies.filter(e => e !== bullet.stuckEnemy);
    }

    setTimeout(() => {
        scene.remove(mainBeam);
        scene.remove(bullet);
        gameState.bullets = gameState.bullets.filter(b => b !== bullet);
    }, 1000);
}

init();
animate();