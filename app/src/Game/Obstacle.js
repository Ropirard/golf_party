
import theGame from "./Game";
import Vector from "./DataType/Vector";
import Bounds from "./DataType/Bounds";
import MovingObject from "./MovingObject";
import CustomMath from "./CustomMath";

export default class Obstacle extends MovingObject {

    constructor(image, width, height, orientation = 0, speed = 0, isMoving = false, rotation = 0) {
        super(image, width, height, orientation, speed);
        this.isMoving = isMoving;
        this.rotation = rotation;
        this.velocity = new Vector()
    }

    updateMovement(canvasSize) {
        if (!this.isMoving || !canvasSize) return;

        super.update();

        const right = this.position.x + this.size.width;
        const bottom = this.position.y + this.size.height;

        if (this.position.x <= 21 || right >= canvasSize.width - 21) {
            this.reverseOrientationX();
            this.position.x = Math.min(Math.max(this.position.x, 0), canvasSize.width - this.size.width);
        }

        if (this.position.y <= 21 || bottom >= canvasSize.height - 21) {
            this.reverseOrientationY();
            this.position.y = Math.min(Math.max(this.position.y, 0), canvasSize.height - this.size.height);
        }
    }

    draw() {
        const ctx = theGame.ctx;

        if (this.rotation !== 0) {
            // Sauvegarder l'état du contexte (on en a besoin sinon ça crée un bug visuel assez bizarre)
            ctx.save();

            // Calculer le centre de l'obstacle
            const centerX = this.position.x + this.size.width / 2;
            const centerY = this.position.y + this.size.height / 2;

            // Déplacer l'origine au centre de l'obstacle
            ctx.translate(centerX, centerY);

            // Appliquer la rotation (convertir en radians)
            ctx.rotate(CustomMath.degToRad(this.rotation));

            // Dessiner l'obstacle centré sur la nouvelle origine
            ctx.drawImage(
                this.image,
                -this.size.width / 2,
                -this.size.height / 2,
                this.size.width,
                this.size.height
            );

            // Restaurer l'état du contexte
            ctx.restore();
        } else {
            // Pas de rotation, dessin normal
            ctx.drawImage(
                this.image,
                this.position.x,
                this.position.y,
                this.size.width,
                this.size.height
            );
        }
    }
}