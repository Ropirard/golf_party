import MovingObject from "./MovingObject";

export default class Ball extends MovingObject {
    maxSpeed = 12;

    constructor(image, width, height, orientation, speed, maxSpeed = 12) {
        super(image, width, height, orientation, speed);
        this.maxSpeed = maxSpeed;
    }
}