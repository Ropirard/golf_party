import theGame from "./Game";
import GameObject from "./GameObject";
import MovingObject from "./MovingObject";

export default class Treadmill extends GameObject {

    equipment;
    // Propriétés pour l'animation
    animationIndex = 0;
    previousKeyFrameStamp;
    frameRate = 20;
    spriteRate = 4;

    draw() {
        // Utilise la taille de l'image source pour découper les 4 frames
        const sourceFrameHeight = this.image.height / this.spriteRate;
        const sourceFrameWidth = this.image.width;
        const sourceY = this.animationIndex * sourceFrameHeight;

        // Destination conserve la taille définie dans levels.json via this.size
        theGame.ctx.drawImage(
            this.image,
            0,
            sourceY,
            sourceFrameWidth,
            sourceFrameHeight,
            this.position.x,
            this.position.y,
            this.size.width,
            this.size.height
        );
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