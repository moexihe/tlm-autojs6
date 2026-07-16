auto();
const U = require("/storage/emulated/0/脚本/scrpit/utils/utils.js");
const P = require("/storage/emulated/0/脚本/scrpit/constant/坐标.js");
/* 申请屏幕截图权限. */
requestScreenCapture();
function attack() {
    console.log("[战斗] 开始攻击"); ``
    console.log("战斗开始前等待9s");
    sleep(9000);
    U.pressByPoint(P.双风暴, 10, P.REF_WIDTH, P.REF_HEIGHT);
    sleep(500);
    [P.神速, P.神速, P.神速].forEach(pt => {
        try {
            sleep(500);
            U.pressByPoint(pt, 10, P.REF_WIDTH, P.REF_HEIGHT);
        } catch (e) {
            log("[战斗] press step failed: " + e);
        }
    });
    console.log("StartPoint", P.起点坐标, "EndPoint", P.终点坐标);
    U.swipeByPoints(P.起点坐标, P.终点坐标, P.REF_WIDTH, P.REF_HEIGHT, 4400);

    let rounds = 0;
    while (!U.ocrRegionCenter(P.跳过[0], P.跳过[1], 500, 200, P.REF_WIDTH, P.REF_HEIGHT).some(t => t && t.includes("跳过"))) {
        if (++rounds > 160) {
            console.log("[战斗] 未识别到跳过按钮，退出战斗循环");
            U.clickByPoint(P.确认, P.REF_WIDTH, P.REF_HEIGHT);
            break;
        }
        sleep(200);
        for (let i = 0; i < 3; i++) {
            U.pressByPoint(P.攻击, 10, P.REF_WIDTH, P.REF_HEIGHT);
            sleep(200);
        }
    }

    if (rounds <= 160) {
        console.log("[战斗] 点击跳过");
        U.clickByPoint(P.跳过, P.REF_WIDTH, P.REF_HEIGHT);
    }
}

function MoveToGame() {
    console.log("[主界面] 移动到特殊竞技场");
    U.pressByPoint(P.攻击, 700, P.REF_WIDTH, P.REF_HEIGHT);
    const steps = [P.特殊2竞技场位置, P.动作, P.动作];
    steps.forEach(pt => {
        try {
            sleep(500);
            U.clickByPoint(pt, P.REF_WIDTH, P.REF_HEIGHT);
        } catch (e) {
            log("[主界面] click step failed: " + e);
        }
    });
}


function checkSpecialArena() {
    console.log("[特殊竞技场] 点击特殊竞技场按钮");
    [P.特殊竞技场受理处].forEach(pt => {
        try {
            sleep(500);
            U.clickByPoint(pt, P.REF_WIDTH, P.REF_HEIGHT);
        } catch (e) {
            log("[特殊竞技场] click step failed: " + e);
        }
    });
    sleep(500);
    if(U.ocrRegionCenter(P.跳过[0], P.跳过[1], 500, 500, P.REF_WIDTH, P.REF_HEIGHT).some(t => t && t.includes("跳过"))){
        U.clickByPoint(P.跳过, P.REF_WIDTH, P.REF_HEIGHT);
    }
}


function checkReady() {
    console.log("[准备界面] 检查准备好了按钮");
    // let point = [1444, 906];
    // let ok = U.isPointColor(point, "#8e8e8e", 30, P.REF_WIDTH, P.REF_HEIGHT);
    // console.log("[准备界面] 检查准备好了按钮颜色:", ok);
    let readyText = U.ocrRegionCenter(P.准备好了[0], P.准备好了[1], 500, 300, P.REF_WIDTH, P.REF_HEIGHT) || [];
    let ready = readyText.some(t => t && t.includes("准备"));
    let ready1 = readyText.some(t => t && t.includes("完成"));// && !readyText.some(t => t && t.includes("等待开始")) && !ok;
    console.log("[准备界面] 检查准备好了文字:", ready, "检查完成文字:", ready1);
    if (ready || ready1) {
        U.clickByPoint(P.准备好了, P.REF_WIDTH, P.REF_HEIGHT);
        sleep(100);
    }
}

