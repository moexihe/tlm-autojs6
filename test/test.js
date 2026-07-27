auto();
const U = require("/storage/emulated/0/脚本/scrpit/utils/utils.js");
const P = require("/storage/emulated/0/脚本/scrpit/constant/坐标.js");
let img = captureScreen();
const template = "/storage/emulated/0/脚本/scrpit/images/商店.png"
let matchResult = U.findimg( template, { threshold: 0.80, max: 100 });
console.log(matchResult);
img.recyle;