auto();
const U = require("/storage/emulated/0/脚本/scrpit/utils/utils.js");
const P = require("/storage/emulated/0/脚本/scrpit/constant/坐标.js");
while(true){
    U.pressByPoint(P.精炼装备_选择精炼材料,10,P.REF_WIDTH,P.REF_HEIGHT); //选择精炼材料
    sleep(30);
    U.pressByPoint(P.开始精炼,10,P.REF_WIDTH,P.REF_HEIGHT); //选择精炼 
    sleep(30);
    U.pressByPoint(P.精炼完成,10,P.REF_WIDTH,P.REF_HEIGHT); //选择精炼材料
    sleep(30);
}
