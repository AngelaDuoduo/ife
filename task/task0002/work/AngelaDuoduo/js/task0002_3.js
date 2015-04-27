function AutoPlay(picsDom) {
	this.dom = picsDom;
	this.picsLi = this.dom.getElementsByTagName("ul")[0].getElementsByTagName("li");
	this.indexes = this.setIndexes(this.dom);
	this.width = parseInt(this.picsLi && this.picsLi[0].offsetWidth, 10) || 490;
	this.height = parseInt(this.picsLi && this.picsLi[0].offsetHeigt, 10) || 170;
	this.count = this.indexes.length;
	this.timer = null;
	this.autoTimer = null;
}
AutoPlay.prototype = {
	constructor: AutoPlay,
	init: function(options) {
		var options = options || {};
		if (typeof options.isLoop === 'undefined') {
			options.isLoop = true;
		}
		if (typeof options.reverseOrder === 'undefined') {
			options.reverseOrder = false;
		}		
		
		this.currentIndex = 0;
		this.reverseOrder = options.reverseOrder;
		this.isLoop = options.isLoop;
		this.slot = options.slot;

		this.bind();
		this.autoPlay();

	},
	setIndexes: function(picsDom) {
		var ul = document.createElement("ul");
		ul.className = "index";
		var indexNum = picsDom.getElementsByTagName("img").length;
		for (var i = 1; i <= indexNum; i++) {
			var li = document.createElement("li");
			li.innerText = i;
			if (i == 1) {
				li.className = "current";
			}
			ul.appendChild(li);
		}
		picsDom.appendChild(ul);
		return ul.getElementsByTagName("li");
	},
	bind: function() {
		var imgs = this.dom.getElementsByTagName("img");
		var that = this;
		for (var i = 0; i < this.count; i++) {
			imgs[i].onmouseover = function() {
				clearInterval(that.autoTimer);
			};
			imgs[i].onmouseout = function() {
				that.autoPlay();
			};
			this.indexes[i].onclick = (function(index) {
				return function() {
					clearInterval(that.autoTimer);
					that.playOnePic(index);
					that.showIndex(index);
					that.currentIndex = index;
					that.autoPlay();
				}
			}(i));
		}
	},
	autoPlay: function() {
		//如果不是循环播放		
		var that = this,
			picNum = 0;
		this.autoTimer = setInterval(function() {
			if (!that.reverseOrder) {
				that.currentIndex = that.currentIndex === that.count - 1 ? 0 : that.currentIndex + 1;
			} else {
				that.currentIndex = that.currentIndex === 0 ? that.count - 1 : that.currentIndex - 1;
			}
			that.playOnePic(that.currentIndex);
			that.showIndex(that.currentIndex);
			picNum++;
			if (!that.isLoop && picNum >= that.count) {
				clearInterval(that.autoTimer);
			}	
		}, this.slot);
					
	},
	playOnePic: function(index) {

		var that = this,
			speed = 10,
			start = 0,
			end = 100,			
			lastIndex;
		//如果不是逆序
		if (!this.reverseOrder) {
			lastIndex = (index === 0 ? this.count - 1 : index - 1);
		} else {
			lastIndex = (index === this.count - 1 ? 0 : index + 1);
		}

		for (var i = 0; i < this.picsLi.length; i++) {
			if (i === lastIndex || i === index) {
				this.picsLi[i].style.display = "block";
			} else {
				this.picsLi[i].style.display = "none";
			}
			this.picsLi[i].style.left = "";
			this.picsLi[i].style.right = "";
		}
		this.timer = setInterval(function() {
			if (start <= end) {
				//如果不是逆序
				if (!that.reverseOrder) {
					that.picsLi[lastIndex].style.left = -start + "%";
					that.picsLi[index].style.left = end - start + "%";
				} else {
					that.picsLi[lastIndex].style.right = -start + "%";
					that.picsLi[index].style.right = end - start + "%";
				}				
				start += speed;
			} else {
				clearInterval(that.timer);
			}
		}, 50);
	},
	showIndex: function(index) {				
		for (var i = 0; i < this.count; i++) {
			if (i === index) {
				this.indexes[i].className = "current";
			} else {
				this.indexes[i].className = "";
			}
		}
	}
}
window.onload = function() {
	var autoPlayPics = document.getElementsByClassName("autoPlayPics");
	for (var i = 0; i < autoPlayPics.length; i++) {
		var autoPlay = new AutoPlay(autoPlayPics[i]);
		autoPlay.init({
			reverseOrder: false,
			isLoop: true,
			slot: 3000
		});
	}	
}