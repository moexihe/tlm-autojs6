auto();
const U = require("/storage/emulated/0/脚本/scrpit/utils/utils.js");
const P = require("/storage/emulated/0/脚本/scrpit/constant/坐标.js");
toast("刷魔素脚本开始");
console.log("刷魔素脚本启动");
// 更稳健的屏幕截取，带重试和失败提示
function safeRequestScreenCapture(maxAttempts = 3) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            if (requestScreenCapture(true)) return true;
        } catch (e) {
            // Android 有时会抛错，等待后重试
        }
        sleep(800);
    }
    toast("屏幕截取失败，请授予权限或重启脚本");
    return false;
}

if (!safeRequestScreenCapture()) {
    throw new Error("无法获取屏幕截图权限");
}

function oneSelectSwitch() {
    try {
        sleep(1000)
        var step = [{ text: "单选", dx: 10, dy: -50 }]
        step.forEach(Steps => {
            sleep(500);
            U.clickText(Steps.text, Steps.dx, Steps.dy)

        });;
        if (U.ocrRegionCenter(P.单选[0], P.单选[1], P.REF_WIDTH, P.REF_HEIGHT).some(t => t && t.includes("单选"))) {
            sleep(1000)
            U.pressByPoint(P.单选, 100, P.REF_WIDTH, P.REF_HEIGHT)
        }
    } catch (e) {
        // ocr 可能失败，记录并返回 false
        log("oneSelectSwitch ocr error: " + e);
    }
    toast("未识别到单选");
    return false;
}

function sleepRandom(min, max) {
    sleep(min + Math.floor(Math.random() * (max - min + 1)));
}

function clickSteps(steps, delay = 900) {
    steps.forEach(pt => {
        try {
            sleep(delay);
            U.clickByPoint(pt, P.REF_WIDTH, P.REF_HEIGHT);
        } catch (e) {
            log("click step failed: " + e);
        }
    });
}

function tappt() {
    var dir = "/storage/emulated/0/脚本/scrpit/images/素材/";

    // 递归列出目录下所有图片文件（返回完整路径）
    function listImageFilesRecursive(baseDir) {
        var res = [];
        var list = files.listDir(baseDir) || [];
        for (var j = 0; j < list.length; j++) {
            var name = list[j];
            var path = baseDir + name;
            try {
                if (files.isDir(path)) {
                    // 确保子目录路径以 / 结尾
                    var subdir = path.endsWith('/') ? path : path + '/';
                    res = res.concat(listImageFilesRecursive(subdir));
                } else if (/\.(png|jpg|jpeg)$/i.test(name)) {
                    res.push(path);
                }
            } catch (e) {
                log('listImageFilesRecursive error: ' + e);
            }
        }
        return res;
    }

    var fileList = listImageFilesRecursive(dir);
    if (fileList.length === 0) {
        toast("素材目录为空: " + dir);
        return false;
    }

    // 遍历每个图片模板并尝试匹配点击
    var foundAny = false;
    for (var i = 0; i < fileList.length; i++) {
        var templatePath = fileList[i];
        var template = null;
        try {
            template = images.read(templatePath);
            if (!template) {
                log("读取模板失败: " + templatePath);
                continue;
            }

            for (let attempt = 1; attempt <= 3; attempt++) {
                let img = null;
                try {
                    img = captureScreen();
                    if (!img) throw new Error("captureScreen returned null");

                    let matchResult = images.matchTemplate(img, template, { threshold: 0.80, max: 100 });
                    console.log("tappt match result for " + templatePath + ":", matchResult && matchResult.matches ? matchResult.matches.length : 0);
                    if (matchResult && matchResult.matches && matchResult.matches.length) {
                        let matches = matchResult.matches
                            .sort((a, b) => b.similarity - a.similarity)
                            .slice(0, 20); // 取前20个匹配点
                        matches.forEach(match => {
                            var x = match.point.x;
                            var y = match.point.y;
                            console.log(`点击素材: (${x}, ${y}), 相似度: ${match.similarity}`);
                            U.pressByPoint([x, y], 30, P.REF_WIDTH, P.REF_HEIGHT);
                            sleepRandom(120, 200);
                        });
                        foundAny = true;
                        clickSteps([P.开始加工, P.确认, P.领取点数, P.领取点数之后]);
                        break; // 当前模板匹配成功，跳到下一个模板
                    }
                    toast(`未识别到 ${templatePath}，重试 ${attempt}/3`);
                } catch (e) {
                    log("tappt error: " + e);
                } finally {
                    try { img && img.recycle(); } catch (e) { }
                }
                sleep(500);
            }
        } catch (e) {
            log("tappt init error: " + e);
        } finally {
            try { template && template.recycle(); } catch (e) { }
        }
    }
    return foundAny;
}

