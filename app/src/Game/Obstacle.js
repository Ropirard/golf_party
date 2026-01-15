import GameObject from "./GameObject";
import theGame from "./Game";

export default class Obstacle extends GameObject {

    constructor(image, width, height) {
        super(image, width, height);
    }

    draw() {
        theGame.ctx.drawImage(
            this.image,
            this.position.x,
            this.position.y,
            this.size.width,
            this.size.height,
        );
    }
}