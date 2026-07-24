/**
 * 检查并在必要时重新申请截图权限
 * @param {Error} e
 * @returns {{tried: boolean, ok: boolean}} tried 表示是否尝试过申请，ok 表示申请是否成功
 */
function ensureScreenCapture(e) {
    let now = Date.now();
    let msg = e ? (e.message || e.toString()) : "";
    msg = String(msg).toLowerCase();

    const keywords = [
        "capturescreen failed",
        "virtualdisplay",
        "securityexception",
        "cannot create virtualdisplay",
        "capture failed"
    ];

    const isScreenError = keywords.some(k => msg.includes(k));
    if (!isScreenError) return { tried: false, ok: false };

    // 限频：30 秒内只尝试一次
    if (now - lastScreenRequestAt < SCREEN_REQUEST_COOLDOWN_MS) {
        toastLog("短时间内已尝试重新申请截图权限，跳过重复申请");
        return { tried: false, ok: false };
    }

    lastScreenRequestAt = now;
    toastLog("截图权限丢失，尝试重新申请...");
    try {
        // 注意：在某些设备上需要在主线程或有 UI 权限的上下文调用
        let ok = requestScreenCapture();
        if (!ok) {
            toastLog("重新申请截图权限失败");
            return { tried: true, ok: false };
        }
        toastLog("重新申请截图权限成功");
        return { tried: true, ok: true };
    } catch (ex) {
        // 捕获 requestScreenCapture 本身可能抛出的异常
        console.error("requestScreenCapture 抛出异常:", ex);
        return { tried: true, ok: false };
    }
}



// 按比例换算坐标
function scalePoint(point, refWidth, refHeight) {
    var w = device.width;
    var h = device.height;
    var x = Math.floor(point[0] * w / refWidth);
    var y = Math.floor(point[1] * h / refHeight);
    return [x, y];
}

// 点击函数
function clickByPoint(point, refWidth, refHeight) {
    var scaled = scalePoint(point, refWidth, refHeight);
    click(scaled[0], scaled[1]);
}

// 短按函数
function pressByPoint(point, duration, refWidth, refHeight) {
    var scaled = scalePoint(point, refWidth, refHeight);
    press(scaled[0], scaled[1], duration || 10);
}

/**
 * 将像素坐标 xywh 转换为百分比区域
 * @param {number} x - 左上角 X 坐标 (像素)
 * @param {number} y - 左上角 Y 坐标 (像素)
 * @param {number} w - 区域宽度 (像素)
 * @param {number} h - 区域高度 (像素)
 * @param {number} refWidth - 参考屏幕宽度
 * @param {number} refHeight - 参考屏幕高度
 * @returns {Array<number>} - [xPercent, yPercent, wPercent, hPercent]
 */
function toPercentRegion(x, y, w, h, refWidth, refHeight) {
    let xPercent = x / refWidth;
    let yPercent = y / refHeight;
    let wPercent = w / refWidth;
    let hPercent = h / refHeight;
    return [xPercent, yPercent, wPercent, hPercent];
}

/**
 * OCR识别指定区域（自动适配多分辨率）
 * @param {number} x - 左上角 X 坐标 (像素，参考屏幕)
 * @param {number} y - 左上角 Y 坐标 (像素，参考屏幕)
 * @param {number} w - 区域宽度 (像素，参考屏幕)
 * @param {number} h - 区域高度 (像素，参考屏幕)
 * @param {number} refWidth - 参考屏幕宽度
 * @param {number} refHeight - 参考屏幕高度
 * @returns {Array} OCR识别结果
 */
