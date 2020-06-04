(function(){
    //精灵类,行号0~6 列号0~6, type 0~6
    var Sprite = window.Sprite = function(row, col, imageName, image1Name){
        this.row = row;
        this.col = col;
        this.imageName = imageName;
        this.image1Name = image1Name;
    }
    Sprite.prototype.render = function(){
        //定一下基本位置
        var baseX = 6 * game.ratio; //padding left
        var spriteW = (game.canvas.width - baseX*2)/7;
        var paddingBottom = game.canvas.height/2 - spriteW * 3.5;// padding bottom
        var baseY = game.canvas.height - spriteW * 7 - paddingBottom;
        this.x = baseX + spriteW * this.col;
        this.y = baseY + spriteW * this.row;
        for (let i = 0; i < 7; i++) {
            for (var j = 0; j < 7; j++) {
                game.ctx.drawImage(game.R[this.imageName], this.x, this.y, spriteW, spriteW);   
            }             
        }
    }
    Sprite.prototype.update = function(){
        
    }
})();