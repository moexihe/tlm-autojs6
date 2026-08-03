/**
 * 检查并重新申请截图权限
 * @param {Error} e - 捕获到的异常对象
 * @returns {boolean} 是否已重新申请
 */
function ensureScreenCapture(e) {
    if (e && e.message) {
        let msg = String(e.message);
        // 扩大异常捕获范围，包含安卓高版本特征报错
        if (msg.indexOf("captureScreen failed") !== -1 || 
            msg.indexOf("VirtualDisplay") !== -1 || 
            msg.indexOf("SecurityException") !== -1) {
            
            console.log("检测到截图 Token 失效，尝试重新唤醒...");
            toastLog("重新初始化截图服务...");
            
            // 因为你有 Root 媒体授权，这里不会弹窗，而是会静默重新刷新底层 Token
            sleep(500); // 给系统一点缓冲时间释放旧资源
            let result = requestScreenCapture();
            sleep(1000); // 等待 VirtualDisplay 建立
            return result;
        }
    }
    return false;
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
    try {
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
        return results;
    } catch (e) {
        ensureScreenCapture(e);
        console.log(e)
        return [];
    }
}


function ocrRegionCenter(x, y, w, h, refWidth, refHeight) {
    try {
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
        return results;

    } catch (e) {
        ensureScreenCapture(e);
        console.log("ocrRegionCenter error: " + e);
        return [];
    }
}

function ocrFullScreen() {
    try {
        let screenWidth = device.width;
        let screenHeight = device.height;
        let results = ocr([0, 0, screenWidth, screenHeight]);
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
        console.error(e);
        return [];
    } finally {
        try { template && template.recycle(); } catch (e) { }
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

function findimg(templatePath, threshold = 0.7) {;
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
            console.log(e)
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
function clickText(text, offsetX = 0, offsetY = 0, region = null) {
    let rawImg = null;
    let grayImg = null;
    try {
        rawImg = captureScreen();
        if (!rawImg) {
            throw new Error("captureScreen failed");
        }

        grayImg = images.grayscale(rawImg);

        let thresholds = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230];
        let target = null;

        function detectInImg(img) {
            let results = ocr.detect(img);
            return results.find(item => item.text && item.text.includes(text));
        }

        function getRegionBounds() {
            if (!region || !Array.isArray(region) || region.length !== 4) {
                return null;
            }
            let [x, y, w, h] = region;
            return { x, y, w, h };
        }

        let bounds = getRegionBounds();
        let imgToUse = grayImg;

        if (bounds) {
            let { x, y, w, h } = bounds;
            let cropImg = images.clip(rawImg, x, y, w, h);
            try {
                let cropGrayImg = images.grayscale(cropImg);
                try {
                    for (let t of thresholds) {
                        let binImg = images.threshold(cropGrayImg, t, 255, "BINARY");
                        try {
                            let found = detectInImg(binImg);
                            if (found && found.bounds) {
                                target = found;
                                target.bounds = {
                                    centerX: () => x + found.bounds.centerX(),
                                    centerY: () => y + found.bounds.centerY()
                                };
                                break;
                            }
                        } finally {
                            try { binImg.recycle(); } catch (e) {}
                        }
                    }
                } finally {
                    try { cropGrayImg.recycle(); } catch (e) {}
                }
            } finally {
                try { cropImg.recycle(); } catch (e) {}
            }
        } else {
            for (let t of thresholds) {
                let binImg = images.threshold(grayImg, t, 255, "BINARY");
                try {
                    let found = detectInImg(binImg);
                    if (found && found.bounds) {
                        target = found;
                        break;
                    }
                } finally {
                    try { binImg.recycle(); } catch (e) {}
                }
            }
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
        console.log("clickTextError:", e);
    } finally {
        try { if (grayImg) grayImg.recycle(); } catch (e) {}
        try { if (rawImg) rawImg.recycle(); } catch (e) {}
    }
}

function clickTextfull(text, offsetX = 0, offsetY = 0) {
    let rawImg = null;
    let target = null;
    try {
        rawImg = captureScreen();
        if (!rawImg) {
            throw new Error("captureScreen failed");
        }

        function findTarget(img) {
            let results = ocr.detect(img);
            if (results && results.length > 0) {
                return results.find(item => item.text && item.text.includes(text));
            }
            return null;
        }

        let candidates = [rawImg];

        try {
            let grayImg = images.grayscale(rawImg);
            candidates.push(grayImg);
        } catch (e) {
            console.log("灰度处理失败:", e);
        }

        try {
            let invertImg = images.invert(rawImg);
            candidates.push(invertImg);
        } catch (e) {
            console.log("反色处理失败:", e);
        }

        for (let img of candidates) {
            target = findTarget(img);
            if (target && target.bounds) {
                break;
            }
        }

        if (!target) {
            try {
                let grayImg = images.grayscale(rawImg);
                let thresholds = [100, 120, 140, 160, 180, 200, 220];
                for (let t of thresholds) {
                    let binImg = images.threshold(grayImg, t, 255, "BINARY");
                    try {
                        target = findTarget(binImg);
                        if (target && target.bounds) {
                            break;
                        }
                    } finally {
                        try { binImg.recycle(); } catch (e) {}
                    }
                }
                try { grayImg.recycle(); } catch (e) {}
            } catch (e) {
                console.log("二值化 OCR 失败:", e);
            }
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
        console.log("clickTextRawError:", e);
    } finally {
        try {
            if (rawImg) {
                rawImg.recycle();
            }
        } catch (e) {
            // ignore recycle error
        }
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
    ensureScreenCapture,
    clickTextfull,
};

