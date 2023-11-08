
export default class Input
{
    constructor(canvas)
    {
        this.canvas = canvas;

        this.dx = 0;
        this.dy = 0;
        this.keys = {};
        this.mouseDown = false;
        this.sensitivity = 0.005;
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

    mouseDownHandler(e) {
        this.mouseDown = true;
    }

    mouseUpHandler(e) {
        this.mouseDown = false;
    }

    mouseMoveHandler(e) {
        
        if(this.mouseDown == true)
        {
            this.dx -= e.movementY * this.sensitivity;
            this.dy   += e.movementX * this.sensitivity;

            const twopi = Math.PI * 2;
            const halfpi_less = 1.5533430343;
            
            this.dx = Math.min(Math.max(this.dx, -halfpi_less), halfpi_less);
            this.dy = ((this.dy % twopi) + twopi) % twopi;
        }
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }
}