import { vec3, mat4 } from '../Math/gl-matrix-module.js';
//import Input from '../Input.js';

export default class Camera
{
    constructor(canvas, input, {
        position = [0, 5,-2],
        movementSpeed = 0.5,

        pitch = -Math.PI/3,
        yaw = 0,
        fov = 70, /* Degrees */ 
        nearPlane = 0.1,
        farPlane = 1000.0,
    } = {}){
        this.input = input;
        this.canvas = canvas;

        this.pitch = pitch;
        this.yaw = yaw;

        this.position = position;
        this.movementSpeed = movementSpeed;
        this.fov = fov;
        this.nearPlane = nearPlane;
        this.farPlane = farPlane;

        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
        this.invViewMatrix = mat4.create();
        this.invProjectionMatrix = mat4.create();
        this.recalculateProjection(fov, nearPlane, farPlane);
    }

    recalculateProjection(fov, nearPlane = this.nearPlane, farPlane = this.farPlane)
    {
        this.fov = fov;
        this.nearPlane = nearPlane;
        this.farPlane = farPlane;

        mat4.perspectiveZO(
            this.projectionMatrix,
            (fov * Math.PI) / 180, 
            this.canvas.width / this.canvas.height, 
            this.nearPlane, 
            this.farPlane
        );

        this.projectionMatrix[5] *= -1;

        mat4.invert(this.invProjectionMatrix, this.projectionMatrix);
    }

    update(dt)
    {
        //this.pitch = this.input.dx;
        //this.yaw = this.input.dy;

        const cy = Math.cos(this.yaw);
        const sy = Math.sin(this.yaw);
        const cp = Math.cos(this.pitch);
        const sp = Math.sin(this.pitch);
        const forward = [sy, 0, cy];
        const right = [cy, 0,-sy];
        const up = [0, 1, 0];
        const upInverted = [0,-1, 0];

        const camForward = [sy * cp, sp, cy * cp];

        /*const acc = vec3.create();
        if (this.input.keys['KeyW']) { vec3.add(acc, acc, forward); }
        if (this.input.keys['KeyS']) { vec3.sub(acc, acc, forward); }
        if (this.input.keys['KeyD']) { vec3.add(acc, acc, right); }
        if (this.input.keys['KeyA']) { vec3.sub(acc, acc, right); }
        vec3.normalize(acc, acc);
        if (this.input.keys['Space']) { vec3.add(acc, acc, up); }
        if (this.input.keys['ShiftLeft']) { vec3.sub(acc, acc, up); }
  
        let mul = dt * this.movementSpeed;
        if (this.input.keys['KeyF']) { mul *= 5; }

        vec3.mul(acc, vec3.fromValues(mul, mul, mul), acc)
        vec3.add(this.position, this.position, acc);*/

        let target = vec3.create();
        vec3.add(target, this.position, camForward);

        mat4.lookAt(this.viewMatrix, this.position, target, upInverted);
        mat4.invert(this.invViewMatrix, this.viewMatrix);
    }

    updatePosition(newPosition, distance) {
        distance = (distance/10) + 3
        const offset = [0, Math.tan(Math.PI/3) * distance, -Math.tan(this.fov/2 * (Math.PI / 180)) * distance * 2]
        vec3.add(this.position, newPosition, offset)
    }
}