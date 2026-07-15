const autojsUtils = require('./modules/autojs-utils');

var path = 'scrpits/双风暴挂机-旭日.js';
var path2 = 'scrpits/双风暴挂机-广域散射.js';
var path3 = 'scrpits/刷魔素.js';
if (!files.exists(path)) {
    toast('脚本文件不存在: ' + path);
    exit();
}
if (!files.exists(path2)) {
    toast('脚本文件不存在: ' + path2);
    exit();
}
if (!files.exists(path3)) {
    toast('脚本文件不存在: ' + path3);
    exit();
}
var window = floaty.window(
    <horizontal>
        <button id="storm" text="双风暴挂机-旭日" w="50" h="40" bg="#09ff00" textColor="#ffffff" textSize="10sp"/>
        <button id="guangyusanse" text="双风暴挂机-广域散射" w="50" h="40" bg="#0091ff" textColor="#ffffff" textSize="10sp"/>
        <button id="mosu" text="刷魔素" w="50" h="40" bg="#00aaee" textColor="#ffffff" textSize="10sp"/>
    </horizontal>
);

setInterval(() => {
}, 1000);

var execution = null;

// 公共拖动绑定函数
function bindDrag(button, clickHandler) {
    button.setOnTouchListener(function(view, event) {
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                x = event.getRawX();
                y = event.getRawY();
                windowX = window.getX();
                windowY = window.getY();
                downTime = new Date().getTime();
                return true;
            case event.ACTION_MOVE:
                // 移动悬浮窗
                window.setPosition(windowX + (event.getRawX() - x),
                                   windowY + (event.getRawY() - y));
                // 长按退出
                if (new Date().getTime() - downTime > 1500) {
                    exit();
                }
                return true;
            case event.ACTION_UP:
                // 判断是否是点击
                if (Math.abs(event.getRawY() - y) < 5 && Math.abs(event.getRawX() - x) < 5) {
                    clickHandler();
                }
                return true;
        }
        return true;
    });
}

// 给 storm 按钮绑定拖动和点击
bindDrag(window.storm, onClick);

// 给 mosu 按钮绑定拖动和点击
bindDrag(window.mosu, mosu);

bindDrag(window.guangyusanse, guangyusanse);


// 切换脚本运行状态
function toggleScript(button, scriptPath, startText, stopText) {
    if (button.getText() === startText) {
        execution = engines.execScriptFile(scriptPath);
        button.setText(stopText);
    } else {
        if (execution) {
            execution.getEngine().forceStop();
        }
        button.setText(startText);
    }
}

// 监听按钮点击事件
window.storm.click(() => {
    onClick();
});
window.mosu.click(() => {
    mosu();
});
window.guangyusanse.click(() => {
    guangyusanse();
});


// 双风暴挂机脚本
function onClick() {
    toggleScript(window.storm, path, '双风暴挂机-旭日', '停止运行');
}
// 广域散射脚本
function guangyusanse() {
    toggleScript(window.guangyusanse, path2, '双风暴挂机-广域散射', '停止运行');
}
// 刷魔素脚本
function mosu() {
    toggleScript(window.mosu, path3, '刷魔素', '停止运行');
}


autojsUtils.test();