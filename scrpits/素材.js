auto();
const U = require("/storage/emulated/0/脚本/scrpit/utils/utils.js"); //[cite: 1]
const P = require("/storage/emulated/0/脚本/scrpit/constant/坐标.js"); //[cite: 1]

toast("刷魔素脚本开始 - 场景检测版");
console.log("刷魔素脚本启动");

// 更稳健的屏幕截取 //[cite: 1]
function safeRequestScreenCapture(maxAttempts = 3) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            if (requestScreenCapture(true)) return true;
        } catch (e) {
            console.log("屏幕截取申请异常，等待重试: " + e);
        }
        sleep(800);
    }
    toast("屏幕截取失败，请授予权限或重启脚本");
    return false;
}

if (!safeRequestScreenCapture()) {
    throw new Error("无法获取屏幕截图权限");
}

// 场景枚举
const SCENE = {
    UNKNOWN: 0,
    MAIN: 1,
    DECOMPOSE: 2
};

// 全局任务状态
let taskState = {
    needDecompose: false, 
    lastCombatTime: 0
};

// 场景检测器 //[cite: 1, 2]
function detectScene() {
    // 1. 检测是否在分解界面 //[cite: 1, 2]
    let decomposeOcr = U.ocrRegionCenter(P.开始加工[0], P.开始加工[1], 300, 300, P.REF_WIDTH, P.REF_HEIGHT) || []; 
    if (decomposeOcr.some(t => t && t.includes("开始加工"))) { //[cite: 1]
        return SCENE.DECOMPOSE;
    }

    // 2. 检测是否在主界面 //[cite: 1, 2]
    const mainPageTemplate = "/storage/emulated/0/脚本/scrpit/images/商店.png"; //[cite: 1]
    if (U.isMainPage(mainPageTemplate)) {
        return SCENE.MAIN;
    }

    return SCENE.UNKNOWN;
}

// 辅助点击函数 //[cite: 1]
function clickSteps(steps, delay = 900) {
    steps.forEach(pt => {
        try {
            sleep(delay);
            U.clickByPoint(pt, P.REF_WIDTH, P.REF_HEIGHT); //[cite: 1, 2]
        } catch (e) {
            log("click step failed: " + e);
        }
    });
}

// 随机延时 //[cite: 1]
function sleepRandom(min, max) {
    sleep(min + Math.floor(Math.random() * (max - min + 1)));
}

// 百分比滑动 //[cite: 1]
function swipePercent(x1p, y1p, x2p, y2p, duration) {
    let w = device.width;
    let h = device.height;
    swipe(Math.floor(x1p * w), Math.floor(y1p * h), Math.floor(x2p * w), Math.min(Math.floor(y2p * h), h - 1), duration);
}

/**
 * OCR 识别指定文本并点击其中心（带坐标托底） //[cite: 2]
 * @param {string} text - 目标文本（如 "锻造"）
 * @param {Array} fallbackPoint - OCR识别失败时的备用点击坐标 //[cite: 3]
 */
