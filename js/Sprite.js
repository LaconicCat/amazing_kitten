(function(){
    //精灵类,行号0~6 列号0~6, type 0~6
    var Sprite = window.Sprite = function(row, col, imageName, image1Name){
        this.row = row;
        this.col = col;
        this.imageName = imageName;
        this.image1Name = image1Name;
        this.isMove = false;
        this.moveNo = 0;
        this.isBoom = false;
        this.boomStep = 0;
        this.isHide = false;
        this.isClicked = false;
        this.boomArr = [[0,0], [0,0], [0,1], [1,0], [1,1], [2,0], [2,1], [3,0]];

        //定一下基本位置
        this.x = calcXYbyRowCol(row, col).x;
        this.y = calcXYbyRowCol(row, col).y;
        this.spriteW = calcXYbyRowCol(row, col).w;
        
    }
    Sprite.prototype.render = function(){
        if(this.isHide) return;
        if(!this.isBoom && !this.isClicked &&!this.isMove){
            game.ctx.drawImage(game.R[this.imageName], this.x, this.y, this.spriteW, this.spriteW);             
        } else if(this.isBoom) {
            game.ctx.drawImage(game.R["boom"], 128*this.boomArr[this.boomStep][1], 128*this.boomArr[this.boomStep][0], 128, 128, this.x, this.y - 10*game.ratio, this.spriteW, this.spriteW);
        } else if(this.isClicked || this.isMove){
            game.ctx.drawImage(game.R[this.image1Name], this.x, this.y, this.spriteW, this.spriteW);
        }
    }
    
    Sprite.prototype.update = function(){
        //isHide 只要为true，就取消更新！！
        if(this.isHide) return;
        
        if(this.isMove){
            this.x += this.dx;
            this.y += this.dy;
            this.moveNo --;
        }
        //小帧号到0时，停止
        if(this.moveNo <= 0){
            this.isMove = false;
        }
        //如果在爆炸
        if(this.isBoom){
            if(game.fno % 5 === 0 && this.boomStep < 7){
                this.boomStep++;
            }
            if(this.boomStep > 6){
                this.isHide = true;
                //执行回调函数
                game.registCallback(10, this.callback);
            }
        }
    }
    //运动
    Sprite.prototype.moveTo = function(targetRow, targetCol, duringFrames){
        this.isMove = true;
        //计算自己应该有的dx值
        var targetY = calcXYbyRowCol(targetRow, targetCol).y;
        var targetX = calcXYbyRowCol(targetRow, targetCol).x;
        var distanceX = targetX - this.x;
        var distanceY = targetY - this.y;
        //平均分配到那么多帧里
        this.dx = distanceX / duringFrames;
        this.dy = distanceY / duringFrames;
        //设置moveNo
        this.moveNo = duringFrames;
    }
    Sprite.prototype.boom = function(callback){
        this.isBoom = true;
        this.callback = callback;
    }
    //辅助函数，计算xy
    function calcXYbyRowCol(row, col){
        return{
            "x": game.baseX + game.spriteW * col,
            "y": game.baseY + game.spriteW * row,
            "w": game.spriteW
        }
    }
}
)();