function ocrRegionPercent(x, y, w, h, refWidth, refHeight) {
    let img = null;
    try {
        /* 截屏并获取包装图像对象. */
        img = captureScreen();
        // 转换成百分比区域
        let [xPercent, yPercent, wPercent, hPercent] = toPercentRegion(x, y, w, h, refWidth, refHeight);

        // 获取当前设备分辨率
        let screenWidth = device.width;
        let screenHeight = device.height;

        // 转换成实际区域
        let left = Math.round(xPercent * screenWidth);
        let top = Math.round(yPercent * screenHeight);
        let right = Math.round(left + wPercent * screenWidth);
        let bottom = Math.round(top + hPercent * screenHeight);

        let x0 = Math.max(0, left);
        let y0 = Math.max(0, top);
        let x1 = Math.min(screenWidth, right);
        let y1 = Math.min(screenHeight, bottom);
        let width = x1 - x0;
        let height = y1 - y0;

        if (width <= 0 || height <= 0) {
            return [];
        }

        // 截屏并识别，ocr 需要 x,y,width,height
        //console.log(`ocrRegionCenter: x0=${x0}, y0=${y0}, width=${width}, height=${height}`);
        let results = ocr(img, [x0, y0, width, height]);;
        img.recycle();
        return results;
    } catch (e) {
        console.log(e)
        return [];
    }
}


function ocrRegionCenter(x, y, w, h, refWidth, refHeight) {
    let img = null;
    try {
        /* 截屏并获取包装图像对象 */
        img = captureScreen();
        if (!img) return [];

        // 转换成百分比
        let xPercent = x / refWidth;
        let yPercent = y / refHeight;
        let wPercent = w / refWidth;
        let hPercent = h / refHeight;

        // 当前设备分辨率
        let screenWidth = device.width;
        let screenHeight = device.height;

        // 计算矩形区域（以中心点为基准）
        let centerX = Math.round(xPercent * screenWidth);
        let centerY = Math.round(yPercent * screenHeight);
        let halfW = Math.round(wPercent * screenWidth / 2);
        let halfH = Math.round(hPercent * screenHeight / 2);

        let left = centerX - halfW;
        let top = centerY - halfH;
        let right = centerX + halfW;
        let bottom = centerY + halfH;

        let x0 = Math.max(0, left);
        let y0 = Math.max(0, top);
        let x1 = Math.min(screenWidth, right);
        let y1 = Math.min(screenHeight, bottom);
        let width = x1 - x0;
        let height = y1 - y0;

        if (width <= 0 || height <= 0) {
            return [];
        }
        console.log(`ocrRegionCenter: x0=${x0}, y0=${y0}, width=${width}, height=${height}`);

        // 修正 1：把刚才截取的 img 明确传进去
        let results = ocr(img, [x0, y0, width, height]);
        img.recycle();
        return results;

    } catch (e) {
        console.log("ocrRegionCenter error: " + e);
        return [];
    }
}

function ocrFullScreen() {
    let img = null;
    try {
        /* 截屏并获取包装图像对象. */
        img = captureScreen();
        if (!img) throw new Error("captureScreen failed");
        let screenWidth = device.width;
        let screenHeight = device.height;
        let results = ocr([0, 0, screenWidth, screenHeight]);
        img.recycle();
        return results;
    } catch (e) {
        console.log("ocrFullScreen error: " + e);
        ensureScreenCapture(e);
        return [];
    }
}

/**
 * 检查是否在主页面
 * @param {string} templatePath - 主页面特征图片路径
 * @param {number} threshold - 相似度阈值 (默认 0.8)
 * @returns {boolean} true 表示在主页面
 */
function isMainPage(templatePath, threshold = 0.8) {
    let img = null;
    let template = null;
    try {
        img = captureScreen();
        if (!img) throw new Error("captureScreen returned null");

        template = images.read(templatePath);
        if (!template) throw new Error("template read failed");

        let matchResult = images.matchTemplate(img, template, { threshold: threshold, max: 1 });
        console.log("isMainPage match result:", matchResult.matches);
        img.recycle();
        return matchResult && matchResult.matches && matchResult.matches.length > 0;
    } catch (e) {
        return [];
    } finally {
        try { template && template.recycle(); } catch (e) { }
        try { img && img.recycle(); } catch (e) { }
    }
}

