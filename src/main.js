import * as App from './Application.js';

await App.Init();
document.getElementById("statusIndicator").remove()
/* Run 60 fps */
App.pause()
requestAnimationFrame(App.RenderFrame);
const startButton = document.getElementById('startButton')
startButton.style.display = ""
startButton.addEventListener('click', () => {
    startButton.remove()
    document.getElementById("cover").remove()
    startGame()
})

function startGame() {
    let backgroundMusic = new Audio('/res/audio/music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5
    backgroundMusic.play();
    App.unpause()
}