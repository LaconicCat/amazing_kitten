(function(){
    //地图类
    var Map = window.Map = function(row, col, type){
        //存储一个数字标志(精灵类型)的地图，并不是真的精灵。
        this.code = [
            [0,1,2,3,4,5,6],
            [1,2,3,4,5,6,0],
            [2,3,4,5,6,0,1],
            [3,4,5,6,0,1,2],
            [4,5,6,0,1,2,3],
            [5,6,0,1,2,3,4],
            [6,0,1,2,3,4,5]
        ];
        //这个矩阵也是7*7，存放真正精灵的
        this.sprites = [[],[],[],[],[],[],[]];
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

        game.ctx.fillStyle = "rgba(255,255,255,0.6)";
        game.ctx.fillRect(baseX, baseY - 5*game.ratio, spriteW*7, spriteW*7);

        for (let i = 0; i < 7; i++) {
            for (var j = 0; j < 7; j++) {
                this.sprites[i][j].update();
                this.sprites[i][j].render();
            }            
        }
    }
})();