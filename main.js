import * as App from './Application.js';

await App.Init();
/* Run 60 fps */
var UPDATE_INTERVAL  = 0.16666;
setInterval(App.RenderFrame, UPDATE_INTERVAL);