function clickText(text, fallbackPoint) {
    let img = null;
    try {
        img = captureScreen(); //[cite: 1, 2]
        if (!img) throw new Error("截图失败");

        let ocrResult = null;
        if (typeof gmlkit !== 'undefined') {
            ocrResult = gmlkit.ocr(img, "zh"); // 优先使用高精度 gmlkit //[cite: 2]
        } else {
            ocrResult = ocr(img); //[cite: 2]
        }

        if (ocrResult) {
            // 1. 尝试直接精准查找
            if (typeof ocrResult.find === 'function') {
                let target = ocrResult.find(3, { text: text });
                if (target) {
                    let bounds = target.bounds;
                    console.log(`OCR 精确找到 [${text}] -> 坐标: (${bounds.centerX()}, ${bounds.centerY()})`);
                    click(bounds.centerX(), bounds.centerY());
                    return true;
                }
            }

            // 2. 模糊匹配子元素 //[cite: 2]
            let children = ocrResult.children || ocrResult;
            if (children && (Array.isArray(children) || typeof children.length === 'number')) {
                for (let i = 0; i < children.length; i++) {
                    let child = children[i];
                    let childText = typeof child === 'string' ? child : (child.text || "");
                    if (childText && childText.indexOf(text) !== -1) {
                        if (child.bounds) {
                            let bounds = child.bounds;
                            console.log(`OCR 模糊找到 [${text}] (原词: ${childText}) -> 坐标: (${bounds.centerX()}, ${bounds.centerY()})`);
                            click(bounds.centerX(), bounds.centerY());
                            return true;
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.log("OCR 查找 [" + text + "] 异常: " + e);
    } finally {
        if (img) img.recycle(); //[cite: 2]
    }

    // 3. OCR 识别失败时的托底机制 //[cite: 1]
    if (fallbackPoint) {
        console.log(`OCR 未找到 [${text}]，使用托底坐标点击`);
        U.clickByPoint(fallbackPoint, P.REF_WIDTH, P.REF_HEIGHT); //[cite: 1, 2]
        return true;
    }
    return false;
}

// 单选开关切换 //[cite: 1]
function ensureOneSelect() {
    try {
        var result = U.ocrRegionCenter(P.单选[0], P.单选[1], 400, 400, P.REF_WIDTH, P.REF_HEIGHT) || []; //[cite: 1, 2, 3]
        if (result.some(t => t && t.includes("单选"))) { //[cite: 1]
            U.clickByPoint([P.单选[0], P.单选[1]], P.REF_WIDTH, P.REF_HEIGHT); //[cite: 1, 2, 3]
            sleep(500);
            return true;
        }
    } catch (e) {
        log("oneSelectSwitch ocr error: " + e);
    }
    return false;
}

// 处理魔导设备分解 //[cite: 1]
function processMagicDevice() {
    const templatePath = "/storage/emulated/0/脚本/scrpit/images/魔导.png"; //[cite: 1]
    if (!files.exists(templatePath)) return false;

    let template = images.read(templatePath); //[cite: 1]
    if (!template) return false;

    let foundAndClicked = false;
    try {
        let img = captureScreen(); //[cite: 1, 2]
        let matchResult = images.matchTemplate(img, template, { threshold: 0.80, max: 100 }); //[cite: 1]
        
        if (matchResult && matchResult.matches && matchResult.matches.length) {
            let matches = matchResult.matches
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 20); // 取前20个匹配点 //[cite: 1]

            matches.forEach(match => {
                U.pressByPoint([match.point.x, match.point.y], 30, P.REF_WIDTH, P.REF_HEIGHT); //[cite: 1, 2]
                sleepRandom(120, 200); //[cite: 1]
            });
            
            // 点击加工确认流程 //[cite: 1, 3]
            clickSteps([P.开始加工, P.确认, P.领取点数, P.领取点数之后], 1000); 
            foundAndClicked = true;
        }
    } finally {
        if (template) template.recycle();
    }
    return foundAndClicked;
}

// 战斗循环逻辑 //[cite: 1]
function runCombatSequence() {
    console.log("进入战斗序列...");
    U.pressByPoint(P.摄影模式, 100, P.REF_WIDTH, P.REF_HEIGHT); //[cite: 1, 3]
    sleep(1500);
    swipePercent(0.175, 0.800, 0.175, 1, 3000); //[cite: 1]
    sleep(1000);

    const timeoutMs = 2 * 60 * 1000; // 2分钟战斗 //[cite: 1]
    let start = Date.now();
    
    while (Date.now() - start < timeoutMs) {
        U.pressByPoint(P.神速, 30, P.REF_WIDTH, P.REF_HEIGHT); //[cite: 1, 3]
        for (let i = 0; i < 150; i++) {
            U.pressByPoint(P.攻击, 20, P.REF_WIDTH, P.REF_HEIGHT); //[cite: 1, 3]
            sleep(100);
            if ((i + 1) % 20 === 0) {
                U.pressByPoint(P.旭日, 20, P.REF_WIDTH, P.REF_HEIGHT); //[cite: 1, 3]
                sleep(120);
            }
        }
    }
    console.log("战斗时间达标，准备去分解");
    taskState.needDecompose = true; 
    
    // 关闭摄影模式 //[cite: 1, 3]
    U.clickByPoint(P.关闭, P.REF_WIDTH, P.REF_HEIGHT); //[cite: 1, 3]
    sleep(1500);
}

// 状态机主引擎
function main() {
    while (true) {
        let currentScene = detectScene();
        console.log("当前场景检测结果: ", currentScene);

        switch (currentScene) {
            case SCENE.MAIN:
                if (taskState.needDecompose) {
                    console.log("主界面 -> 尝试进入分解界面");
                    
                    // 1. 先点击前四个常规菜单步骤 //[cite: 1, 3]
                    clickSteps([P.选单, P.角色, P.技能, P.使用特殊技能], 1000);
                    sleep(1200); // 等待技能列表渲染
                    
                    // 2. OCR 寻找并点击“锻造大师”（匹配“锻造”二字，失败则用未学汪坐标托底） //[cite: 3]
                    clickText("锻造", P.锻造大师技能未学汪); 
                    sleep(1200);
                    
                    // 3. 点击素材加工 //[cite: 1, 3]
                    clickSteps([P.素材加工], 1000);
                    sleep(1500);
                } else {
                    console.log("主界面 -> 开始打怪");
                    runCombatSequence();
                }
                break;

            case SCENE.DECOMPOSE:
                console.log("处于分解界面，开始处理魔导设备");
                ensureOneSelect();
                
                let processCount = 0;
                while (processCount < 5) { 
                    if (!processMagicDevice()) {
                        console.log("未识别到魔导设备，分解完毕");
                        break;
                    }
                    sleep(1000);
                    processCount++;
                }
                
                // 分解完毕，重置状态并退回主界面 //[cite: 1, 3]
                taskState.needDecompose = false;
                clickSteps([P.关闭, P.关闭, P.关闭], 1000); 
                break;

            case SCENE.UNKNOWN:
            default:
                console.log("未知场景，尝试点击关闭或返回修正状态...");
                U.clickByPoint(P.关闭, P.REF_WIDTH, P.REF_HEIGHT); //[cite: 1, 3]
                sleep(1000);
                U.clickByPoint(P.返回, P.REF_WIDTH, P.REF_HEIGHT); //[cite: 1, 3]
                sleep(1000);
                break;
        }
        
        sleep(1000); 
    }
}

main();