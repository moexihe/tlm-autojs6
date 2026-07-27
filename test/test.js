auto();
const U = require("/storage/emulated/0/脚本/scrpit/utils/utils.js");
const P = require("/storage/emulated/0/脚本/scrpit/constant/坐标.js");
const template = "/storage/emulated/0/脚本/scrpit/images/素材/金属/0.png"
let matchResult = U.findimg( template, { threshold: 0.80, max: 100 });
console.log(matchResult);