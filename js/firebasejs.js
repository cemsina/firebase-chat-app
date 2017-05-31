function FirebaseJS(config){
	"use strict";
	let _FirebaseJS = this;
	this.Auth = () => firebase.auth().currentUser;
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
	this.SignInGoogle = () => {
		firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
	}
	this.SignOut = () => {
		firebase.auth().signOut();
	}
	const EventHandler = EventWrapper("signin","signout");
	this.On = (eventname,callback) => EventHandler.On(eventname,callback);
	this.Call = (eventname) => EventHandler.Call(eventname);
	this.EventQueue = (eventname) => EventHandler.Queue(eventname);
	this.FirebaseObject = function(path) {
		"use strict";
		const FirebaseObjectEventHandler = EventWrapper("get","changed");
		this.Path = path;
		this.Name = null;
		this.Value = null;
		this.On = (eventname,callback) => FirebaseObjectEventHandler.On(eventname,callback);
		this.Call = (eventname) => FirebaseObjectEventHandler.Call(eventname);
		this.EventQueue = (eventname) => FirebaseObjectEventHandler.Queue(eventname);
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
		_FirebaseJS.Connection.Ref.child(path).on("value", (snapshot) => {
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
		_FirebaseJS.Connection.App = firebase.initializeApp(config);
		_FirebaseJS.Connection.Ref = _FirebaseJS.Connection.App.database().ref();
		firebase.auth().onAuthStateChanged((user) => {
			_FirebaseJS.Call((user == null) ? "signout" : "signin");
		});
	}
	this.Initialize();
}
