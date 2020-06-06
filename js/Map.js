(function(){
    //地图类
    var Map = window.Map = function(row, col, type){
        //存储一个数字标志(精灵类型)的地图，并不是真的精灵。
        this.code = [
            [1,1,2,3,4,3,6],
            [1,2,3,3,3,3,3],
            [1,2,4,5,6,3,1],
            [3,2,5,6,0,3,2],
            [4,2,6,0,1,2,3],
            [5,6,0,0,0,3,4],
            [6,0,1,0,3,4,5]
        ];
        //这个矩阵也是7*7，存放真正精灵的
        this.sprites = [[],[],[],[],[],[],[]];
        //临时小精灵数组，用来渲染下落
        this.temparr = [];
        //应该下落多少行
        this.needToBeDropDown = [[],[],[],[],[],[],[]];
        //实例化地图的时候，随机选7个参演选手
        var sArr = ["i0","i1","i2","i3","i4","i5","i6","i7","i8","i9","i10","i11","i12"];
        //随机七个样本
        this.imageNameArr = _.sample(sArr,7);
        let regex = /i/g;
        this.image1NameArr = this.imageNameArr
            .map((a)=>(a.replace(regex, 'a')));
        this.createSpritesByCode();
    }
    Map.prototype.createSpritesByCode = function(){
        for (let i = 0; i < 7; i++) {
            for (var j = 0; j < 7; j++) {
                this.sprites[i][j] = new Sprite(i,j,this.imageNameArr[this.code[i][j]], this.image1NameArr[this.code[i][j]]);
            }            
        }
    }
    Map.prototype.render = function(){
        //定一下基本位置
        var baseX = 6 * game.ratio; //padding left
        var spriteW = (game.canvas.width - baseX*2)/7;
        var paddingBottom = game.canvas.height/2 - spriteW * 3.5;// padding bottom
        var baseY = game.canvas.height - spriteW * 7 - paddingBottom;

        game.ctx.save();
        game.ctx.fillStyle = "rgba(255,255,255,0.6)";
        game.ctx.fillRect(baseX, baseY - 5*game.ratio, spriteW*7, spriteW*7);
        game.ctx.restore();
        //渲染更新小精灵
        for (let i = 0; i < 7; i++) {
            for (var j = 0; j < 7; j++) {
                this.sprites[i][j].update();
                this.sprites[i][j].render();
            }            
        }
        this.temparr.forEach(item=>{
            item.update();
            item.render();
        })
    }

    //检查是否能消除，返回一个可以消除的未知数组，
    //形如[{"row": 0, "col": 0},{}...]
    Map.prototype.check = function(){
        var arr = [].concat(this.code);
        arr.push([]);
        var result1 = [];
        for(row = 0; row < 7; row ++){
            var i = 0;
            var j = 1;
            while(i < 7){
                if(arr[row][i] != arr[row][j]){
                    if(j - i >= 3){
                        for (let m = i; m <= j - 1; m++) {
                            result1.push({"row":row, "col":m});
                        }
                    }
                    i = j;
                }
                j++;                
            }
        }
        var result2 = [];
        for(col = 0; col < 7; col ++){
            var i = 0;
            var j = 1;
            while(i < 7){
                if(arr[i][col] != arr[j][col]){
                    if(j - i >= 3){
                        for (let m = i; m <= j - 1; m++) {
                            var isExist = false;
                            result1.map(item=>{
                                if(item.row == m && item.col == col){
                                    isExist = true;
                                }
                            })
                            !isExist && result2.push({"row":m, "col":col});
                        }
                    }
                    i = j;
                }
                j++;
            }
        }
        //统计每个元素下落多少行
        for(let row = 0; row <= 5; row ++){
            for(let col = 0; col < 7; col++){
                //看看这个元素是不是空，如果是空不需要下落 0
                if(this.code[row][col] === ""){
                    this.needToBeDropDown[row][col] = 0;
                } else {
                    let num = 0;
                    for(i = row + 1; i < 7; i++){
                        if(this.code[i][col] === "") num ++;
                    }
                    this.needToBeDropDown[row][col] = num;
                }
            }
        }
        var allresult = result1.concat(result2);
        return allresult;
    }
    //消除,接受一个数组[{"row": 0, "col": 0},{}...]
    Map.prototype.eliminate = function(callback){
        game.Sound["eliminate"].load();
        game.Sound["eliminate"].play();
        this.temparr = [];
        var self = this;
        _.each(this.check(), function(item){
            //爆炸
            self.sprites[item.row][item.col].boom(callback);
            //设置这个位置为a
            self.code[item.row][item.col] = "";
        });

        // game.registCallback(50, function(){
        //     game.map.dropDown();
        // });
    }
    //下落方法
    Map.prototype.dropDown = function(num,callback){
        //统计每个元素下落多少行
        for(let row = 0; row <= 5; row ++){
            for(let col = 0; col < 7; col++){
                //看看这个元素是不是空，如果是空不需要下落 0
                if(this.code[row][col] === ""){
                    this.needToBeDropDown[row][col] = 0;
                } else {
                    let num = 0;
                    for(i = row + 1; i < 7; i++){
                        if(this.code[i][col] === "") num ++;
                    }
                    this.needToBeDropDown[row][col] = num;
                }
            }
        }
        //至此我们已经统计完毕，然后发出命令
        for(let row = 0; row <= 5; row++){
            for(let col = 0; col <= 6; col++){
                if(this.needToBeDropDown[row][col] !== 0){
                    this.sprites[row][col].moveTo(row + this.needToBeDropDown[row][col], col, 20);
                }
            }
        }
        game.registCallback(num,function(){
            callback();
        });
    }

    Map.prototype.newSprites = function(num,callback){
        game.Sound["newsprites"].load();
        game.Sound["newsprites"].play();
        let transposedCode = transpose(this.code);
        for(let i = transposedCode.length - 1; i >= 0; i--){
            for(let j = transposedCode[i].length - 1; j >= 0; j--){
                if(transposedCode[i][j] === ""){
                    transposedCode[i].splice(j,1);
                }
            }
        }
        for(let i = 0; i < 7; i++){
            for(let j = 0; j < 7; j++){
                if(transposedCode[i][j] === undefined){
                    transposedCode[i].unshift("");
                }
            }
        }
        this.code = transpose(transposedCode);
        for(let i = 0; i < 7; i++){
            for(let j = 0; j < 7; j++){
                if(this.code[i][j] === ""){
                    //让数组推入新元素
                    var type = _.random(0, 6);
                    transposedCode[i].unshift(type);
                    //新元素放入临时的小精灵演员数组,moveTo()
                    var newSprite = new Sprite(-6, j, this.imageNameArr[type], this.image1NameArr[type]);
                    newSprite.isClicked = true;
                    game.map.temparr.push(newSprite);
                    newSprite.moveTo(i, j, 20);
                    this.code[i][j] = type;
                }
            }
        }
        game.registCallback(num, function(){
            callback();
            game.map.temparr = [];
            game.map.createSpritesByCode();
        });
    }

    Map.prototype.exchange = function(startRow, startCol, targetRow, targetCol){
        game.fsm = "Exchanging";
        console.log("Exchange: 你正在从" + startRow + " " + startCol + "滑动到" + targetRow + " " + targetCol);
        this.sprites[startRow][startCol].moveTo(targetRow, targetCol, 10);
        this.sprites[targetRow][targetCol].moveTo(startRow, startCol, 10);
        var self = this;
        game.registCallback(10, function(){
            let temp = self.code[startRow][startCol];
            self.code[startRow][startCol] = self.code[targetRow][targetCol];
            self.code[targetRow][targetCol] = temp;
            //此时check;
            if(self.check().length == 0){
                game.Sound["exchange_fail"].play();
                //滑动失败
                self.sprites[startRow][startCol].moveTo(startRow, startCol, 10);
                self.sprites[targetRow][targetCol].moveTo(targetRow, targetCol, 10);
                let temp = self.code[startRow][startCol];
                self.code[startRow][startCol] = self.code[targetRow][targetCol];
                self.code[targetRow][targetCol] = temp;
                game.registCallback(10, function(){
                    game.fsm = "Frozen";
                });
            } else {
                //成功
                game.Sound["exchange_success"].play();
                self.createSpritesByCode();
                game.fsm= "Check"
            }
        });
    }

    //将矩阵转置
    function transpose(arr){
        var _colnum = arr[0].length;
        var result = []
        for(var i = 0; i < _colnum; i++){
            result.push([]);
        }
        for(var i = 0; i < arr.length; i++){
            for(var j = 0; j < _colnum; j++){
                result[j][i] = arr[i][j];
            }
        }
        return result;
    }
})();