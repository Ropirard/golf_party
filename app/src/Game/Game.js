// Import de la feuille de style
import '../assets/css/style.css';
// Import des données de configuration
import defaultLevels from '../levels.json'
// Import des assets de sprite
import ballImgSrc from '../assets/img/ball.png';
import holeImgSrc from '../assets/img/hole.png';
import edgeImgSrc from '../assets/img/edge.png';
import obstacleImgSrc from '../assets/img/obstacle.png'
import Ball from './Ball';
import GameObject from './GameObject';
import Obstacle from './Obstacle';
import Vector from './DataType/Vector';
import CustomMath from './CustomMath';
import CollisionType from './DataType/CollisionType';

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
        edges: null,
        obstacles: []
    };

    // Configuration active (remplie à partir des niveaux)
    config = null;

    // Overrides fournis au constructeur
    customConfig = {};

    // Données des niveaux
    levels = [];

    // Index du niveau courant
    currentLevelIndex = 0;

    // Contexte de dessin du canvas
    ctx;

    // Canvas element
    canvas;

    // Images
    images = {
        ball: null,
        hole: null,
        edge: null,
        obstacle: null
    };

    // State (un objet qui décrit l'état actuel du jeu, les balles, les trous, etc.)
    state = {
        // Balles (plusieurs car possible multiball)
        balls: [],
        // Bordures à rebond
        bouncingEdges: [],
        // Trous
        holes: [],
        // Obstacles
        obstacles: [],
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
    }

    start() {
        console.log('Le jeu est lancé')
        // Recalcule la config active au moment du démarrage (si currentLevelIndex a été modifié)
        this.config = this.buildMergedConfig(this.levels[this.currentLevelIndex] || {}, this.customConfig);
        // Initialisation de l'interface HTML
        this.initHtmlUI();
        // Initialisation des images
        this.initImages();
        // Initialisation des objets du jeu
        this.initGameObjects();
        // Lancement de la boucle
        requestAnimationFrame(this.loop.bind(this));
    }

    initHtmlUI() {
        const elH1 = document.createElement('h1');
        elH1.textContent = 'Golf\' Party';

        const elCanvas = document.createElement('canvas');
        elCanvas.width = this.config.canvasSize.width;
        elCanvas.height = this.config.canvasSize.height;

        document.body.append(elH1, elCanvas);

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
    }

    // Mise en place des objets du jeu sur la scene
    initGameObjects() {
        // Reset du state avant de construire le niveau
        this.state.balls = [];
        this.state.bouncingEdges = [];
        this.state.holes = [];
        this.state.obstacles = [];

        // Balle
        const ballDiamater = this.config.ball.radius * 2;
        const ball = new Ball(
            this.images.ball,
            ballDiamater, ballDiamater,
            this.config.ball.orientation,
            this.config.ball.speed
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
            const obstacle = new Obstacle(
                this.images.obstacle,
                obstacleData.size.width,
                obstacleData.size.height
            );
            obstacle.setPosition(
                obstacleData.position.x,
                obstacleData.position.y
            );
            obstacle.tag = obstacleData.tag;

            this.state.obstacles.push(obstacle);
        });
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
            obstacles: level.obstacles ?? overrides.obstacles ?? base.obstacles
        };
    }

    // Bordures rectangulaires par défaut (si rien n'est précisé dans levels.json)
    buildDefaultEdges() {
        const thickness = 20;
        return [
            {
                tag: 'TopEdge',
                position: { x: 0, y: 0 },
                size: { width: this.config.canvasSize.width, height: thickness }
            },
            {
                tag: 'BottomEdge',
                position: { x: 0, y: this.config.canvasSize.height - thickness },
                size: { width: this.config.canvasSize.width, height: thickness }
            },
            {
                tag: 'RightEdge',
                position: { x: this.config.canvasSize.width - thickness, y: 0 },
                size: { width: thickness, height: this.config.canvasSize.height }
            },
            {
                tag: 'LeftEdge',
                position: { x: 0, y: 0 },
                size: { width: thickness, height: this.config.canvasSize.height }
            }
        ];
    }

    // Clone simple pour éviter les effets de bord lors du merge
    cloneConfig(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Charger le niveau suivant
    loadNextLevel() {
        // Incrémenter l'index du niveau
        this.currentLevelIndex++;

        // Vérifier si on a atteint la fin des niveaux
        if (this.currentLevelIndex >= this.levels.length) {
            console.log('Tous les niveaux sont terminés !');
            // Optionnel: revenir au premier niveau
            this.currentLevelIndex = 0;
        }

        // Charger la nouvelle configuration du niveau
        this.config = this.buildMergedConfig(this.levels[this.currentLevelIndex] || {}, this.customConfig);

        // Redimensionner le canvas si nécessaire
        this.canvas.width = this.config.canvasSize.width;
        this.canvas.height = this.config.canvasSize.height;

        // Réinitialiser les objets du jeu avec le nouveau niveau
        this.initGameObjects();

        console.log(`Niveau ${this.currentLevelIndex + 1} chargé`);
    }

    // -- Collisions et calculs --
    checkCollision() {
        // Collision de la balle avec les objets
        let savedBalls = [];
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
            this.state.obstacles.forEach(theObstacle => {
                const collisionType = theBall.getCollisionType(theObstacle);
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
                    }
                }
            })
        });

        this.state.balls = savedBalls;
    }

    updateObject() {
        // On met à jour les données du GameObject (ici seulement les balles)
        this.state.balls.forEach(theBall => {
            theBall.update();
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
        this.state.obstacles.forEach(theObstacle => {
            theObstacle.draw();
        });

        // Dessin des balles 
        this.state.balls.forEach(theBall => {
            theBall.draw();
        });

        // Dessin de la ligne de visée
        this.drawAimLine();
    }

    loop() {
        // Mise à jour des objets en mouvement
        this.state.balls.forEach(ball => {
            if (ball.speed > 0) {
                ball.update();
                // Appliquer la friction
                ball.speed = Math.max(0, ball.speed - 0.05);
            }
        });

        this.checkCollision();
        this.updateObject();
        this.renderObject();

        // Appel de la frame suivant
        requestAnimationFrame(this.loop.bind(this));
    }
}

const theGame = new Game()
export default theGame;