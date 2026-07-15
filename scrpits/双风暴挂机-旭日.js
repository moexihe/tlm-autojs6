//setScreenMetrics(1080, 2400);
auto();
const Utils = require("/storage/emulated/0/脚本/scrpit/utils/utils.js");
const Point = require("/storage/emulated/0/脚本/scrpit/constant/坐标.js");
task();

function task() {
    while (true) {
        Utils.pressByPoint(Point.神速, Point.REF_WIDTH, Point.REF_HEIGHT);

        for (var i = 0; i < 100; i++) {
            Utils.pressByPoint(Point.攻击, Point.REF_WIDTH, Point.REF_HEIGHT);
            sleep(200);

            // 每 13 次攻击点一次其他位置 //技能释放次数是j/4
            if ((i + 1) % 12 === 0) {
                [Point.旭日, Point.旭日, Point.旭日].forEach(p => {
                    Utils.pressByPoint(p, Point.REF_WIDTH, Point.REF_HEIGHT);
                    sleep(50);
                });
            }
        }
    }
}

