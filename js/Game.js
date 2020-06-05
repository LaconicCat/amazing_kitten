(function(){
    var Game = window.Game = function(params){
        //得到画布
        this.canvas = document.querySelector(params.canvasid);
        this.ctx = this.canvas.getContext('2d');
        var getPixelRatio = function(context) {
            var backingStore = context.backingStorePixelRatio ||
                context.webkitBackingStorePixelRatio ||
                context.mozBackingStorePixelRatio ||
                context.msBackingStorePixelRatio ||
                context.oBackingStorePixelRatio ||
                context.backingStorePixelRatio || 1;
            return (window.devicePixelRatio || 1) / backingStore;
        };
        this.ratio = getPixelRatio(this.ctx);
        //资源文件地址
        this.Rjsonurl = params.Rjsonurl;
        //设置宽高,和屏幕一样宽高
        this.init();
        //帧编号
        this.fno = 0;
        //读取资源，异步语句，需要回调函数
        var self = this;
        //读取资源是一个异步函数，所以我们不知道什么时候执行完毕，但是所有其他的事情必须等到他完毕之后才执行，所以要等callback。
        this.loadAllResource(function(){
            //我们封装的回调函数，这里表示全部资源加载完毕
            self.start();
        });
        //事件预约队列
        this.appointments = [];
    }
    //初始化，设置画布的宽高
    Game.prototype.init = function(){
        //读取视口的宽高
        let width = document.documentElement.clientWidth;
        let height = document.documentElement.clientHeight;
        if(width > 411) width = 411;
        if(height > 823) height = 823;
        let ratio = this.ratio;
        this.canvas.style.width = width + "px";
        this.canvas.style.height = height + "px";
        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
    }
    
    //读取资源
    Game.prototype.loadAllResource = function(callback){
        //准备一个R对象
        this.R = {};
        var self = this; //备份
        //计数器
        var alreadyLoadNum = 0;
        //发出请求，请求json文件
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4){
                var Robj = JSON.parse(xhr.responseText);
                for(let i = 0; i < Robj.images.length; i++){
                    //创建一个同名的key
                    self.R[Robj.images[i].name] = new Image();
                    //请求
                    self.R[Robj.images[i].name].src = Robj.images[i].url;
                    //监听
                    self.R[Robj.images[i].name].onload = function(){
                        alreadyLoadNum++;
                        //提示文字
                        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
                        var text = "正在加载" + alreadyLoadNum + '/' + Robj.images.length +',请稍后';
                        //设置居中位置
                        self.ctx.textAlign = "center";
                        self.ctx.font = 18*game.ratio + "px 微软雅黑"
                        self.ctx.fillText(text, self.canvas.width/2, self.canvas.height*  (1 - 0.618));
                        //判断是否加载完毕
                        if(alreadyLoadNum === Robj.images.length){
                            callback();
                        }
                    }
                };
            }
        }
        xhr.open('get', this.Rjsonurl, true);
        xhr.send(null);
    }
    
    //开始游戏
    Game.prototype.start = function(){
        var self = this;
        //实例化地图、渲染地图
        self.map = new Map();
        //设置定时器
        this.timer = setInterval(function(){
            //清屏
            self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
            //画背景，不运动
            self.ctx.drawImage(self.R["bg1"], 0, 0, game.canvas.width, game.canvas.height);
            //帧编号
            self.fno ++;
            self.ctx.font = 16 * game.ratio + "px consolas";
            self.ctx.textAlign = "left";
            self.ctx.fillText("FNO:" + self.fno, 10*game.ratio, 20*game.ratio);
            //这个render里边包含精灵的update和render
            self.map.render();

            //执行事件注册器中的事件
            self.appointments.forEach(item=>{
                if(item.frame === self.fno){
                    item.fn();
                }
            });

            //下面的语句都是测试用的
            //codetable中打印arr
            for(var i = 0; i < 7; i++){
                for(var j = 0; j < 7; j++){
                    document.getElementById("codeTable").getElementsByTagName("tr")[i].getElementsByTagName("td")[j].innerHTML = self.map.code[i][j];
                    document.getElementById("needToDropNumberTable").getElementsByTagName("tr")[i].getElementsByTagName("td")[j].innerHTML = self.map.needToBeDropDown[i][j] !== undefined ? self.map.needToBeDropDown[i][j] : "";
                }
            }
        },20);
    }
})();