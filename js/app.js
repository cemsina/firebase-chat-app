const config = {
    apiKey: "AIzaSyDE0yg0bx_nj_lIIJOg0MbzXa3HZmQx5MQ",
    authDomain: "chat-ebb99.firebaseapp.com",
    databaseURL: "https://chat-ebb99.firebaseio.com",
    storageBucket: "chat-ebb99.appspot.com"
};
var domain = decodeURIComponent(document.documentURI);
var FJS = new FirebaseJS(config);
FJS.On("signin",() => {
	if(FJS.Auth == null) return;
	$("#signin").css("display","none");
	$("#signout").css("display","block");
	var o = new FJS.FirebaseObject("users/"+FJS.Auth().uid);
	o.On("get",() => {
		SetUser=false;
		var userjson = {
			Name : FJS.Auth().displayName
		};
		o.Set(userjson);
	});
	o.Get();
	console.log(+new Date(),"Signed in as : ",FJS.Auth().displayName);
	var domainsrc = domain.split("?");
	if(domainsrc.length > 1){
		var paramsArr = domainsrc[1].split("&");
		var params = {};
		for(var i=0;i<paramsArr.length;i++){
			var param = paramsArr[i].split("=");
			params[param[0]] = param[1];
		}
		
		$("input#joinroom").val(params["room"]);
		
		if($("input#joinroom").val() != ""){
			EnterRoom();
		}
	}
});
FJS.On("signout",() => {
	$("#signin").css("display","block");
	$("#signout").css("display","none");
	console.log(+new Date(),"Signed out");
});

function Room(room_name){
	"use strict";
	var _room = this;
	this.Name = null;
	this.Messages = [];
	this.MessagesObject = null;
	this.UsersObjects = {};
	this.SendMessage = () => {
		if($("input#message").val() == "") return;
		var message = {
			content:$("input#message").val(),
			timestamp:+new Date()
		};
		$("input#message").val('');
		var path = this.MessagesObject.Path+"/"+FJS.Auth().uid;
		FJS.Push(path,message);
	}
	function UpdateUserInfo(uid){
		$("b#user-"+uid).html(_room.UsersObjects[uid].Value.Name || "");
	}
	function GetUser(uid){
		if(!(uid in _room.UsersObjects))
			_room.UsersObjects[uid] = new FJS.FirebaseObject("users/"+uid);
		if(_room.UsersObjects.Value == null){
			_room.UsersObjects[uid].On("get",() => UpdateUserInfo(uid));
			_room.UsersObjects[uid].On("changed",() => UpdateUserInfo(uid));
			_room.UsersObjects[uid].Get();
		}
	}
	function ToElement(uid,obj){
		if(obj.Value == null) return null;
		var d = new Date(obj.Value.timestamp);
		var el = $('<div class="message '+((uid == FJS.Auth().uid) ? 'sent' : 'received')+'" data-timestamp="'+obj.Value.timestamp+'" id="message-'+obj.Name+'">'+
				  '<b id="user-'+uid+'"></b><br />'+
				  obj.Value.content +
				  '<span class="metadata">'+
				  '<span class="time">'+d.getHours()+':'+d.getMinutes()+'</span>' +
				  '</span>'+
				'</div>');
		return el;
	}
	function NewMessage(uid,message_id){
		var newobj = new FJS.FirebaseObject("rooms/"+_room.Name+"/"+uid+"/"+message_id);
		_room.Messages.push(newobj);
		newobj.On("get",() => {
			if(newobj.Value == null) return;
			var e = ToElement(uid,newobj);
			$("#chats").append(e);
			GetUser(uid);
		});
		newobj.On("changed",() => {
			if(newobj.Value == null) return;
			var newe = ToElement(uid,newobj);
			$("#message-"+newobj.Name).html(newe.html());
			GetUser(uid);
		});
		newobj.Get();
	}
	function SortMessagesByTimestamp(){
		var list = $(".message").get();
		list.sort((a,b) => {
			return a.getAttribute("data-timestamp").localeCompare(b.getAttribute("data-timestamp"));
		});
		for (var i = 0; i < list.length; i++) {
			list[i].parentNode.appendChild(list[i]);
		}
	}
	function FillMessages(){
		var uids = Object.keys(_room.MessagesObject.Value);
		for(var i=0;i<uids.length;i++){
			if(!uids[i] in _room.UsersObjects) _room.UsersObjects[uids[i]] = new FJS.FirebaseObject("users/"+uids[i]);
			var ids = Object.keys(_room.MessagesObject.Value[uids[i]]);
			for(var j=0;j<ids.length;j++){
				if($("#message-"+ids[j]).length == 0) NewMessage(uids[i],ids[j]);
			}
		}
		SortMessagesByTimestamp();
	}
	this.Initialize = () => {
		this.Name = room_name;
		this.MessagesObject = new FJS.FirebaseObject("rooms/"+this.Name);
		
		this.MessagesObject.On("get",() => {
			if(this.MessagesObject.Value == null) return;
			FillMessages();
			$("#chats").scrollTop($("#chats")[0].scrollHeight);
		});
		this.MessagesObject.On("changed",() => {
			FillMessages();
			$("#chats").scrollTop($("#chats")[0].scrollHeight);
		});
		this.MessagesObject.Get();
	}
	this.Initialize();
}
var room;
function EnterRoom(){
	var roomname = $('input#joinroom').val();
	if(roomname == "" || FJS.Auth() == null) return;
	$("title").html(roomname + ' | Chat BETA');
	room = new Room(roomname);
	$("span#room_name").html(roomname);
	$("span.username").html(FJS.Auth().displayName);
	$("#room").css("display","block");
	$("#enterroom").css("display","none");
	var src = "?room="+encodeURIComponent(roomname);
	var maindomain = domain.split("?")[0];
	window.history.pushState({}, null, src);
	FJS.Set("users/"+FJS.Auth().uid+"/LastRoom", roomname);
}
$(document).ready(() => {
	$('#signin').on('click',() => FJS.SignInGoogle());
	$('#signout').on('click',() => FJS.SignOut());
	
	$("#message").on('keyup', function (e) {
		if (e.keyCode == 13) {
			room.SendMessage();
		}
	});
});