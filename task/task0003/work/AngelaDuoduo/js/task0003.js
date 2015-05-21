window.onload = function() {
	/*var userData = {
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

	function System() {
		//defaultCategory obj
		this.defaultCategory = null;
		//categories obj array
		this.categories = [];
		//current category obj
		this.currentCategory = null;
		//unfinishedTaskNum
		this.unfinishedTaskNum = 0;
		//userData json
		//this.userData = userData || {};
		//nav dom, use to appendCategory
		this.nav = document.getElementById("nav").getElementsByTagName("ul")[0];
		//currently no use
		this.subnav = document.getElementById("subnav");
		//currently no use
		this.taskMenus = document.getElementsByClassName("submenu");

		this.userData = JSON.parse(window.localStorage.getItem("userData"));
		
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
		_loadData: function() {
			this.defaultCategory = new Category(this.userData.defaultCategory, this);
			for (var i = 0, len = this.userData.categories.length; i < len; i++) {
				var category = new Category(this.userData.categories[i], this, null);
				this.categories.push(category);
			}
		},
		_renderUI: function() {
			this.defaultCategory.render(this.nav,true);
			for (var i = 0, len = this.categories.length; i < len; i++) {
				this.categories[i].render(this.nav);
			}
			this.defaultCategory.active();			
		},
		_bindUI: function() {
			//addCategory
			var that = this;

			/*add new category*/
			$.click($("#add-category"),function() {
				var categoryName = prompt("please input new category name.");
				var categoryData = {
					"name": categoryName,
					"subcategories": [],
					"tasks": []
				};
				var category = new Category(categoryData, that, that.currentCategory);
				if (that.defaultCategory === that.currentCategory) {
					that.categories.push(category);
					that.userData.categories.push(categoryData);
					category.render(that.nav);
				} else {
					that.currentCategory.subCategories.push(category);
					that.currentCategory.categoryObj.subCategories.push(categoryData);
					category.render(that.currentCategory.navDom);
				}
				
				category.active();
				that.saveUserData();
			});
			
			/*add task*/
			$.click($("#add-task"), function() {
				var taskName = prompt("please input task name");
				var date = new Date();
				var taskData = { 
						"name": taskName,
						"create_time": that._formatDate(date),
						"update_time": that._formatDate(date),
						"content": "",
						"isFinished": false 
					};
				var task = new Task(taskData, that.currentCategory);
				that.currentCategory.taskNum++;
				that.currentCategory.updateTaskNum();
				that.currentCategory.tasks.push(task);
				that.currentCategory.categoryObj.tasks.push(taskData);
				that.currentCategory.refreshTasks();
				task.active();
				that.saveUserData();
			});

			/*switch to task edit mode*/
			$.click($("#edit"), function(event) {
				var titleText = document.getElementById("content-title").getElementsByTagName("p")[0],
					titleInput = document.getElementById("content-title").getElementsByTagName("input")[0],
					contentText = document.getElementById("content-text").getElementsByTagName("p")[0],
					contentTextArea = document.getElementById("content-text").getElementsByTagName("textarea")[0],
					editButton = document.getElementById("edit"),
					saveButton = document.getElementById("save");

				addClass(titleText, "todo-hide");
				addClass(contentText, "todo-hide");
				addClass(editButton, "todo-hide");
                removeClass(titleInput, "todo-hide");
                removeClass(contentTextArea, "todo-hide");
                removeClass(saveButton, "todo-hide");
                
                titleInput.value = titleText.innerText;
                contentTextArea.value = contentText.innerText;

			});

			/*save edited task*/
			$.click($("#save"), function() {
				that._updateTask();

				var titleText = document.getElementById("content-title").getElementsByTagName("p")[0],
					titleInput = document.getElementById("content-title").getElementsByTagName("input")[0],
					contentText = document.getElementById("content-text").getElementsByTagName("p")[0],
					contentTextArea = document.getElementById("content-text").getElementsByTagName("textarea")[0],
					editButton = document.getElementById("edit"),
					saveButton = document.getElementById("save");

				removeClass(titleText, "todo-hide");
				removeClass(contentText, "todo-hide");
				removeClass(editButton, "todo-hide");
                addClass(titleInput, "todo-hide");
                addClass(contentTextArea, "todo-hide");
                addClass(saveButton, "todo-hide");
               	
               	that.currentCategory.currentTask.active();
               	that.saveUserData();
			});
			//switchTaskType
			//finish task
			$.click($("#finish"), function() {
				addClass(that.currentCategory.currentTask.taskDom,"success");
				that.currentCategory.currentTask.taskObj.isFinished = true;
				that.currentCategory.currentTask.isFinished = true;
				that.saveUserData();
			});

			$.click($("#all-task"), function() {
				that.currentCategory.refreshTasks("all");
				that._resetFilter();
				addClass($("#all-task"), "active");
			});

			$.click($("#finished-task"), function() {
				that.currentCategory.refreshTasks("finished");
				that._resetFilter();
				addClass($("#finished-task"), "active");
			});

			$.click($("#unfinished-task"), function() {
				that.currentCategory.refreshTasks("unfinished");
				that._resetFilter();
				addClass($("#unfinished-task"), "active");
			});
		},
		render: function() {
			this._loadData();
			this._renderUI();
			this._bindUI();
		},
		refresh: function() {
			this.categories = [];
			this.render();
		},
		
		saveUserData: function() {
			window.localStorage.setItem("userData", JSON.stringify(this.userData));
		},

		_resetFilter: function() {
			removeClass($("#all-task"), "active");
			removeClass($("#finished-task"), "active");
			removeClass($("#unfinished-task"), "active");
		},

		_resetContent: function() {
			document.getElementById("content-title").getElementsByTagName("p")[0].innerText = "";
			document.getElementById("content-info").getElementsByTagName("p")[0].innerText = "";
			document.getElementById("content-text").getElementsByTagName("p")[0].innerText = "";
		},
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

	function Category(category, system, fatherCategory) {
		this.fatherCategory = fatherCategory;
		//system obj
		this.system = system;
		//category json
		this.categoryObj = category || null;
		//category name
		this.categoryName = category.name;
		//subcategories obj array
		this.subCategories = [];
		//tasks obj array
		this.tasks = [];
		//task num
		this.taskNum = 0;
		//currentTask obj
		this.currentTask = null;
		//tasks list dom in subnav	
		this.tasksDom = null;
		//category nav item dom in nav
		this.navDom = null;

		if (category.subCategories) {
			for (var i = 0, len = category.subCategories.length; i < len; i++) {
				var categoryObj = new Category(category.subCategories[i], this.system, this);
				this.subCategories.push(categoryObj);
			}
		}		

		for (i = 0, len = category.tasks.length; i < len; i++) {
			this.tasks.push(new Task(category.tasks[i], this));
			this.taskNum++;
		}
	}

	Category.prototype = {
		constructor: Category,

		//all category nav item dom in #nav
		allCategories: document.getElementsByClassName("category-item"),
		//all task list dom in #subnav
		allTasksDom: document.getElementsByClassName("menu"),

		render: function(fatherUL,isDefault) {
			/*build navItem*/
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
			
			/*if nested*/
			if (this.subCategories.length > 0) {
				addClass(navItem, "category-submenu");
				var subCategories = document.createElement("ul");
				navItem.appendChild(subCategories);
				for (var i = 0, len = this.subCategories.length; i < len; i++) {
					this.subCategories[i].render(subCategories);
				}
			}

			/*if default*/
			if (isDefault) {
				navItem.id = "default";
			}

			fatherUL.appendChild(navItem);
			this.navDom = navItem;

			/*append subnav list and hide*/
			this.tasksDom = document.createElement("ul");
			addClass(this.tasksDom, "menu todo-hide");
			this._renderTasks();			
			var subnav = document.getElementById("subnav");
			subnav.appendChild(this.tasksDom);

			this._bindUI();
		},

		active: function() {
			//update #subnav, filter or not
			//active task1
			this._resetCategories();
			this.system.currentCategory = this;			
			addClass(this.navDom.getElementsByTagName("span")[0], "active");
			removeClass(this.tasksDom, "todo-hide");				
			if (this.tasks.length > 0) {
				this.tasks[this.tasks.length - 1].active();
			} else {
				this.system._resetContent();
			}
					
		},
		refreshTasks: function(filter) {
			var subnav = document.getElementById("subnav");
			subnav.removeChild(this.tasksDom);
			this.tasksDom = document.createElement("ul");
			addClass(this.tasksDom, "menu");
			this._renderTasks(filter);			
			subnav.appendChild(this.tasksDom);
		},

		updateTaskNum: function() {
			this.navDom.getElementsByTagName("p")[0].innerText = this.categoryName + "(" + this.taskNum + ")";
		},

		_bindUI: function() {
			var that = this;
			/*switch category*/
			$.click(this.navDom, function(event) {
				event.stopPropagation();				
				that.active();
			});

			/*delete category*/
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

		_renderTasks: function(filter) {
			var tasks = this._mergeTasks(filter);
			var dates = Object.keys(tasks).sort().reverse();
			for (var i = 0, len = dates.length; i < len; i++) {
				var date = dates[i];
				var dateItem = document.createElement("li");
				var menuItem = document.createElement("div");
				menuItem.innerText = date;
				addClass(menuItem, "menu-item");
				dateItem.appendChild(menuItem);
				var menu = document.createElement("ul");
				addClass(menu, "submenu");
				for (var j = 0, len2 = tasks[date].length; j < len2; j++) {
					tasks[date][j].render(menu);
				}
				dateItem.appendChild(menu);
				this.tasksDom.appendChild(dateItem);
				if (dates.length > 0) {
					tasks[dates[0]][0].active();
				}
			}
		},
		_resetCategories: function() {
			for (var i = 0, len = this.allCategories.length; i < len; i++) {
				removeClass(this.allCategories[i].getElementsByTagName("span")[0], "active");
				addClass(this.allTasksDom[i], "todo-hide");
			}
		}
	};

	function Task(task, category) {
		//category obj
		this.category = category;
		//task obj
		this.taskObj = task || null;
		//task item dom in #subnav
		this.taskDom = null;
		//task name
		this.name = task.name;
		//task create_time
		this.create_time = task.create_time;
		//task update_time
		this.update_time = task.update_time;
		//if task is finished
		this.isFinished = task.isFinished;
		//task content
		this.content = task.content;
	}

	Task.prototype = {
		constructor: Task,

		//all date submenu in current category, use for event delegation
		menus: document.getElementsByClassName("submenu"),

		render: function(fatherUL) {
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
			this._bindUI();
		},
		active: function() {
			//render title, info, content
			this.category.currentTask = this;
			this._resetTasks();
			addClass(this.taskDom, "active");
			document.getElementById("content-title").getElementsByTagName("p")[0].innerText = this.name;
			document.getElementById("content-info").getElementsByTagName("p")[0].innerText = '任务日期: ' + this.create_time;
			document.getElementById("content-text").getElementsByTagName("p")[0].innerText = this.content;
		},
		add: function() {

		},
		delete: function() {

		},
		update: function() {

		},
		_bindUI: function() {
			var that = this;
			$.click(this.taskDom, function() {
				that.active();
			});

			var deleteLink = this.taskDom.getElementsByTagName("a")[0];
			$.click(deleteLink, function(event) {
				event.preventDefault();
				event.stopPropagation();

				var taskObj = that.category.categoryObj.tasks;
				for (var i = 0; i < taskObj.length; i++) {
					if (taskObj[i].name === that.name) {
						taskObj.splice(i, 1);
						break;
					}
				}
				for (i = 0; i < that.category.tasks.length; i++) {
					if (that.category.tasks[i].name === that.name) {
						that.category.tasks.splice(i, 1);
						break;
					}
				}
				that.category.taskNum--;
				that.category.updateTaskNum();
				that.category.refreshTasks();
				that.category.system.saveUserData();

			});
		},
		_resetTasks: function() {
			for (var i = 0; i < this.menus.length; i++) {
				var tasks = this.menus[i].getElementsByTagName("li");
				for (var j = 0; j < tasks.length; j++) {
					removeClass(tasks[j], "active");
				}
			}
		}
	};

	new System().render();
};