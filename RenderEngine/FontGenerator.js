
export default class FontGenerator
{
    constructor(characterDataUrl, {
        maxCharacters = 16384,

    } = {}){
        this.characterDataUrl = characterDataUrl;
        this.vert = [];
        this.ind = [];
        this.chars = {};
        this.indIndex = 0;
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
        this.vert = [];
        this.ind = [];
        this.indIndex = 0;
    }

    addText(text, xPos, yPos, zPos)
    {  
        let advance = 0;
        let yadvance = 0;

        let spaceAdvance = this.chars[' '][4];

        for (let i = 0; i < text.length; i++) { 
            let c = text[i];

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
                //console.log(c, w, h, xoffset, yoffset, xadvance);
                this.vert.push(xPos + advance + 0 + xoffset, yPos + yadvance - h - yoffset, zPos, 0, 0, 0, x, 1-(y+h));
                this.vert.push(xPos + advance + 0 + xoffset, yPos + yadvance + 0 - yoffset, zPos, 0, 0, 0, x, 1-y);
                this.vert.push(xPos + advance + w + xoffset, yPos + yadvance + 0 - yoffset, zPos, 0, 0, 0, x+w, 1-y);
                this.vert.push(xPos + advance + w + xoffset, yPos + yadvance - h - yoffset, zPos, 0, 0, 0, x+w, 1-(y+h));
        
                this.ind.push(this.indIndex + 0);
                this.ind.push(this.indIndex + 1);
                this.ind.push(this.indIndex + 2);
                this.ind.push(this.indIndex + 2);
                this.ind.push(this.indIndex + 3);
                this.ind.push(this.indIndex + 0);
                this.indIndex += 4;
                advance += xadvance;
            }
        }
    }
}