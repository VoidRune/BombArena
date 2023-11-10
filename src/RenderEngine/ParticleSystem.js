
export class Particle
{
    constructor(position = [0, 0, 0],
                velocity = [0, 0, 0], 
                lifetime = 2, 
                rotationStart = 0, 
                rotationEnd = 0, 
                colorStart = [1, 1, 1],
                colorEnd = [0, 0, 0],
                radiusStart = 0.5, 
                radiusEnd = 0.5)
    {
        this.position = position;
        this.velocity = velocity;
        this.rotationStart = rotationStart;
        this.rotationEnd = rotationEnd;
        this.colorStart = colorStart;
        this.colorEnd = colorEnd;
        this.radiusStart = radiusStart;
        this.radiusEnd = radiusEnd;
        
        this.lifetime = lifetime;
        this.startTime = 0;
        this.currentLifeTime = 0;
    }
}

export default class ParticleSystem
{
    constructor(maxParticles = 512){
        this.maxParticles = maxParticles;
        this.particles = [];
        this.PARTICLE_SIZE = (3 + 1 + 3 + 1);
        this.particleGPUBuffer = new Float32Array(this.PARTICLE_SIZE * maxParticles);
        this.particleCount = 0;
    }

    emit(elapsedTime, particle)
    {
        if(this.particles.length === this.maxParticles)
            return;

        particle.startTime = elapsedTime;
        this.particles.push(particle);
    }

    update(elapsedTime, dt)
    {
        this.particleCount = 0;
        for (let i = 0; i < this.particles.length; i++)
        {
            let p = this.particles[i];
            let lifeElapsed = ((elapsedTime - p.startTime) / p.lifetime);
    
            if(lifeElapsed > 1)
            {
                this.particles.splice(i, 1);
                i--;
                continue;
            }
    
            p.position[0] += p.velocity[0] * dt;
            p.position[1] += p.velocity[1] * dt;
            p.position[2] += p.velocity[2] * dt;

            // POSITION
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 0] = p.position[0];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 1] = p.position[1];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 2] = p.position[2];
            // ROTATION
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 3] = (1 - lifeElapsed) * p.rotationStart + lifeElapsed * p.rotationEnd;
            // COLOR
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 4] = (1 - lifeElapsed) * p.colorStart[0] + lifeElapsed * p.colorEnd[0];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 5] = (1 - lifeElapsed) * p.colorStart[1] + lifeElapsed * p.colorEnd[1];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 6] = (1 - lifeElapsed) * p.colorStart[2] + lifeElapsed * p.colorEnd[2];
            // SCALE
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 7] = (1 - lifeElapsed) * p.radiusStart + lifeElapsed * p.radiusEnd;

            this.particleCount++;
        }
    }
}