import theGame from "./Game";
import GameObject from "./GameObject";
import CustomMath from "./CustomMath";

export default class Treadmill extends GameObject {

    equipment;
    // Propriétés pour l'animation
    animationIndex = 0;
    previousKeyFrameStamp;
    frameRate = 20;
    spriteRate = 4;

    constructor(image, width, height, rotation = 0) {
        super(image, width, height);
        this.rotation = rotation;
    }

    draw() {
        // Utilise la taille de l'image source pour découper les 4 frames
        const sourceFrameHeight = this.image.height / this.spriteRate;
        const sourceFrameWidth = this.image.width;
        const sourceY = this.animationIndex * sourceFrameHeight;

        const ctx = theGame.ctx;
        const centerX = this.position.x + this.size.width / 2;
        const centerY = this.position.y + this.size.height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        if (this.rotation !== 0) {
            ctx.rotate(CustomMath.degToRad(this.rotation));
        }

        // Destination conserve la taille définie dans levels.json via this.size
        ctx.drawImage(
            this.image,
            0,
            sourceY,
            sourceFrameWidth,
            sourceFrameHeight,
            -this.size.width / 2,
            -this.size.height / 2,
            this.size.width,
            this.size.height
        );

        ctx.restore();
    }

    updateKeyFrame() {
        // Toute 1ère frame
        if (!this.previousKeyFrameStamp) {
            this.previousKeyFrameStamp = theGame.currentLoopStamp;
            return
        }
        const delta = theGame.currentLoopStamp - this.previousKeyFrameStamp

        // Si la frame d'animation de la boucle ne correspond pas au frameRate voulu, on sort
        if (delta < 1000 / this.frameRate) return;

        // Sinon on met à jour l'index d'animation
        this.animationIndex++;
        if (this.animationIndex > 3)
            this.animationIndex = 0;

        this.previousKeyFrameStamp = theGame.currentLoopStamp;
    }
}