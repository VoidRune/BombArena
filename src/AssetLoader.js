

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

            // POSITION
            vertices.push(vData[vIndex][0]);
            vertices.push(vData[vIndex][1]);
            vertices.push(vData[vIndex][2]);

            // NORMAL
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

            // TANGENT
            vertices.push(0.0);
            vertices.push(0.0);
            vertices.push(0.0);

            // TEX COORD
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

    let sizeOfVertex = 11;
    for(let i = 0; i < indices.length; i+=3)
    {
        // CALCULATE TANGENT
        let i1 = indices[i + 0];
        let i2 = indices[i + 1];
        let i3 = indices[i + 2];

        let p1 = [vertices[sizeOfVertex * i1 + 0], vertices[sizeOfVertex * i1 + 1], vertices[sizeOfVertex * i1 + 2]];
        let p2 = [vertices[sizeOfVertex * i2 + 0], vertices[sizeOfVertex * i2 + 1], vertices[sizeOfVertex * i2 + 2]];
        let p3 = [vertices[sizeOfVertex * i3 + 0], vertices[sizeOfVertex * i3 + 1], vertices[sizeOfVertex * i3 + 2]];
        let u1 = [vertices[sizeOfVertex * i1 + 9], vertices[sizeOfVertex * i1 + 10]];
        let u2 = [vertices[sizeOfVertex * i2 + 9], vertices[sizeOfVertex * i2 + 10]];
        let u3 = [vertices[sizeOfVertex * i3 + 9], vertices[sizeOfVertex * i3 + 10]];

        let edge1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
        let edge2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
        let deltaUV1 = [u2[0] - u1[0], u2[1] - u1[1]];
        let deltaUV2 = [u3[0] - u1[0], u3[1] - u1[1]];

        let f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);
        let tangent = [];
        tangent.push(f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]));
        tangent.push(f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]));
        tangent.push(f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]));

        vertices[sizeOfVertex * i1 + 6] = tangent[0];
        vertices[sizeOfVertex * i1 + 7] = tangent[1];
        vertices[sizeOfVertex * i1 + 8] = tangent[2];

        vertices[sizeOfVertex * i2 + 6] = tangent[0];
        vertices[sizeOfVertex * i2 + 7] = tangent[1];
        vertices[sizeOfVertex * i2 + 8] = tangent[2];

        vertices[sizeOfVertex * i3 + 6] = tangent[0];
        vertices[sizeOfVertex * i3 + 7] = tangent[1];
        vertices[sizeOfVertex * i3 + 8] = tangent[2];
    }

    return new Mesh({ vertices: new Float32Array(vertices), indices: new Uint32Array(indices) });
}