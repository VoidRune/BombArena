import { vec3, mat4 } from '../Math/gl-matrix-module.js';

export default class Camera
{
    constructor(canvas, {
        position = [0, 1,-2],
        sensitivity = 0.005, 
        movementSpeed = 2.5,

        pitch = 0,
        yaw = 0,
        fov = 70, /* Degrees */ 
        nearPlane = 0.1,
        farPlane = 1000.0,
    } = {}){
        this.canvas = canvas;

        this.pitch = pitch;
        this.yaw = yaw;

        this.position = position;
        this.sensitivity = sensitivity;
        this.movementSpeed = movementSpeed;
        this.fov = fov;
        this.nearPlane = nearPlane;
        this.farPlane = farPlane;

        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
        this.recalculateProjection(fov, nearPlane, farPlane);

        this.keys = {};
        this.mouseDown = false;

        /* Init input handlers */
        this.mouseDownHandler = this.mouseDownHandler.bind(this);
        this.mouseUpHandler = this.mouseUpHandler.bind(this);
        this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        const doc = this.canvas.ownerDocument;
        doc.addEventListener('keydown', this.keydownHandler);
        doc.addEventListener('keyup', this.keyupHandler);
        doc.addEventListener('mousemove', this.mouseMoveHandler);
        doc.addEventListener('mousedown', this.mouseDownHandler);
        doc.addEventListener('mouseup', this.mouseUpHandler);
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
    }

    update(dt)
    {
        const cy = Math.cos(this.yaw);
        const sy = Math.sin(this.yaw);
        const cp = Math.cos(this.pitch);
        const sp = Math.sin(this.pitch);
        const forward = [sy, 0, cy];
        const right = [cy, 0,-sy];
        const up = [0, 1, 0];
        const upInverted = [0,-1, 0];

        const camForward = [sy * cp, sp, cy * cp];

        const acc = vec3.create();
        if (this.keys['KeyW']) { vec3.add(acc, acc, forward); }
        if (this.keys['KeyS']) { vec3.sub(acc, acc, forward); }
        if (this.keys['KeyD']) { vec3.add(acc, acc, right); }
        if (this.keys['KeyA']) { vec3.sub(acc, acc, right); }
        vec3.normalize(acc, acc);
        if (this.keys['Space']) { vec3.add(acc, acc, up); }
        if (this.keys['ShiftLeft']) { vec3.sub(acc, acc, up); }
  
        let mul = dt * this.movementSpeed;
        if (this.keys['KeyF']) { mul *= 5; }

        vec3.mul(acc, vec3.fromValues(mul, mul, mul), acc)
        vec3.add(this.position, this.position, acc);
        let target = vec3.create();
        vec3.add(target, this.position, camForward);

        mat4.lookAt(this.viewMatrix, this.position, target, upInverted);
    }

    mouseDownHandler(e) {
        this.mouseDown = true;
    }

    mouseUpHandler(e) {
        this.mouseDown = false;
    }

    mouseMoveHandler(e) {
        if(this.mouseDown == true)
        {
            const dx = e.movementX;
            const dy = e.movementY;

            this.pitch -= dy * this.sensitivity;
            this.yaw   += dx * this.sensitivity;

            const twopi = Math.PI * 2;
            const halfpi_less = 1.5533430343;
            
            this.pitch = Math.min(Math.max(this.pitch, -halfpi_less), halfpi_less);
            this.yaw = ((this.yaw % twopi) + twopi) % twopi;
        }
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }
}