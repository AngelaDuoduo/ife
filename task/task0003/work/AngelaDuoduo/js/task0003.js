window.onload = function() {
	/*
	保存在localStorage里的数据格式
	var userData = {
		defaultCategory: {
			"name": "默认分类",
			"tasks": [
					{ 
						"name": "to-do 1",
						"create_time": "2015-04-30",
						"content": "完成task3编码",
						"isFinished": true 
					}
				]
		},
		categories: [
			{  
				"name": "baiduIFE",
				"subCategories": [
					{
						"name": "subtasks1",
						"subCategories": [],
						"tasks": [
							{ 
								"name": "to-do 1",
								"create_time": "2015-04-10",
								"update_time": "2015-04-10",
								"content": "完成task3编码",
								"isFinished": false 
							},
							{ 
								"name": "to-do 2",
								"create_time": "2015-04-11",
								"update_time": "2015-04-11",
								"content": "完成task3编码",
								"isFinished": false 
							},
						]
					}
				],

				"tasks": [
					{ 
						"name": "to-do 1",
						"create_time": "2015-04-28",
						"update_time": "2015-04-28",
						"content": "完成task3编码",
						"isFinished": false 
					}
				]
			}
		]
	};*/

	/*应用构造函数，只有一个实例*/
	function System() {
		//默认分类对象（对象是指在此文件中实例化的对象）
		this.defaultCategory = null;
		//其他分类对象数组
		this.categories = [];
		//当前选中的分类对象
		this.currentCategory = null;
		//未完成的任务数量。设定是，子分类的任务不算做父分类的任务。父分类可以有自己的任务。
		this.unfinishedTaskNum = 0;
		//分类导航栏中UL DOM元素，用于添加新分类时用到。
		this.nav = document.getElementById("nav").getElementsByTagName("ul")[0];
		//任务导航栏中ul DOM元素。
		this.subnav = document.getElementById("subnav");
		//用户数据，从localStorage中获取
		this.userData = JSON.parse(window.localStorage.getItem("userData"));
		
		//如果第一次打开应用，先进行初始化
		if (!this.userData) {
			this.userData = {
				"defaultCategory": {
					"name": "默认分类",
					"tasks": []
				},
				"categories": []
			};
			window.localStorage.setItem("userData", JSON.stringify(this.userData));
		}
	}

	System.prototype = {
		constructor: System,
		//获得应用中所有分类并实例化对象
		_loadData: function() {
			this.defaultCategory = new Category(this.userData.defaultCategory, this);
			for (var i = 0, len = this.userData.categories.length; i < len; i++) {
				var category = new Category(this.userData.categories[i], this, null);
				this.categories.push(category);
			}
		},
		//将实例化的对象渲染到页面中，并选中默认分类
		_renderUI: function() {
			this.defaultCategory.render(this.nav,true);
			for (var i = 0, len = this.categories.length; i < len; i++) {
				this.categories[i].render(this.nav);
			}
			this.defaultCategory.active();			
		},
		//事件监听
		_bindUI: function() {
			//addCategory
			var that = this;

			/*添加新分类*/
			$.click($("#add-category"),function() {
				//初始化分类信息
				var categoryName = prompt("please input new category name.");
				var categoryData = {
					"name": categoryName,
					"subcategories": [],
					"tasks": []
				};
				//实例化分类对象
				var category = new Category(categoryData, that, that.currentCategory);
				//如果当前选中的分类是默认分类，由于默认分类不允许有子分类，因而新添加的分类算作应用一级分类。
				if (that.defaultCategory === that.currentCategory) {
					that.categories.push(category);
					that.userData.categories.push(categoryData);
					category.render(that.nav);
				} else {
					//如果当前选中的分类不是默认分类，则新添加的分类为当前分类的子类
					that.currentCategory.subCategories.push(category);
					that.currentCategory.categoryObj.subCategories.push(categoryData);
					category.render(that.currentCategory.navDom);
				}
				//选中当前添加的分类，并将新分类持久化到本地存储
				category.active();
				that.saveUserData();
			});
			
			/*添加新任务*/
			$.click($("#add-task"), function() {
				var taskName = prompt("please input task name");
				if (taskName && taskNum.replace(/^\s|\s$/, "") !== "") {
					//初始化任务信息
					var date = new Date();
					var taskData = { 
							"name": taskName,
							"create_time": that._formatDate(date),
							"update_time": that._formatDate(date),
							"content": "",
							"isFinished": false 
						};
					//实例化任务对象
					var task = new Task(taskData, that.currentCategory);
					//当前选中的分类任务数加1
					that.currentCategory.taskNum++;
					//修改分类导航栏中任务数
					that.currentCategory.updateTaskNum();
					//将任务对象添加到所属分类对象中
					that.currentCategory.tasks.push(task);
					//待持久化数据模型更新
					that.currentCategory.categoryObj.tasks.push(taskData);
					//更新任务导航中的任务列表，以显示新任务
					that.currentCategory.refreshTasks();
					//选中新添加的任务
					task.active();
					//持久化新任务数据
					that.saveUserData();
				}
				
			});

			/*按下任务编辑按钮后*/
			$.click($("#edit"), function(event) {
				var titleText = document.getElementById("content-title").getElementsByTagName("p")[0],
					titleInput = document.getElementById("content-title").getElementsByTagName("input")[0],
					contentText = document.getElementById("content-text").getElementsByTagName("p")[0],
					contentTextArea = document.getElementById("content-text").getElementsByTagName("textarea")[0],
					editButton = document.getElementById("edit"),
					saveButton = document.getElementById("save");

				//隐藏任务名称、日期、内容文本，显示名称、日期、文本对应的输入框
				addClass(titleText, "todo-hide");
				addClass(contentText, "todo-hide");
				addClass(editButton, "todo-hide");
                removeClass(titleInput, "todo-hide");
                removeClass(contentTextArea, "todo-hide");
                removeClass(saveButton, "todo-hide");
                //显示编辑提示
                removeClass($("#edit-tip"), "todo-hide");
                
                titleInput.value = titleText.innerText;
                contentTextArea.value = contentText.innerText;

			});

			/*保存编辑完成的任务*/
			$.click($("#save"), function() {
				//根据文本框内容更新任务属性
				that._updateTask();

				var titleText = document.getElementById("content-title").getElementsByTagName("p")[0],
					titleInput = document.getElementById("content-title").getElementsByTagName("input")[0],
					contentText = document.getElementById("content-text").getElementsByTagName("p")[0],
					contentTextArea = document.getElementById("content-text").getElementsByTagName("textarea")[0],
					editButton = document.getElementById("edit"),
					saveButton = document.getElementById("save");

				//显示任务名称、日期、内容文本，隐藏名称、日期、文本对应的输入框
				removeClass(titleText, "todo-hide");
				removeClass(contentText, "todo-hide");
				removeClass(editButton, "todo-hide");
                addClass(titleInput, "todo-hide");
                addClass(contentTextArea, "todo-hide");
                addClass(saveButton, "todo-hide");
                addClass($("#edit-tip"), "todo-hide");
               	
               	//选中当前分类的当前任务（即刚编辑完成的任务），并持久化
               	that.currentCategory.currentTask.active();
               	that.saveUserData();
			});
			
			/*将任务标记为完成时*/
			$.click($("#finish"), function() {
				//修改任务列表中该任务标题的样式
				addClass(that.currentCategory.currentTask.taskDom,"success");
				//修改待持久化数据中该任务的属性
				that.currentCategory.currentTask.taskObj.isFinished = true;
				//修改任务实例中的属性
				that.currentCategory.currentTask.isFinished = true;
				//持久化修改
				that.saveUserData();
			});

			/*选择显示该分类下所有任务*/
			$.click($("#all-task"), function() {
				//更新该分类在任务导航栏中对应的任务列表
				that.currentCategory.refreshTasks("all");
				//设置“所有”选项为选中
				that._resetFilter();
				addClass($("#all-task"), "active");
			});
			/*选择显示当前分类下已完成的任务*/
			$.click($("#finished-task"), function() {
				that.currentCategory.refreshTasks("finished");
				that._resetFilter();
				addClass($("#finished-task"), "active");
			});
			/*显示当前分类下未完成的任务*/
			$.click($("#unfinished-task"), function() {
				that.currentCategory.refreshTasks("unfinished");
				that._resetFilter();
				addClass($("#unfinished-task"), "active");
			});
		},
		//应用初始化时调用此函数
		render: function() {
			this._loadData();
			this._renderUI();
			this._bindUI();
		},
		//持久化数据到本地存储中
		saveUserData: function() {
			window.localStorage.setItem("userData", JSON.stringify(this.userData));
		},
		//设置任务选择器的三个选项（DOM）为未选中
		_resetFilter: function() {
			removeClass($("#all-task"), "active");
			removeClass($("#finished-task"), "active");
			removeClass($("#unfinished-task"), "active");
		},
		//设置页面中任务内容为空，添加新任务时用到
		_resetContent: function() {
			document.getElementById("content-title").getElementsByTagName("p")[0].innerText = "";
			document.getElementById("content-info").getElementsByTagName("p")[0].innerText = "";
			document.getElementById("content-text").getElementsByTagName("p")[0].innerText = "";
		},
		//将文本框中输入的任务内容作为任务的属性，显示在页面中。编辑任务时用到。
		_updateTask: function() {
			var titleInput = document.getElementById("content-title").getElementsByTagName("input")[0],
				contentTextArea = document.getElementById("content-text").getElementsByTagName("textarea")[0],
				title = titleInput.value,
				content = contentTextArea.value;
			this.currentCategory.currentTask.taskDom.innerText = title;
			this.currentCategory.currentTask.taskObj.name = title;
			this.currentCategory.currentTask.taskObj.update_time = this._formatDate(new Date());
			this.currentCategory.currentTask.taskObj.content = content;
			this.currentCategory.currentTask.name = title;
			this.currentCategory.currentTask.content = content;
		},
		//将Date类型日期转换为yyyy-mm-dd格式
		_formatDate: function(date){
			var year = date.getFullYear();
			var month = date.getMonth() + 1;
			if (month <= 9) {
				month = "0" + month;
			}
			var day = date.getDate();
			if (day <= 9) {
				day = "0" + day;
			}
			return year + "-" + month + "-" + day;
		}
	};

	//分类对象构造函数。
	//category是指持久化数据中该分类对应的对象字面量引用，system是应用对象实例.
	//fatherCategory是父分类对象，如果是一级分类，父对象为应用
	function Category(category, system, fatherCategory) {
		
		this.fatherCategory = fatherCategory;
		//应用对象
		this.system = system;
		//当前分类对象在待持久化数据对象中对应的对象字面量引用
		this.categoryObj = category || null;
		//分类名
		this.categoryName = category.name;
		//子分类对象数组
		this.subCategories = [];
		//任务对象数组
		this.tasks = [];
		//任务数
		this.taskNum = 0;
		//当前选中的任务对象
		this.currentTask = null;
		//该分类下任务列表在页面任务导航栏中对应的dom元素	
		this.tasksDom = null;
		//该分类在分类导航栏中对象的dom元素，即分类名称元素。
		this.navDom = null;

		//如果该分类下存在子分类，实例化子分类，并添加到该分类的子分类数组中
		if (category.subCategories) {
			for (var i = 0, len = category.subCategories.length; i < len; i++) {
				var categoryObj = new Category(category.subCategories[i], this.system, this);
				this.subCategories.push(categoryObj);
			}
		}		
		//实例化该分类下的任务
		for (i = 0, len = category.tasks.length; i < len; i++) {
			this.tasks.push(new Task(category.tasks[i], this));
			this.taskNum++;
		}
	}

	Category.prototype = {
		constructor: Category,

		//页面分类导航栏中所有分类的名称dom元素
		allCategories: document.getElementsByClassName("category-item"),
		//页面任务导航栏中所有分类对应的任务列表dom元素
		allTasksDom: document.getElementsByClassName("menu"),
		
		//在页面上渲染该分类，fatherUL指该分类所在的列表元素。如果是一级分类，则是页面分类导航栏，如果不是，则所在列表由父分类创建。
		//isDefault代表是否为默认分类
		render: function(fatherUL,isDefault) {
			/*在分类导航栏中添加元素*/
			var navItem = document.createElement("li");
			addClass(navItem, "category-item");
			navItem.appendChild(document.createElement("i"));			
			var itemName = document.createElement("span");
			var itemText = document.createElement("p");
			itemText.innerText = this.categoryName + "(" + this.taskNum + ")";
			var deleteLink = document.createElement("a");
			deleteLink.innerText = "删除";
			itemName.appendChild(itemText);
			itemName.appendChild(deleteLink);
			navItem.appendChild(itemName);
			
			/*添加子分类元素*/
			if (this.subCategories.length > 0) {
				addClass(navItem, "category-submenu");
				var subCategories = document.createElement("ul");
				navItem.appendChild(subCategories);
				for (var i = 0, len = this.subCategories.length; i < len; i++) {
					this.subCategories[i].render(subCategories);
				}
			}

			/*如果是默认分类，添加id属性*/
			if (isDefault) {
				navItem.id = "default";
			}

			//添加该元素到页面分类导航栏
			fatherUL.appendChild(navItem);
			this.navDom = navItem;

			//创建任务列表，将该分类下的任务添加到页面任务导航栏中，并隐藏。
			this.tasksDom = document.createElement("ul");
			addClass(this.tasksDom, "menu todo-hide");
			this._renderTasks();			
			var subnav = document.getElementById("subnav");
			subnav.appendChild(this.tasksDom);

			//为该分类注册事件
			this._bindUI();
		},

		//选中该分类
		active: function() {
			
			//将所有分类在页面分类导航栏中的样式设置为未选中
			this._resetCategories();
			//在页面分类导航栏中设置该分类为选中样式			
			addClass(this.navDom.getElementsByTagName("span")[0], "active");
			//设置应用当前的分类为该分类
			this.system.currentCategory = this;
			//在任务导航栏中显示该分类下的任务列表
			removeClass(this.tasksDom, "todo-hide");

			//如果分类下有任务，选中最新创建的一个				
			if (this.tasks.length > 0) {
				this.tasks[this.tasks.length - 1].active();
			} else {
				this.system._resetContent();
			}
					
		},
		//更新任务列表，filter为任务类别，可以是所有任务、未完成任务与已完成任务
		refreshTasks: function(filter) {
			//移除原有列表
			var subnav = document.getElementById("subnav");
			subnav.removeChild(this.tasksDom);
			//新建列表
			this.tasksDom = document.createElement("ul");
			addClass(this.tasksDom, "menu");
			//渲染该分类下的任务并添加到列表中
			this._renderTasks(filter);			
			subnav.appendChild(this.tasksDom);
		},
		//在页面中更新分类下的任务数
		updateTaskNum: function() {
			this.navDom.getElementsByTagName("p")[0].innerText = this.categoryName + "(" + this.taskNum + ")";
		},
		//事件注册
		_bindUI: function() {
			var that = this;
			/*点击该分类名称时，选中该分类*/
			$.click(this.navDom, function(event) {
				event.stopPropagation();				
				that.active();
			});

			/*点击该分类最右侧的删除时，删除分类*/
			var deleteLink = this.navDom.getElementsByTagName("a")[0];
			$.click(deleteLink, function(event) {
				event.preventDefault();
				event.stopPropagation();
				var fatherCategoryObj = (that.fatherCategory && that.fatherCategory.categoryObj) || that.system.userData.categories;				
				for (var i = 0; i < fatherCategoryObj.subCategories.length; i++) {
					if (fatherCategoryObj.subCategories[i].name === that.name) {
						fatherCategoryObj.splice(i, 1);
						break;
					}
				}
				that.tasksDom.parentNode.removeChild(that.tasksDom);
				that.navDom.parentNode.removeChild(that.navDom);
				that.system.defaultCategory.active();
				that = null;
				that.saveUserData();			
			});
		},
		
		//将分类下任务按时间聚合，返回一个对象。对象属性为时间，对应的值为该时间创建的任务对象数组。
		//不显示不属于filter类别的任务
		_mergeTasks: function(filter){
			var result = {};
			for (var i = 0, len = this.tasks.length; i < len; i++) {
				var time = this.tasks[i].create_time;
				var isFinished = this.tasks[i].isFinished;
				if ((filter === "finished" && !isFinished) || (filter === 'unfinished' && isFinished)) {
					continue;
				}		
				if (!result[time]){
					result[time] = [];
				}
				result[time].push(this.tasks[i]);
			} 				
			return result;
		},

		//在页面上渲染任务对象
		_renderTasks: function(filter) {
			//将任务按时间聚合
			var tasks = this._mergeTasks(filter);
			//提取时间，逆序排列
			var dates = Object.keys(tasks).sort().reverse();
			for (var i = 0, len = dates.length; i < len; i++) {
				var date = dates[i];
				//创建时间列表
				var dateItem = document.createElement("li");
				var menuItem = document.createElement("div");
				menuItem.innerText = date;
				addClass(menuItem, "menu-item");
				dateItem.appendChild(menuItem);
				var menu = document.createElement("ul");
				addClass(menu, "submenu");
				//渲染该时间下的任务对象
				for (var j = 0, len2 = tasks[date].length; j < len2; j++) {
					tasks[date][j].render(menu);
				}
				dateItem.appendChild(menu);
				this.tasksDom.appendChild(dateItem);
			}
			//如果有任务，选中第一个
			if (dates.length > 0) {
				tasks[dates[0]][0].active();
			}
		},
		//设置所有分类的样式为未选中状态
		_resetCategories: function() {
			for (var i = 0, len = this.allCategories.length; i < len; i++) {
				removeClass(this.allCategories[i].getElementsByTagName("span")[0], "active");
				addClass(this.allTasksDom[i], "todo-hide");
			}
		}
	};

	//任务对象构造函数，task指的是在持久化数据对象中的对象字面量引用，category指的是任务所属分类对象
	function Task(task, category) {

		this.category = category;

		this.taskObj = task || null;
		//该任务在页面任务导航栏中的标题元素
		this.taskDom = null;
		//任务名
		this.name = task.name;
		//创建时间
		this.create_time = task.create_time;
		//最近更新时间
		this.update_time = task.update_time;
		//是否完成
		this.isFinished = task.isFinished;
		//内容
		this.content = task.content;
	}

	Task.prototype = {
		constructor: Task,

		//页面任务导航栏中所有时间列表元素。
		menus: document.getElementsByClassName("submenu"),

		//渲染该任务
		render: function(fatherUL) {
			//在任务导航栏中创建元素
			var taskName = document.createElement("li");
			taskName.innerText = this.name;
			if (this.isFinished) {
				addClass(taskName, "success");
			}
			var deleteLink = document.createElement("a");
			deleteLink.innerText = "删除";
			taskName.appendChild(deleteLink);
			fatherUL.appendChild(taskName);
			this.taskDom = taskName;
			//事件注册
			this._bindUI();
		},
		//选中该任务
		active: function() {
			//将所属分类的当前任务设置为该任务
			this.category.currentTask = this;
			//设置所有任务的样式为未选中
			this._resetTasks();
			//设置当前任务样式为选中
			addClass(this.taskDom, "active");
			//更新页面右侧的任务内容
			document.getElementById("content-title").getElementsByTagName("p")[0].innerText = this.name;
			document.getElementById("content-info").getElementsByTagName("p")[0].innerText = '任务日期: ' + this.create_time;
			document.getElementById("content-text").getElementsByTagName("p")[0].innerText = this.content;
		},

		_bindUI: function() {
			var that = this;
			//任务导航栏中点击该任务名称时，选中该任务
			$.click(this.taskDom, function() {
				that.active();
			});

			//点击删除时，删除该任务
			var deleteLink = this.taskDom.getElementsByTagName("a")[0];
			$.click(deleteLink, function(event) {
				event.preventDefault();
				event.stopPropagation();

				//在持久化数据中删除
				var taskObj = that.category.categoryObj.tasks;
				for (var i = 0; i < taskObj.length; i++) {
					if (taskObj[i].name === that.name) {
						taskObj.splice(i, 1);
						break;
					}
				}
				//在分类对象中删除
				for (i = 0; i < that.category.tasks.length; i++) {
					if (that.category.tasks[i].name === that.name) {
						that.category.tasks.splice(i, 1);
						break;
					}
				}
				//所属分类任务数减1
				that.category.taskNum--;
				//更新分类导航栏中任务数
				that.category.updateTaskNum();
				//更新任务导航栏中任务列表
				that.category.refreshTasks();
				//持久化修改
				that.category.system.saveUserData();

			});
		},
		//设置所有任务的样式为未选中
		_resetTasks: function() {
			for (var i = 0; i < this.menus.length; i++) {
				var tasks = this.menus[i].getElementsByTagName("li");
				for (var j = 0; j < tasks.length; j++) {
					removeClass(tasks[j], "active");
				}
			}
		}
	};

	//打开页面时，渲染应用
	new System().render();
};