function decompositionInterface(maxRetries = 2) {
    const mainPageTemplate = "/storage/emulated/0/脚本/scrpit/images/商店.png";
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (U.isMainPage(mainPageTemplate)) {
                var Steps = [
                    { text: "技能", dx: 0, dy: -50 },
                    { text: "使用特殊技能", dx: 0, dy: 0 },
                    { text: "大师", dx: 0, dy: 0 },
                    { text: "素材加工", dx: 0, dy: -50 }
                ];
                Steps.forEach(Steps => {
                    sleep(500);
                    U.clickText(Steps.text, Steps.dx, Steps.dy)

                });
                // var Steps1=[P.返回,P.选单,P.角色,P.技能,P.使用特殊技能,P.锻造大师,P.素材加工]
                // Steps1.clickSteps
                sleep(1000)
                var result = U.ocrRegionCenter(P.开始加工[0], P.开始加工[1], 300, 300, P.REF_WIDTH, P.REF_HEIGHT) || [];
                console.log("decompositionInterface OCR result:", result);
                if (result.some(t => t && t.includes("开始加工"))) {
                    toast("进入成功");
                    return true;
                }
            }
        } catch (e) {
            log("decompositionInterface error: " + e);
        }
        let closeText = U.ocrRegionCenter(P.关闭[0], P.关闭[1], 200, 100, P.REF_WIDTH, P.REF_HEIGHT) || [];
        if (closeText.some(t => t.includes("关闭") || t.includes("闭"))) {
            U.clickByPoint(P.关闭, P.REF_WIDTH, P.REF_HEIGHT);
            sleep(1200);
            continue;
        }

        let backText = U.ocrRegionCenter(P.返回[0], P.返回[1], 200, 100, P.REF_WIDTH, P.REF_HEIGHT) || [];
        if (backText.some(t => t.includes("返回") || t.includes("回"))) {
            U.clickByPoint(P.返回, P.REF_WIDTH, P.REF_HEIGHT);
            sleep(1200);
            continue;
        }
    }
    toast("进入分解界面失败");
    return false;
}

function runTaskWithTimeout(timeoutMs = 5 * 60 * 1000) {
    let start = Date.now();
    console.log("开始执行任务，超时时间(ms):", timeoutMs, "开始时间:", start.toString());
    while (Date.now() - start < timeoutMs) {
        U.pressByPoint(P.神速, 30, P.REF_WIDTH, P.REF_HEIGHT);
        for (let i = 0; i < 150; i++) {
            U.pressByPoint(P.攻击, 20, P.REF_WIDTH, P.REF_HEIGHT);
            sleep(100);
            if ((i + 1) % 20 === 0) {
                U.pressByPoint(P.旭日, 20, P.REF_WIDTH, P.REF_HEIGHT);
                sleep(120);
            }
        }
        console.log("任务执行中...");
        sleep(1000);
    }
    console.log("任务已运行超时，结束");
}

function swipePercent(x1p, y1p, x2p, y2p, duration) {
    let w = device.width;
    let h = device.height;
    let x1 = Math.floor(x1p * w);
    let y1 = Math.floor(y1p * h);
    let x2 = Math.floor(x2p * w);
    let y2 = Math.min(Math.floor(y2p * h), h - 1);
    swipe(x1, y1, x2, y2, duration);
}


function enterPhotoModeAndBack() {
    console.log("开启摄影模式");
    sleep(500);
    U.pressByPoint(P.摄影模式, 100, P.REF_WIDTH, P.REF_HEIGHT);
    sleep(1000);
    console.log("后退");
    swipePercent(0.175, 0.800, 0.175, 1, 3000);
}

function ensureMainPage(maxRetries = 2) {
    const mainPageTemplate = "/storage/emulated/0/脚本/scrpit/images/商店.png";
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (U.isMainPage(mainPageTemplate)) {
            return true;
        } else {
            console.log("尝试回退/关闭");

            let closeText = U.ocrRegionCenter(P.关闭[0], P.关闭[1], 200, 100, P.REF_WIDTH, P.REF_HEIGHT) || [];
            if (closeText.some(t => t.includes("关闭") || t.includes("闭"))) {
                U.clickByPoint(P.关闭, P.REF_WIDTH, P.REF_HEIGHT);
                sleep(1200);
                continue;
            }

            let backText = U.ocrRegionCenter(P.返回[0], P.返回[1], 200, 100, P.REF_WIDTH, P.REF_HEIGHT) || [];
            if (backText.some(t => t.includes("返回") || t.includes("回"))) {
                U.clickByPoint(P.返回, P.REF_WIDTH, P.REF_HEIGHT);
                sleep(1200);
                continue;
            }
        }
    }
    return U.isMainPage(mainPageTemplate);
}

function main() {
    const taskTimeout = 2 * 60 * 1000;
    while (true) {
        if (!ensureMainPage()) {
            toast("无法定位主界面，重试");
            sleep(1200);
            continue;
        }

        enterPhotoModeAndBack();
        sleep(500); // 等待界面稳定
        runTaskWithTimeout(taskTimeout);
        sleep(1500); // 等待界面稳定

        if (!ensureMainPage()) {
            toast("未返回主界面，重试整个流程");
            continue;
        }

        if (!decompositionInterface()) {
            continue;
        }

        sleep(800);
        oneSelectSwitch();
        sleep(800);

        while (true) {
            try {
                if (!tappt()) {
                    break; // 如果未识别到魔导设备，退出循环
                }
                sleepRandom(600, 1000);
            } catch (e) {
                log("main loop error: " + e);
                sleep(1500);
            }
        }
    }
}

// main();
// enterPhotoModeAndBack();
tappt();