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
    try {
        /* 截屏并获取包装图像对象. */
        let img = captureScreen();
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
        let results = ocr([x0, y0, width, height]);
        img.recycle();
        return results;
    } catch (e) {
        console.log("ocrRegionPercent error: " + e);
        if (e.message.indexOf("non-current MediaProjection") !== -1) {
            toastLog("截图权限丢失，尝试重新申请...");
            // 重新申请权限
            requestScreenCapture();
        } else {
            console.error(e);
        }
        return [];
    }
}

function ocrRegionCenter(x, y, w, h, refWidth, refHeight) {
    try {
        /* 截屏并获取包装图像对象. */
        let img = captureScreen();
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
        let results = ocr([x0, y0, width, height]);
        img.recycle();
        return results;
    } catch (e) {
        console.log("ocrRegionCenter error: " + e);
        if (e.message.indexOf("non-current MediaProjection") !== -1) {
            toastLog("截图权限丢失，尝试重新申请...");
            // 重新申请权限
            requestScreenCapture();
        } else {
            console.error(e);
        }
        return [];
    }

}

function ocrFullScreen() {

    /* 截屏并获取包装图像对象. */
    let img = captureScreen();
    let screenWidth = device.width;
    let screenHeight = device.height;
    img.recycle();
    return ocr([0, 0, screenWidth, screenHeight]);
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
        return matchResult && matchResult.matches && matchResult.matches.length > 0;
    } catch (e) {
        console.log("isMainPage error: " + e);
        if (e.message.indexOf("non-current MediaProjection") !== -1) {
            toastLog("截图权限丢失，尝试重新申请...");
            // 重新申请权限
            requestScreenCapture();
        } else {
            console.error(e);
        }
        return false;
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
        console.log("findimg error: " + e);
        if (e.message.indexOf("non-current MediaProjection") !== -1) {
            toastLog("截图权限丢失，尝试重新申请...");
            // 重新申请权限
            requestScreenCapture();
        } else {
            console.error(e);
        }
        return false;
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
};

