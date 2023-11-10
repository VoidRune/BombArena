import * as App from './Application.js';

await App.Init();
/* Run 60 fps */
requestAnimationFrame(App.RenderFrame);