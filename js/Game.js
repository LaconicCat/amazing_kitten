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
            //绑定监听
            self.bindEvent();
        });
        //事件预约队列
        this.appointments = [];
        this.callbacks = {};
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
        this.baseX = 6 * this.ratio;
        this.spriteW = (this.canvas.width - this.baseX*2)/7;
        this.paddingBottom = this.canvas.height/2 - this.spriteW * 3.5;
        this.baseY = this.canvas.height - this.spriteW * 7 - this.paddingBottom;
    }
    
    //读取资源
    Game.prototype.loadAllResource = function(callback){
        //准备一个R对象
        this.R = {};
        this.Sound = {};
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
                for(let i = 0; i < Robj.sound.length; i++){
                    self.Sound[Robj.sound[i].name] = document.createElement("audio");
                    self.Sound[Robj.sound[i].name].src = Robj.sound[i].url;
                }
            }
        }
        xhr.open('get', this.Rjsonurl, true);
        xhr.send(null);
    }
    
    //开始游戏
    Game.prototype.start = function(){
        var self = this;
        //状态机
        this.fsm = "Check"; //A静稳状态 B检查消除 C消除下落
        //实例化地图、渲染地图
        self.map = new Map();
        
        this.Sound["background"].play();
        this.Sound["background"].loop = "loop";
        //设置定时器
        this.timer = setInterval(function(){
            //清屏
            self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
            //画背景，不运动
            self.ctx.drawImage(self.R["bg1"], 0, 0, game.canvas.width, game.canvas.height);
            self.ctx.drawImage(self.R["bottom"], 0, game.canvas.height - game.canvas.width/2, game.canvas.width, game.canvas.width/2);
            self.ctx.drawImage(self.R["top"], game.canvas.width * 0.75, game.baseY - game.canvas.width * 0.25, game.canvas.width * 0.2, game.canvas.width * 0.2);
            //帧编号
            self.fno ++;
            self.ctx.font = 16 * game.ratio + "px consolas";
            self.ctx.textAlign = "left";
            self.ctx.fillText("FNO:" + self.fno, 10*game.ratio, 20*game.ratio);
            self.ctx.fillText("FSM:" + self.fsm, 10*game.ratio, 40*game.ratio);
            //这个render里边包含精灵的update和render
            self.map.render();

            //执行事件注册器中的事件
            if(self.callbacks.hasOwnProperty(self.fno)){
                self.callbacks[self.fno]();
                //这件事做完之后，删除这个事件
                delete self.callbacks[self.fno];
            }

            //根据有限状态机，来决定作什么 A静稳状态 B检查消除 C消除下落
            switch(self.fsm){
                case "Frozen":
                    // self.registCallback(20, function(){
                    //     self.fsm = "Check";
                    // });
                    break;
                case "Check":
                    if(self.map.check().length !== 0){
                        self.fsm = "Burning";
                    } else {
                        self.fsm = "Frozen";
                    }
                    break;
                case "Burning":
                    self.fsm = "DropDown";
                    self.map.eliminate(function(){
                        self.map.dropDown(20, function(){
                            self.map.newSprites(40, function(){
                                self.fsm = "Check";
                            });
                        });
                    });
                    break;
            }

            // 下面的语句都是测试用的
            // codetable中打印arr
            // for(var i = 0; i < 7; i++){
            //     for(var j = 0; j < 7; j++){
            //         document.getElementById("codeTable").getElementsByTagName("tr")[i].getElementsByTagName("td")[j].innerHTML = self.map.code[i][j];
            //         document.getElementById("needToDropNumberTable").getElementsByTagName("tr")[i].getElementsByTagName("td")[j].innerHTML = self.map.needToBeDropDown[i][j] !== undefined ? self.map.needToBeDropDown[i][j] : "";
            //     }
            // }
        },20);
    }

    Game.prototype.registCallback = function(howManyFramesLater, fn){
        this.callbacks[this.fno + howManyFramesLater] = fn;
    }

    Game.prototype.bindEvent = function(){
        var self = this;

        this.canvas.addEventListener("touchstart", function(event){
            //如果不在Frozen状态，那么点击是无效的。
            if(self.fsm != "Frozen") return;
            //判断当前鼠标在那个元素上
            var x = event.touches[0].clientX * self.ratio;
            var y = event.touches[0].clientY * self.ratio;
            console.log(x,y);
            self.squareW = self.spriteW * 7;
            if(x > self.baseX && x < self.baseX + self.squareW && y > self.baseY && y < self.baseY + self.squareW){
                self.startCol = Math.floor((x  - self.baseX) / self.spriteW );
                self.startRow = Math.floor((y - self.baseY) / self.spriteW );
                self.map.sprites[self.startRow][self.startCol].isClicked = true;
                self.canvas.addEventListener("touchend", function(){
                    self.map.sprites[self.startRow][self.startCol].isClicked = false;
                },true);
            }
        }, true);

        if(self.fsm !== "DropDown" && self.fsm !== "Burning"){
            self.canvas.addEventListener("touchmove", function(event){
               toucheMoveHandler(event);
           },true);
        }
        
        self.canvas.removeEventListener("touchmove", toucheMoveHandler, true);

        function toucheMoveHandler(event){
            if(self.fsm != "Frozen") return;
            var startCol = self.startCol;
            var startRow = self.startRow;
            var squareW = self.squareW;
            var x = event.touches[0].clientX * self.ratio;
            var y = event.touches[0].clientY * self.ratio;
            if(x > self.baseX && x < self.baseX + squareW && y > self.baseY && y < self.baseY + squareW){
                var targetCol = Math.floor((x  - self.baseX) / self.spriteW );
                var targetRow = Math.floor((y - self.baseY) / self.spriteW );
                //等待鼠标移动到旁边
                if(
                    startCol == targetCol && Math.abs(startRow - targetRow) == 1
                    || startRow == targetRow && Math.abs(startCol - targetCol) == 1
                ){
                    self.map.exchange(startRow, startCol, targetRow, targetCol);
                    self.canvas.removeEventListener("touchmove", toucheMoveHandler, true);
                }
            }
        }
        
        this.canvas.onmousedown = function(event){
            //如果不在Frozen状态，那么点击是无效的。
            if(self.fsm != "Frozen") return;
            //判断当前鼠标在那个元素上
            var x = event.offsetX * self.ratio;
            var y = event.offsetY * self.ratio;
            var squareW = self.spriteW * 7;
            if(x > self.baseX && x < self.baseX + squareW && y > self.baseY && y < self.baseY + squareW){
                var startCol = Math.floor((x  - self.baseX) / self.spriteW );
                var startRow = Math.floor((y - self.baseY) / self.spriteW );
                self.map.sprites[startRow][startCol].isClicked = true;
                self.canvas.onmouseup = function(){
                    self.map.sprites[startRow][startCol].isClicked = false;
                }
            }
            self.canvas.onmousemove = function(event){
                var x = event.offsetX * self.ratio;
                var y = event.offsetY * self.ratio;
                if(x > self.baseX && x < self.baseX + squareW && y > self.baseY && y < self.baseY + squareW){
                    var targetCol = Math.floor((x  - self.baseX) / self.spriteW );
                    var targetRow = Math.floor((y - self.baseY) / self.spriteW );
                    //等待鼠标移动到旁边
                    if(
                        startCol == targetCol && Math.abs(startRow - targetRow) == 1
                        || startRow == targetRow && Math.abs(startCol - targetCol) == 1
                    ){
                        self.map.exchange(startRow, startCol, targetRow, targetCol);
                        self.canvas.onmousemove = null;
                    }
                }
            }
        }
        this.canvas.onmouseup = function(event){
            self.canvas.onmousemove = null;
        }
    }
})();