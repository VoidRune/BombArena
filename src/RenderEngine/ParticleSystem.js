
export class Particle
{
    constructor(position = [0, 0, 0],
                velocity = [0, 0, 0], 
                lifetime = 2, 
                gravityStrength = 0.0,
                rotationStart = 0, 
                rotationEnd = 0, 
                colorStart = [1, 1, 1],
                colorEnd = [0, 0, 0],
                fadeOff = 0.2,
                radiusStart = 0.5, 
                radiusEnd = 0.5,
                texCoord = [0, 0, 1, 1])
    {
        this.position = position;
        this.velocity = velocity;
        this.gravityStrength = gravityStrength;
        this.rotationStart = rotationStart;
        this.rotationEnd = rotationEnd;
        this.colorStart = colorStart;
        this.colorEnd = colorEnd;
        this.fadeOff = fadeOff;
        this.radiusStart = radiusStart;
        this.radiusEnd = radiusEnd;
        this.texCoord = texCoord;

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
        this.PARTICLE_SIZE = (3 + 1 + 4 + 4 + 4);
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

    update(elapsedTime, dt, camPos)
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
            let lifeElapsedInverse = 1.0 - lifeElapsed;

            p.position[0] += p.velocity[0] * dt;
            p.position[1] += p.velocity[1] * dt;
            p.position[2] += p.velocity[2] * dt;

            p.velocity[1] -= 9.81 * p.gravityStrength * dt;

            // POSITION
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 0] = p.position[0];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 1] = p.position[1];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 2] = p.position[2];
            // ROTATION
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 3] = lifeElapsedInverse * p.rotationStart + lifeElapsed * p.rotationEnd;
            // COLOR
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 4] = lifeElapsedInverse * p.colorStart[0] + lifeElapsed * p.colorEnd[0];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 5] = lifeElapsedInverse * p.colorStart[1] + lifeElapsed * p.colorEnd[1];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 6] = lifeElapsedInverse * p.colorStart[2] + lifeElapsed * p.colorEnd[2];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 7] = (p.fadeOff == 0.0) ? 1.0 : lifeElapsedInverse / p.fadeOff;
 
            // SCALE
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 8] = lifeElapsedInverse * p.radiusStart + lifeElapsed * p.radiusEnd;
            // PADDING
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 9] = 0.0;
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 10] = 0.0;
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 11] = 0.0;
            // TEXTURE COORD
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 12] = p.texCoord[0];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 13] = p.texCoord[1];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 14] = p.texCoord[2];
            this.particleGPUBuffer[this.PARTICLE_SIZE * i + 15] = p.texCoord[3];

            this.particleCount++;
        }
        //this.particles.sort((a, b) => {
        //        let v1 = [a.position[0] - camPos[0], a.position[1] - camPos[1], a.position[2] - camPos[2]];
        //        let v2 = [b.position[0] - camPos[0], b.position[1] - camPos[1], b.position[2] - camPos[2]];
        //        let d1 = v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2];
        //        let d2 = v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2];
        //        return d2 - d1; 
        //    });

    }
}