function isHomePage() {
    console.log("检查是否在主页面");
    sleep(1000);
    let shop = U.isMainPage("/storage/emulated/0/脚本/scrpit/images/商店.png");
    let hp = U.ocrRegionCenter(P.水晶位置[0], P.水晶位置[1], P.REF_WIDTH, P.REF_HEIGHT).some(t => t && t.includes("水晶"));
    let channel = U.ocrRegionCenter(P.频道[0], P.频道[1], 300, 200, P.REF_WIDTH, P.REF_HEIGHT).some(t => t && t.includes("道"));
    // let qx = U.isMainPage("/storage/emulated/0/脚本/scrpit/images/情绪.png");
    console.log("检查主页面结果 => shop:", shop, "hp:", hp, "channel:", channel);
    return shop && !hp && channel;
}
function BackMainPage() {
    for (var i = 0; i < 3; i++) {
        let i = isHomePage();
        let close = U.ocrRegionCenter(P.攻击[0], P.攻击[1], P.REF_WIDTH, P.REF_HEIGHT) || [];
        if (i === false && close.some(t => t && t.includes("关闭"))) {
            U.clickByPoint(P.关闭, P.REF_WIDTH, P.REF_HEIGHT);
            sleep(1200);
        }
        else {
            U.clickByPoint([1276, 754], P.REF_WIDTH, P.REF_HEIGHT);
        }
        if (i === false && close.some(t => t && t.includes("返回"))) {
            U.clickByPoint(P.返回, P.REF_WIDTH, P.REF_HEIGHT);
            sleep(1200);
        }
        else {
            U.clickByPoint([1276, 754], P.REF_WIDTH, P.REF_HEIGHT);
        }
    }
}
function Settlement() {
    U.clickByPoint(P.确认, P.REF_WIDTH, P.REF_HEIGHT);
}
function detectScene() {
    if (isHomePage()) {
        return "HOME";
    }

    let readyText = U.ocrRegionCenter(P.准备好了[0], P.准备好了[1], 500, 300, P.REF_WIDTH, P.REF_HEIGHT) || [];
    if (readyText.some(t => t && t.includes("准备好了")) || readyText.some(t => t && t.includes("等待开始"))) {
        return "READY";
    }

    let specialArenaText = U.ocrRegionCenter(P.特殊竞技场受理处[0], P.特殊竞技场受理处[1], P.REF_WIDTH, P.REF_HEIGHT) || [];
    if (specialArenaText.some(t => t && t.includes("放弃"))) {
        return "SPECIAL_ARENA";
    }

    let entryText = U.ocrRegionCenter(P.特殊2竞技场位置[0], P.特殊2竞技场位置[1], P.REF_WIDTH, P.REF_HEIGHT) || [];
    if (entryText.some(t => t && t.includes("前往其他地点"))) {
        return "SPECIAL_ENTRY";
    }

    let skipText = U.ocrRegionCenter(P.全屏位置[0], P.全屏位置[1], P.REF_WIDTH, P.REF_HEIGHT) || [];
    console.log("[战斗] 检查跳过按钮文字:", skipText);
    if (skipText.some(t => t && t.includes("水晶")) || U.isMainPage("/storage/emulated/0/脚本/scrpit/images/水晶血量.png") &&
        skipText.some(t => t && t.includes("时间"))) {
        return "BATTLE";
    }

    let Settlement = U.ocrRegionCenter(P.全屏位置[0], P.全屏位置[1], P.REF_WIDTH, P.REF_HEIGHT) || [];
    if (Settlement.some(t => t && t.includes("任务报酬"))) {
        return "Settlement";
    }

    return "UNKNOWN";
}

function handleHomeScene() {
    MoveToGame();
}

function handleSpecialArenaScene() {
    checkSpecialArena();
}

function handleReadyScene() {
    checkReady();
}

function handleBattleScene() {
    attack();
}
function handleSettlement() {
    Settlement();
}

function handleUnknownScene() {
    console.log("[场景检测] 未知场景，尝试回退/关闭");

    let closeText = U.ocrRegionCenter(P.关闭[0], P.关闭[1], 500, 351, P.REF_WIDTH, P.REF_HEIGHT) || [];
    if (closeText.some(t => t && t.includes("关"))) {
        U.clickByPoint(P.关闭, P.REF_WIDTH, P.REF_HEIGHT);
        sleep(1200);
        return;
    }

    let backText = U.ocrRegionCenter(P.返回[0], P.返回[1], 500, 351, P.REF_WIDTH, P.REF_HEIGHT) || [];
    if (backText.some(t => t && t.includes("返"))) {
        U.clickByPoint(P.返回, P.REF_WIDTH, P.REF_HEIGHT);
        sleep(1200);
        return;
    }

    U.clickByPoint([1276, 754], P.REF_WIDTH, P.REF_HEIGHT);
    sleep(1200);
}

function main() {
    console.setGlobalLogConfig({
        maxFileSize: 384 << 10, /* 384 KB. */
        rootLevel: "off",
    });
    while (true) {
        let scene = detectScene();
        console.log("[场景检测] 当前场景 =>", scene);
        switch (scene) {
            case "HOME":
            case "SPECIAL_ENTRY":
                handleHomeScene();
                break;
            case "SPECIAL_ARENA":
                handleSpecialArenaScene();
                break;
            case "READY":
                handleReadyScene();
                break;
            case "BATTLE":
                handleBattleScene();
                break;
            case "Settlement":
                handleSettlement();
                break;
            default:
                handleUnknownScene();
                break;
        }
        sleep(1000);
    }
}

main();