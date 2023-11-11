

export async function loadTexture(url)
{
    const response = await fetch( new URL(url, import.meta.url).toString() );
    const imageBitmap = await createImageBitmap(await response.blob() );

    return imageBitmap;
}

export class Vertex {

    constructor({
        position = [0, 0, 0],
        texcoords = [0, 0],
        normal = [0, 0, 0],
        tangent = [0, 0, 0],
    } = {}) {
        this.position = position;
        this.texcoords = texcoords;
        this.normal = normal;
        this.tangent = tangent;
    }

}

export class Mesh {

    constructor({
        vertices = new Float32Array(),
        indices = new Uint32Array(),
    } = {}) {
        this.vertices = vertices;
        this.indices = indices;
    }

}

export async function loadMesh(url)
{
    const response = await fetch(url);
    const text = await response.text();
    
    const lines = text.split('\n');

    const vRegex = /v\s+(\S+)\s+(\S+)\s+(\S+)\s*/;
    const vData = lines
        .filter(line => vRegex.test(line))
        .map(line => [...line.match(vRegex)].slice(1))
        .map(entry => entry.map(entry => Number(entry)));

    const vnRegex = /vn\s+(\S+)\s+(\S+)\s+(\S+)\s*/;
    const vnData = lines
        .filter(line => vnRegex.test(line))
        .map(line => [...line.match(vnRegex)].slice(1))
        .map(entry => entry.map(entry => Number(entry)));

    const vtRegex = /vt\s+(\S+)\s+(\S+)\s*/;
    const vtData = lines
        .filter(line => vtRegex.test(line))
        .map(line => [...line.match(vtRegex)].slice(1))
        .map(entry => entry.map(entry => Number(entry)));

    function triangulate(list) {
        const triangles = [];
        for (let i = 2; i < list.length; i++) {
            triangles.push(list[0], list[i - 1], list[i]);
        }
        return triangles;
    }

    const fRegex = /f\s+(.*)/;
    const fData = lines
        .filter(line => fRegex.test(line))
        .map(line => line.match(fRegex)[1])
        .map(line => line.trim().split(/\s+/))
        .flatMap(face => triangulate(face));

    const vertices = [];
    const indices = [];
    const cache = {};
    let cacheLength = 0;
    const indicesRegex = /(\d+)(\/(\d+))?(\/(\d+))?/;

    for (const id of fData) {
        if (id in cache) {
            indices.push(cache[id]);
        } else {
            cache[id] = cacheLength;
            indices.push(cacheLength);
            const [,vIndex,,vtIndex,,vnIndex] = [...id.match(indicesRegex)]
                .map(entry => Number(entry) - 1);

            vertices.push(vData[vIndex][0]);
            vertices.push(vData[vIndex][1]);
            vertices.push(vData[vIndex][2]);

            if(vnData[vnIndex])
            {
                vertices.push(vnData[vnIndex][0]);
                vertices.push(vnData[vnIndex][1]);
                vertices.push(vnData[vnIndex][2]);
            }
            else
            {
                vertices.push(0);
                vertices.push(0);
                vertices.push(0);
            }

            if(vtData[vtIndex])
            {
                vertices.push(vtData[vtIndex][0]);
                vertices.push(vtData[vtIndex][1]);
            }
            else
            {
                vertices.push(0);
                vertices.push(0);
            }

            cacheLength++;
        }
    }

    return new Mesh({ vertices: new Float32Array(vertices), indices: new Uint32Array(indices) });
}