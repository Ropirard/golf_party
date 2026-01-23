// Import de la feuille de style
import '../assets/css/style.css';
// Import des données de configuration
import defaultLevels from '../levels.json'
// Import des assets de sprite
import ballImgSrc from '../assets/img/ball.png';
import holeImgSrc from '../assets/img/hole.png';
import edgeImgSrc from '../assets/img/edge.png';
import obstacleImgSrc from '../assets/img/obstacle.png';
import killingWaterImgSrc from '../assets/img/killingWater.png'
import treadmillImgSrc from '../assets/img/treadmill.png';
import Ball from './Ball';
import GameObject from './GameObject';
import Obstacle from './Obstacle';
import Vector from './DataType/Vector';
import CustomMath from './CustomMath';
import CollisionType from './DataType/CollisionType';
import Treadmill from './Treadmill';
import KillingWater from './KillingWater';

class Game {
    // Paramètres par défaut du jeu
    defaultConfig = {
        canvasSize: {
            width: 600,
            height: 800
        },
        ball: {
            radius: 20,
            orientation: 45,
            speed: 0,
            maxSpeed: 12,
            position: {
                x: 275,
                y: 600
            },
            angleAlteration: 30
        },
        hole: {
            radius: 20,
            orientation: 0,
            speed: 0,
            position: {
                x: 275,
                y: 100
            }
        },
        treadmill: [],
        edges: null,
        obstacles: [],
        killingWaters: []
    }

    // Configuration active (remplie à partir des niveaux)
    config = null;

    // Overrides fournis au constructeur
    customConfig = {};

    // Index du joueur courant
    currentPlayerIndex = 0;

    // Données des niveaux
    levels = [];

    // Index du niveau courant
    currentLevelIndex = 0;

    // Contexte de dessin du canvas
    ctx;

    // Canvas element
    canvas;

    // Timestamp haute résolution de la boucle d'animation
    currentLoopStamp;

    // Identifiant de la boucle d'animation en cours
    animationFrameId = null;

    // Élément HTML du niveau courant
    currentLevelElement;

    // Images
    images = {
        ball: null,
        hole: null,
        treadmill: null,
        edge: null,
        obstacle: null,
        killingWater: null
    };

    // State (un objet qui décrit l'état actuel du jeu, les balles, les trous, etc.)
    state = {
        // Balles (plusieurs car possible multiball)
        balls: [],
        // Bordures à rebond
        bouncingEdges: [],
        // Trous
        holes: [],
        // Tapis roulant
        treadmills: [],
        // Obstacles
        obstacles: [],
        killingWaters: [],
        // Entrées utilisateur
        userInput: {
            paddleLeft: false,
            paddleRight: false
        },
        // État du tir
        shooting: {
            isCharging: false,
            startPos: new Vector(),
            currentPos: new Vector(),
            power: 0,
            maxPower: 15
        }
    };

    constructor(customConfig = {}, levelsConfig = defaultLevels) {
        // Normalisation des niveaux depuis le JSON (tableau direct ou { data: [] })
        this.levels = Array.isArray(levelsConfig) ? levelsConfig : levelsConfig?.data || [];
        this.customConfig = customConfig;
        this.config = this.buildMergedConfig(this.levels[this.currentLevelIndex] || {}, this.customConfig);

        // Initialisation par défaut avec 1 joueur
        this.players = [{
            id: 1,
            name: 'Joueur 1',
            state: {
                strokeCount: 0,
                totalStrokeCount: 0
            }
        }];

        // Préserver le bon contexte pour la boucle d'animation
        this.loop = this.loop.bind(this);
    }

