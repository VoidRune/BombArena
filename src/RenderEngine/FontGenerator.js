
export class Text
{
    constructor(string = "Test",
                position = [0, 0.1],
                scale = 1,
                color = [1, 1, 1])
    {
        this.string = string;
        this.position = position;
        this.scale = scale;
        this.color = color;
    }
}

export default class FontGenerator
{
    constructor(characterDataUrl, {
        maxCharacters = 1024,

    } = {}){
        this.characterDataUrl = characterDataUrl;
        this.maxCharacters = maxCharacters;
        this.vert = [];
        this.chars = {};
        this.indIndex = 0;

        this.dirty = false;

        this.vertexSize = (2 + 3 + 2);
        this.quadVertices = new Float32Array(maxCharacters * 4 * this.vertexSize);
        this.quadIndices = new Uint32Array(maxCharacters * 6);

        this.textObjects = [];

        for(let i = 0; i < maxCharacters; i++)
        {
            this.quadIndices[i * 6 + 0] = i * 4 + 0;
            this.quadIndices[i * 6 + 1] = i * 4 + 1;
            this.quadIndices[i * 6 + 2] = i * 4 + 2;
            this.quadIndices[i * 6 + 3] = i * 4 + 2;
            this.quadIndices[i * 6 + 4] = i * 4 + 3;
            this.quadIndices[i * 6 + 5] = i * 4 + 0;
        }
    }

    async init()
    {
        await fetch(this.characterDataUrl)
        .then((res) => res.text())
        .then((text) => {
          
            var inputArray = text.split('\n');
            for ( let i = 1; i < inputArray.length; i++)
            {
                // TODO regex for , (comma) and " (quotes)
                let line = inputArray[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

                let d = 1024.0;
                let id = line[0];
                let index= line[1];
                let char= line[2];
                let width= +line[3] / d;
                let height= +line[4] / d;
                let xoffset= +line[5] / d;
                let yoffset= +line[6] / d;
                let xadvance= +line[7] / d;
                let chnl= line[8];
                let x= +line[9] / d;
                let y= +line[10] / d;
                let page= line[11];
    
                this.chars[char] = [width, height, xoffset, yoffset, xadvance, x, y];
            }    
        })
    }

    reset()
    {
        this.indIndex = 0;
    }

    update()
    {
        this.indIndex = 0;

        for (let i = 0; i < this.textObjects.length; i++)
        {
            let t = this.textObjects[i];
            this.generateMesh(t);
        }

    }

    addText(text)
    {  
        this.textObjects.push(text);

        this.generateMesh(text);
    }

    generateMesh(text)
    {
        let advance = 0;
        let yadvance = 0;

        let spaceAdvance = this.chars[' '][4];

        for (let i = 0; i < text.string.length; i++) { 
            let c = text.string[i];

            if(c == '\n')
            {
                advance = 0;
                yadvance -= 0.12;
                continue;
            }
            if(c == ' ')
            {
                advance += spaceAdvance;
                if(advance >= 4)
                {
                    advance = 0;
                    yadvance -= 0.12;
                }
                continue;
            }
            if(this.chars[c])
            {
                let [ w, h, xoffset, yoffset, xadvance, x, y] = this.chars[c];

                let a = this.vertexSize * this.indIndex;
                this.quadVertices[a + 0] = text.position[0] + text.scale * (advance + 0 + xoffset);
                this.quadVertices[a + 1] = text.position[1] + text.scale * (yadvance - h - yoffset);
                this.quadVertices[a + 2] = text.color[0];
                this.quadVertices[a + 3] = text.color[1];
                this.quadVertices[a + 4] = text.color[2];
                this.quadVertices[a + 5] = x;
                this.quadVertices[a + 6] = 1-(y+h);

                this.quadVertices[a + 7 + 0] = text.position[0] + text.scale * (advance + 0 + xoffset);
                this.quadVertices[a + 7 + 1] = text.position[1] + text.scale * (yadvance + 0 - yoffset);
                this.quadVertices[a + 7 + 2] = text.color[0];
                this.quadVertices[a + 7 + 3] = text.color[1];
                this.quadVertices[a + 7 + 4] = text.color[2];
                this.quadVertices[a + 7 + 5] = x;
                this.quadVertices[a + 7 + 6] = 1-y;

                this.quadVertices[a + 14 + 0] = text.position[0] + text.scale * (advance + w + xoffset);
                this.quadVertices[a + 14 + 1] = text.position[1] + text.scale * (yadvance + 0 - yoffset);
                this.quadVertices[a + 14 + 2] = text.color[0];
                this.quadVertices[a + 14 + 3] = text.color[1];
                this.quadVertices[a + 14 + 4] = text.color[2];
                this.quadVertices[a + 14 + 5] = x+w;
                this.quadVertices[a + 14 + 6] = 1-y;

                this.quadVertices[a + 21 + 0] = text.position[0] + text.scale * (advance + w + xoffset);
                this.quadVertices[a + 21 + 1] = text.position[1] + text.scale * (yadvance - h - yoffset);
                this.quadVertices[a + 21 + 2] = text.color[0];
                this.quadVertices[a + 21 + 3] = text.color[1];
                this.quadVertices[a + 21 + 4] = text.color[2];
                this.quadVertices[a + 21 + 5] = x+w;
                this.quadVertices[a + 21 + 6] = 1-(y+h);

                this.indIndex += 4;
                advance += xadvance;
            }
        }

        this.dirty = true;
    }
}