/**
 * 根据坐标点进行滑动
 * @param {Array} startPoint - 滑动的起始坐标 [x, y]
 * @param {Array} endPoint - 滑动的结束坐标 [x, y]
 * @param {number} refWidth - 参考宽度
 * @param {number} refHeight - 参考高度
 * @param {number} duration - 滑动持续时间
 */
function swipeByPoints(startPoint, endPoint, refWidth, refHeight, duration) {
    var s = scalePoint(startPoint, refWidth, refHeight);
    var e = scalePoint(endPoint, refWidth, refHeight);
    swipe(s[0], s[1], e[0], e[1], duration || 500);
}

function findimg(templatePath, threshold = 0.7) {
    let img = null;
    let template = null;
    try {
        img = captureScreen();
        if (!img) throw new Error("captureScreen returned null");

        template = images.read(templatePath);
        if (!template) throw new Error("template read failed");

        let matchResult = images.matchTemplate(img, template, { threshold: threshold, max: 1 });
        console.log("findimg match result:", matchResult.matches);
        return matchResult && matchResult.matches && matchResult.matches.length > 0;
    } catch (e) {
        return [];
    } finally {
        try { template && template.recycle(); } catch (e) { }
        try { img && img.recycle(); } catch (e) { }
    }
}

function getPointColor(point, refWidth, refHeight) {
    try {
        if (!requestScreenCapture()) {
            throw new Error("requestScreenCapture failed");
        }
        let [x, y] = scalePoint(point, refWidth, refHeight);
        let img = captureScreen();
        if (!img) {
            throw new Error("captureScreen failed");
        }
        let color = images.pixel(img, x, y);
        img.recycle();
        return color;
    } catch (e) {
        if (e.message.indexOf("captureScreen failed") !== -1) {
            toastLog("截图权限丢失，尝试重新申请...");
            // 重新申请权限
            requestScreenCapture();
        } else {
            console.error(e);
            return [];
        }
    }
}


function isPointColor(point, targetColor, tolerance = 20, refWidth, refHeight) {
    let actualColor = getPointColor(point, refWidth, refHeight);
    return colors.isSimilar(actualColor, targetColor, tolerance);
}

/**
 * OCR 识别指定文本并点击其中心（带坐标托底） //[cite: 2]
 * @param {string} text - 目标文本（如 "锻造"）
 */
function clickText(text, offsetX = 0, offsetY = 0) {
    let rawImg, grayImg;
    try {
        rawImg = captureScreen();
        grayImg = images.grayscale(rawImg);

        // 多个阈值候选
        let thresholds = [120, 150, 180, 200];
        let target = null;

        for (let t of thresholds) {
            let binImg = images.threshold(grayImg, t, 255, "BINARY");
            let results = ocr.detect(binImg);

            let found = results.find(item => item.text.includes(text));
            if (found && found.bounds) {
                target = found;
                binImg.recycle();
                break; // 找到就停止
            }
            binImg.recycle();
        }

        if (target && target.bounds) {
            let x = target.bounds.centerX() + offsetX;
            let y = target.bounds.centerY() + offsetY;
            if (typeof x === "number" && typeof y === "number") {
                click(x, y);
                console.log(`成功点击 "${text}"，坐标: (${x}, ${y})`);
            } else {
                console.log(`坐标无效: ${text}`);
            }
        } else {
            console.log(`未找到文字: ${text}`);
        }

    } catch (e) {
        console.log("clickTextError:", e)
    }
}
module.exports = {
    scalePoint,
    clickByPoint,
    swipeByPoints,
    pressByPoint,
    ocrRegionPercent,
    ocrRegionCenter,
    ocrFullScreen,
    isMainPage,
    swipeByPoints,
    findimg,
    getPointColor,
    isPointColor,
    clickText,
    ensureScreenCapture
};