    start() {
        console.log('Le jeu est lancé')
        this.stopLoop();
        if (this.menuOverlay) {
            this.menuOverlay.remove();
            this.menuOverlay = null;
        }
        // Recalcule la config active au moment du démarrage (si currentLevelIndex a été modifié)
        this.config = this.buildMergedConfig(this.levels[this.currentLevelIndex] || {}, this.customConfig);
        // Initialisation de l'interface HTML
        this.initHtmlUI();
        // Initialisation des images
        this.initImages();
        // Initialisation des objets du jeu
        this.initGameObjects();
        // Lancement de la boucle
        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    initHtmlUI() {
        this.elH1 = document.createElement('h1');
        this.elH1.textContent = 'Golf\' Party';

        this.currentLevelElement = document.createElement('h1');
        const currentPlayer = this.players[this.currentPlayerIndex];
        this.currentLevelElement.textContent = 'Joueur ' + (this.currentPlayerIndex + 1) + ' - Niveau ' + (this.currentLevelIndex + 1) + ' - Coups: ' + currentPlayer.state.strokeCount + ' - Total Coups: ' + currentPlayer.state.totalStrokeCount;



        const elCanvas = document.createElement('canvas');
        elCanvas.width = this.config.canvasSize.width;
        elCanvas.height = this.config.canvasSize.height;
        document.body.append(this.elH1, this.currentLevelElement, elCanvas);

        // Récupération du contexte du canvas
        this.canvas = elCanvas;
        this.ctx = elCanvas.getContext('2d');

        // Ajout des événements de souris
        this.initMouseEvents();
    }

    // Création des images
    initImages() {
        // Ball 
        const imgBall = new Image();
        imgBall.src = ballImgSrc;
        this.images.ball = imgBall;

        // Hole
        const imgHole = new Image();
        imgHole.src = holeImgSrc;
        this.images.hole = imgHole;

        // Edge 
        const imgEdge = new Image();
        imgEdge.src = edgeImgSrc;
        this.images.edge = imgEdge;

        // Obstacle
        const imgObstacle = new Image();
        imgObstacle.src = obstacleImgSrc;
        this.images.obstacle = imgObstacle;

        // Eau
        const imgKillingWater = new Image();
        imgKillingWater.src = killingWaterImgSrc;
        this.images.killingWater = imgKillingWater;

        // Tapis roulant
        const imgTreadmill = new Image();
        imgTreadmill.src = treadmillImgSrc;
        this.images.treadmill = imgTreadmill;
    }

    // Mise en place des objets du jeu sur la scene
    initGameObjects() {
        // Reset du state avant de construire le niveau
        this.state.balls = [];
        this.state.bouncingEdges = [];
        this.state.holes = [];
        this.state.obstacles = [];
        this.state.killingWaters = [];
        this.state.treadmills = [];

        // Balle
        const ballDiamater = this.config.ball.radius * 2;
        const ball = new Ball(
            this.images.ball,
            ballDiamater, ballDiamater,
            this.config.ball.orientation,
            this.config.ball.speed,
            this.config.ball.maxSpeed
        );
        ball.setPosition(
            this.config.ball.position.x,
            this.config.ball.position.y
        );
        ball.isCircular = true;
        this.state.balls.push(ball);

        // Trou
        const holeDiamater = this.config.hole.radius * 2;
        const hole = new Ball(
            this.images.hole,
            holeDiamater, holeDiamater,
            this.config.hole.orientation,
            this.config.hole.speed
        );
        hole.setPosition(
            this.config.hole.position.x,
            this.config.hole.position.y
        );
        hole.isCircular = true;
        this.state.holes.push(hole);

        // -- Bordures à rebond (issues du niveau ou fallback par défaut)
        const edgeDataList = Array.isArray(this.config.edges) && this.config.edges.length > 0
            ? this.config.edges
            : this.buildDefaultEdges();

        edgeDataList.forEach(edgeData => {
            const edge = new GameObject(
                this.images.edge,
                edgeData.size.width,
                edgeData.size.height
            );
            edge.setPosition(edgeData.position.x, edgeData.position.y);
            edge.tag = edgeData.tag;
            this.state.bouncingEdges.push(edge);
        });

        // Chargement des obstacles définis pour le niveau
        const obstacleDataList = Array.isArray(this.config.obstacles) ? this.config.obstacles : [];
        obstacleDataList.forEach(obstacleData => {
            const isMoving = !!obstacleData.isMoving;
            const speed = obstacleData.speed ?? (isMoving ? 2 : 0);
            const orientation = obstacleData.orientation ?? 0;
            const rotation = obstacleData.rotation ?? 0;
            const obstacle = new Obstacle(
                this.images.obstacle,
                obstacleData.size.width,
                obstacleData.size.height,
                orientation,
                speed,
                isMoving,
                rotation
            );
            obstacle.setPosition(
                obstacleData.position.x,
                obstacleData.position.y
            );
            obstacle.tag = obstacleData.tag;

            this.state.obstacles.push(obstacle);
        });

        const killingWaterDataList = Array.isArray(this.config.killingWaters) ? this.config.killingWaters : [];
        killingWaterDataList.forEach(killingWaterData => {
            const killingWater = new Obstacle(
                this.images.killingWater,
                killingWaterData.size.width,
                killingWaterData.size.height
            );
            killingWater.setPosition(
                killingWaterData.position.x,
                killingWaterData.position.y
            );
            this.state.killingWaters.push(killingWater);
        })

        const treadmillDataList = Array.isArray(this.config.treadmills) ? this.config.treadmills : [];
        treadmillDataList.forEach(treadmillData => {
            const rotation = treadmillData.rotation ?? 0;
            const treadmill = new Treadmill(
                this.images.treadmill,
                treadmillData.size.width,
                treadmillData.size.height,
                rotation
            );
            treadmill.setPosition(
                treadmillData.position.x,
                treadmillData.position.y
            );
            this.state.treadmills.push(treadmill);
        })
    }

    // Crée les bordures par défaut (contours du canvas)
    buildDefaultEdges() {
        const width = this.config.canvasSize.width;
        const height = this.config.canvasSize.height;
        const edgeThickness = 10;

        return [
            // Bordure supérieure
            {
                size: { width: width, height: edgeThickness },
                position: { x: 0, y: 0 },
                tag: 'top'
            },
            // Bordure inférieure
            {
                size: { width: width, height: edgeThickness },
                position: { x: 0, y: height - edgeThickness },
                tag: 'bottom'
            },
            // Bordure gauche
            {
                size: { width: edgeThickness, height: height },
                position: { x: 0, y: 0 },
                tag: 'left'
            },
            // Bordure droite
            {
                size: { width: edgeThickness, height: height },
                position: { x: width - edgeThickness, y: 0 },
                tag: 'right'
            }
        ];
    }

    // Construit la configuration finale à partir du niveau et d'éventuels overrides
    buildMergedConfig(levelConfig = {}, customConfig = {}) {
        const base = this.cloneConfig(this.defaultConfig);
        const level = levelConfig || {};
        const overrides = customConfig || {};

        return {
            ...base,
            canvasSize: { ...base.canvasSize, ...level.canvasSize, ...overrides.canvasSize },
            ball: { ...base.ball, ...level.ball, ...overrides.ball },
            hole: { ...base.hole, ...level.hole, ...overrides.hole },
            edges: level.edges ?? overrides.edges ?? base.edges,
            obstacles: level.obstacles ?? overrides.obstacles ?? base.obstacles,
            killingWaters: level.killingWaters ?? overrides.killingWaters ?? base.killingWaters,
            treadmills: level.treadmills ?? overrides.treadmills ?? base.treadmills
        };
    }

    // Clone simple pour éviter les effets de bord lors du merge
    cloneConfig(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Charger le niveau suivant
    loadNextLevel() {
        this.switchPlayer();

        // Si le jeu est terminé (switchPlayer a retourné null), on ne continue pas
        if (this.currentPlayerIndex === null || this.currentLevelIndex >= this.levels.length) {
            return;
        }

        // Réinitialiser le compteur de coups du niveau pour le nouveau joueur
        const currentPlayer = this.players[this.currentPlayerIndex];
        currentPlayer.state.strokeCount = 0;

        // Mettre à jour l'affichage du niveau
        if (this.currentLevelElement) {
            this.currentLevelElement.textContent = 'Joueur ' + (this.currentPlayerIndex + 1) + ' - Niveau ' + (this.currentLevelIndex + 1) + ' - Coups: ' + currentPlayer.state.strokeCount + ' - Total Coups: ' + currentPlayer.state.totalStrokeCount;
        }

        // Charger la nouvelle configuration du niveau
        this.config = this.buildMergedConfig(this.levels[this.currentLevelIndex] || {}, this.customConfig);

        // Redimensionner le canvas si nécessaire
        if (this.canvas) {
            this.canvas.width = this.config.canvasSize.width;
            this.canvas.height = this.config.canvasSize.height;
        }

        // Réinitialiser les objets du jeu avec le nouveau niveau
        this.initGameObjects();
    }

    switchPlayer() {
        if (this.currentPlayerIndex === this.players.length - 1 && this.currentLevelIndex !== this.levels.length - 1) {
            // Si on est au dernier joueur et qu'il reste des niveaux, revenir au premier joueur
            this.currentLevelIndex++;
            this.currentPlayerIndex = 0;
            return this.players[this.currentPlayerIndex];
        } else if (this.currentPlayerIndex === this.players.length - 1 && this.currentLevelIndex === this.levels.length - 1) {
            this.stopLoop();
            // Supprimer le canvas avant d'afficher le modal de fin
            if (this.canvas) {
                this.canvas.remove();
                this.canvas = null;
            }
            this.createEndingModal();
            return null;
        }
        const player = this.players[this.currentPlayerIndex];
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        return player;
    }

    // -- Collisions et calculs --
    checkCollision() {
        // Collision de la balle avec les objets
        let savedBalls = [];
        let levelChanged = false;
        this.state.balls.forEach(theBall => {
            savedBalls.push(theBall)

            this.state.bouncingEdges.forEach(theEdge => {
                const collisionType = theBall.getCollisionType(theEdge);
                switch (collisionType) {
                    case CollisionType.NONE:
                        return;

                    case CollisionType.HORIZONTAL:
                        theBall.reverseOrientationX();
                        break;

                    case CollisionType.VERTICAL:
                        theBall.reverseOrientationY();
                        break;

                    default:
                        break;
                }
            })

            // Collision de la balle avec les obstacles
            this.state.obstacles.forEach(obstacle => {
                const collisionType = theBall.getCollisionType(obstacle);
                switch (collisionType) {
                    case CollisionType.NONE:
                        return;

                    case CollisionType.HORIZONTAL:
                        theBall.reverseOrientationX();
                        break;

                    case CollisionType.VERTICAL:
                        theBall.reverseOrientationY();
                        break;

                    default:
                        break;
                }
            });

            this.state.holes.forEach(theHole => {
                // Vérifier si le centre de la balle rentre dans le trou
                const ballCenterX = theBall.position.x + theBall.size.width / 2;
                const ballCenterY = theBall.position.y + theBall.size.height / 2;

                const holeCenterX = theHole.position.x + theHole.size.width / 2;
                const holeCenterY = theHole.position.y + theHole.size.height / 2;

                const distanceX = ballCenterX - holeCenterX;
                const distanceY = ballCenterY - holeCenterY;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                // Si la distance est inférieure au rayon du trou
                if (distance <= theHole.size.width / 2) {
                    const index = savedBalls.indexOf(theBall);
                    if (index > -1) {
                        savedBalls.splice(index, 1);
                        // Passer au niveau suivant
                        this.loadNextLevel();
                        levelChanged = true;
                    }
                }
            })

            this.state.killingWaters.forEach(killingWater => {
                // Vérifier si la balle entre en collision avec le killingWater (détection rectangulaire)
                const ballCenterX = theBall.position.x + theBall.size.width / 2;
                const ballCenterY = theBall.position.y + theBall.size.height / 2;
                const ballRadius = theBall.size.width / 2;

                // Vérifier si le centre de la balle est dans le rectangle du killingWater
                const isInsideX = ballCenterX >= killingWater.position.x &&
                    ballCenterX <= killingWater.position.x + killingWater.size.width;
                const isInsideY = ballCenterY >= killingWater.position.y &&
                    ballCenterY <= killingWater.position.y + killingWater.size.height;

                if (isInsideX && isInsideY) {
                    this.resetBallPosition(theBall);
                }
            })
        });

        // Ne pas écraser le tableau de balles si le niveau a changé
        if (!levelChanged) {
            this.state.balls = savedBalls;
        }
    }

    // Réinitialise la position de la balle à sa position initiale
    resetBallPosition(ball) {
        ball.setPosition(
            this.config.ball.position.x,
            this.config.ball.position.y
        );
        ball.orientation = this.config.ball.orientation;
        ball.speed = 0;
    }

    updateObject() {
        // On met à jour les données du GameObject (ici seulement les balles)
        this.state.balls.forEach(theBall => {
            theBall.update();
        });

        this.state.treadmills.forEach(treadmill => {
            treadmill.updateKeyFrame();
        })
    }

    updateMovingObstacle() {
        this.state.obstacles.forEach(obstacle => {
            obstacle.updateMovement(this.config.canvasSize);
        })
    }

    // Initialisation des événements de souris
    initMouseEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Vérifier si on clique sur la balle
            const ball = this.state.balls[0];
            if (ball && ball.speed === 0) {
                // Calculer le centre de la balle
                const ballCenterX = ball.position.x + ball.size.width / 2;
                const ballCenterY = ball.position.y + ball.size.height / 2;

                const dx = mouseX - ballCenterX;
                const dy = mouseY - ballCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= ball.size.width / 2) {
                    this.state.shooting.isCharging = true;
                    this.state.shooting.startPos.x = ballCenterX;
                    this.state.shooting.startPos.y = ballCenterY;
                    this.state.shooting.currentPos.x = mouseX;
                    this.state.shooting.currentPos.y = mouseY;
                }
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state.shooting.isCharging) {
                const rect = this.canvas.getBoundingClientRect();
                this.state.shooting.currentPos.x = e.clientX - rect.left;
                this.state.shooting.currentPos.y = e.clientY - rect.top;

                // Calculer la puissance
                const dx = this.state.shooting.startPos.x - this.state.shooting.currentPos.x;
                const dy = this.state.shooting.startPos.y - this.state.shooting.currentPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                this.state.shooting.power = Math.min(distance / 20, this.state.shooting.maxPower);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (this.state.shooting.isCharging) {
                this.shootBall();
                this.state.shooting.isCharging = false;
            }
        });
    }

    // Tirer la balle
    shootBall() {
        const ball = this.state.balls[0];
        if (!ball) return;

        const dx = this.state.shooting.startPos.x - this.state.shooting.currentPos.x;
        const dy = this.state.shooting.startPos.y - this.state.shooting.currentPos.y;

        // Calculer l'angle en degrés
        const angleRad = Math.atan2(-dy, dx);
        const angleDeg = CustomMath.RagToDeg(angleRad);

        // Appliquer l'orientation et la vitesse à la balle
        ball.orientation = CustomMath.normalizedAngle(angleDeg);
        ball.speed = this.state.shooting.power;
        this.state.shooting.power = 0;

        // Incrémenter les compteurs de coups du joueur courant
        const currentPlayer = this.players[this.currentPlayerIndex];
        currentPlayer.state.totalStrokeCount++;
        currentPlayer.state.strokeCount++;
        if (this.currentLevelElement) {
            this.currentLevelElement.textContent = 'Joueur ' + (this.currentPlayerIndex + 1) + ' - Niveau ' + (this.currentLevelIndex + 1) + ' - Coups: ' + currentPlayer.state.strokeCount + ' - Total Coups: ' + currentPlayer.state.totalStrokeCount;
        }
    }

    // Dessiner la ligne de visée
    drawAimLine() {
        if (!this.state.shooting.isCharging) return;

        const ctx = this.ctx;
        const start = this.state.shooting.startPos;
        const current = this.state.shooting.currentPos;

        // Dessiner la ligne
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();

        ctx.restore();
    }

    renderObject() {
        // On effacele canvas pour le redessiner à chaque frame
        this.ctx.clearRect(
            0,
            0,
            this.config.canvasSize.width,
            this.config.canvasSize.height
        );

        // Dessin des bordures à rebond
        this.state.bouncingEdges.forEach(theEdge => {
            theEdge.draw();
        });

        // Dessin des trous
        this.state.holes.forEach(theHole => {
            theHole.draw();
        });

        // Dessin des obstacles
        this.state.obstacles.forEach(obstacle => {
            obstacle.draw();
        });

        this.state.killingWaters.forEach(killingWater => {
            killingWater.draw();
        })

        // Dessin des tapis roulants
        this.state.treadmills.forEach(treadmill => {
            treadmill.draw();
        });

        // Dessin des balles 
        this.state.balls.forEach(theBall => {
            theBall.draw();
        });

        // Dessin de la ligne de visée
        this.drawAimLine();
    }

    loop(stamp) {
        // Enregistrement du stamp
        this.currentLoopStamp = stamp;
        // Mise à jour des objets en mouvement
        this.state.balls.forEach(ball => {
            if (ball.speed > 0) {
                ball.update();
                // Appliquer la friction
                ball.speed = Math.max(0, ball.speed - 0.05);
            }
        });

        this.updateMovingObstacle();

        this.checkCollision();
        this.updateObject();
        this.renderObject();

        // Appel de la frame suivant
        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    // Permet de cancel l'animation frame afin d'éviter l'accélération de la balle lors d'une relance de partie
    stopLoop() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    createStartingModal() {
        this.menuOverlay = document.createElement('div');
        this.menuOverlay.id = 'menuOverlay';

        const modalContent = document.createElement('div');
        modalContent.id = 'modalContent';

        const title = document.createElement('h1');
        title.textContent = 'Golf\' Party';

        const numberOfPlayers = document.createElement('select')
        numberOfPlayers.id = 'number-of-players';
        for (let i = 1; i <= 4; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i + (i === 1 ? ' Joueur' : ' Joueurs');
            numberOfPlayers.appendChild(option);
        }

        numberOfPlayers.addEventListener('change', (e) => {
            const selectedValue = parseInt(e.target.value, 10);
            this.players = [];
            for (let i = 1; i <= selectedValue; i++) {
                this.players.push({
                    id: i,
                    name: 'Joueur ' + i,
                    state: {
                        strokeCount: 0,
                        totalStrokeCount: 0
                    }
                });
            }
        })


        const startButton = document.createElement('button');
        startButton.id = 'startButton';
        startButton.textContent = 'Démarrer le jeu';
        startButton.addEventListener('click', () => {
            this.start();
        });

        modalContent.appendChild(title);
        modalContent.appendChild(numberOfPlayers);
        modalContent.appendChild(startButton);
        this.menuOverlay.appendChild(modalContent);
        document.body.appendChild(this.menuOverlay);
    }

    createEndingModal() {
        // Supprimer le titre "Golf' Party"
        if (this.elH1) {
            this.elH1.remove();
            this.elH1 = null;
        }
        // Supprimer les infos de niveau et coups
        if (this.currentLevelElement) {
            this.currentLevelElement.remove();
            this.currentLevelElement = null;
        }

        const endModal = document.createElement('div');
        endModal.id = 'start-modal'; // On réutilise le style du start-modal

        const modalContent = document.createElement('div');
        modalContent.id = 'div-modal-content';

        const title = document.createElement('h1');
        title.textContent = 'Fin de la partie !';

        const backToMenu = document.createElement('button');
        backToMenu.id = 'buttonStart';
        backToMenu.textContent = 'MENU PRINCIPAL';
        backToMenu.addEventListener('click', () => {
            // Supprimer le endingModal
            endModal.remove();
            // Réinitialiser les états des joueurs
            this.currentLevelIndex = 0;
            this.currentPlayerIndex = 0;
            this.players.forEach(player => {
                player.state.strokeCount = 0;
                player.state.totalStrokeCount = 0;
            });
            // Afficher le startingModal
            this.createStartingModal();
        });

        const restartButton = document.createElement('button');
        restartButton.id = 'buttonStart';
        restartButton.textContent = 'REJOUER';
        restartButton.addEventListener('click', () => {
            // Supprimer le endingModal
            endModal.remove();
            // Réinitialiser les états des joueurs
            this.currentLevelIndex = 0;
            this.currentPlayerIndex = 0;
            this.players.forEach(player => {
                player.state.strokeCount = 0;
                player.state.totalStrokeCount = 0;
            });
            // Démarrer une nouvelle partie
            this.start();
        });

        modalContent.append(title, backToMenu, restartButton);
        endModal.appendChild(modalContent);
        document.body.appendChild(endModal);
    }
}

const theGame = new Game()
export default theGame;