auto();
const U = require("/storage/emulated/0/脚本/scrpit/utils/utils.js");
const P = require("/storage/emulated/0/脚本/scrpit/constant/坐标.js");

function isHomePage() {
    console.log("检查是否在主页面");
    sleep(1000);
    let shop = U.isMainPage("/storage/emulated/0/脚本/scrpit/images/商店.png");
          
    // let qx = U.isMainPage("/storage/emulated/0/脚本/scrpit/images/情绪.png");
    // console.log("检查主页面结果 => shop:", shop, "hp:", hp, "channel:", channel);
    // console.log("最终结果:", shop && !hp && channel);
    // return shop && !hp && channel;
    console.log("检查主页面结果 => shop:", shop);
}

    // let skipText = U.ocrRegionCenter(P.全屏位置[0], P.全屏位置[1], P.REF_WIDTH, P.REF_HEIGHT) || [];
    // console.log("[战斗] 检查跳过按钮文字:", skipText);
    // if (skipText.some(t => t && t.includes("水晶")) || U.isMainPage("/storage/emulated/0/脚本/scrpit/images/水晶血量.png") &&
    //     skipText.some(t => t && t.includes("时间"))) {
    // }
 isHomePage();