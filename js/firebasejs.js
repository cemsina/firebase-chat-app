function FirebaseJS(config){
	"use strict";
	let _FirebaseJS = this;
	function EventWrapper(/* eventnames,... */){
		let Events = {};
		for(let i=0;i<arguments.length;i++)
			Events[arguments[i]] = [];
		return {
			Call : ((eventname) => {
				for(let i=0;i<Events[eventname].length;i++)
					Events[eventname][i]();
			}),
			On : ((eventname,callback) => {
				Events[eventname].push(callback);
			}),
			Queue : ((eventname) => {
				return Events[eventname];
			})
		}
	}
	this.FirebaseObject = function(path) {
		"use strict";
		const EventHandler = EventWrapper("get","changed");
		this.Path = path;
		this.Name = null;
		this.Value = null;
		this.On = (eventname,callback) => EventHandler.On(eventname,callback);
		this.Call = (eventname) => EventHandler.Call(eventname);
		this.Get = () => {
			_FirebaseJS.Connection.Ref.child(path).on("value", (snapshot) => {
				if(this.Value == null) {
					this.Value = snapshot.val();
					var ref = _FirebaseJS.Connection.Ref.child(path);
					this.Name = ref.path.o[ref.path.o.length-1];
					this.Call("get");
				}else{
					this.Value = snapshot.val();
					this.Call("changed");
				}
				
				
			});
		}
		this.Set = (value) => _FirebaseJS.Set(this.Path,value);
		this.Push = (value) => _FirebaseJS.Push(this.Path,value);
	}
	this.Connection = {
		App : null,
		Ref : null
	}
	this.Get = (path,callback) => {
		this.Connection.Ref.child(path).on("value", (snapshot) => {
			callback(snapshot.val());
		}, (errorObject) => {
			callback(null);
		});
	}
	this.Set = (path,value) => {
		this.Connection.Ref.child(path).set(value);
	}
	this.Push = (path,value) => {
		var newref = this.Connection.Ref.child(path).push(value);
		if(newref.path.o.length > 0) return newref.path.o[newref.path.o.length-1];
		else return null;
	}
	this.Initialize = () => {
		this.Connection.App = firebase.initializeApp(config);
		this.Connection.Ref = this.Connection.App.database().ref();
	}
	this.Initialize();
}
