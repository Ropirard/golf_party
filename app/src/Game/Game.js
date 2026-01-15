// Import de la feuille de style
import '../assets/css/style.css';
// Import des données de configuration
// Import des assets de sprite
import ballImgSrc from '../assets/img/ball.png';
import holeImgSrc from '../assets/img/hole.png';
import edgeImgSrc from '../assets/img/edge.png';
import Ball from './Ball';
import GameObject from './GameObject';

class Game {
    // Paramètres de configuration du jeu
    config = {
        canvasSize: {
            width: 600,
            height: 800
        },
        ball: {
            radius: 20,
            orientation: 45,
            speed: 3,
            position: {
                x: 300,
                y: 600
            },
            angleAlteration: 30
        },
        hole: {
            radius: 20,
            position: {
                x: 300,
                y: 100
            }
        }
    };

    // Contexte de dessin du canvas
    ctx;

    // Images
    images = {
        ball: null,
        hole: null,
        edge: null
    };

    // State (un objet qui décrit l'état actuel du jeu, les balles, les trous, etc.)
    state = {
        // Balles (plusieurs car possible multiball)
        balls: [],
        // Bordures à rebond
        bouncingEdges: [],
        // Trous
        holes: [],
        // Entrées utilisateur
        userInput: {
            paddleLeft: false,
            paddleRight: false
        }
    };

    start() {
        console.log('Le jeu est lancé')
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
        this.ctx = elCanvas.getContext('2d');
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
    }

    // Mise en place des objets du jeu sur la scene
    initGameObjects() {
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

        // -- Bordures à rebond
        // Haut
        const edgeTop = new GameObject(
            this.images.edge,
            this.config.canvasSize.width,
            20
        );
        edgeTop.setPosition(0, 0);

        // Bas
        const edgeBottom = new GameObject(
            this.images.edge,
            this.config.canvasSize.width,
            20
        );
        edgeBottom.setPosition(
            0, 
            this.config.canvasSize.height - 20
        );

        // Droite
        const edgeRight = new GameObject(
            this.images.edge,
            20,
            this.config.canvasSize.height + 10
        );
        edgeRight.setPosition(
            this.config.canvasSize.width - 20,
            20
        );
        edgeRight.tag = 'RightEdge';

        // Gauche
        const edgeLeft = new GameObject(
            this.images.edge,
            20,
            this.config.canvasSize.height + 10
        );
        edgeLeft.setPosition(0, 20);
        edgeLeft.tag = 'LeftEdge';

        // Ajout dans la liste des bords
        this.state.bouncingEdges.push(edgeTop, edgeBottom, edgeRight, edgeLeft);
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

        // Dessin des balles
        this.state.balls.forEach(theBall => {
            theBall.draw();
        });

        // Dessin des trous
        this.state.holes.forEach(theHole => {
            theHole.draw();
        });
    }

    loop() {
        this.renderObject();

        // Appel de la frame suivant
        requestAnimationFrame(this.loop.bind(this));
    }
}

const theGame = new Game()
export default theGame;