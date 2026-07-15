//setScreenMetrics(1080, 2400);
auto();
const Utils = require("/storage/emulated/0/脚本/scrpit/utils/utils.js");
const Point = require("/storage/emulated/0/脚本/scrpit/constant/坐标.js");
task();

function task() {
    while (true) {
        Utils.pressByPoint(Point.神速, Point.REF_WIDTH, Point.REF_HEIGHT);
        for (var i = 0; i < 80; i++) {
            Utils.pressByPoint(Point.攻击, Point.REF_WIDTH, Point.REF_HEIGHT);
            sleep(100);

            // 每 20 次攻击点一次其他位置 
            if ((i + 1) % 13 === 0) {
                    Utils.pressByPoint(Point.广域散射, Point.REF_WIDTH, Point.REF_HEIGHT);
                    sleep(20);
                    Utils.pressByPoint(Point.广域散射, Point.REF_WIDTH, Point.REF_HEIGHT);
                    sleep(100);
                }
            }
        }
    }


