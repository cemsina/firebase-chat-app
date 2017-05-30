const config = {
    apiKey: "API_KEY",
    authDomain: "APPNAME.firebaseapp.com",
    databaseURL: "https://APPNAME.firebaseio.com",
    storageBucket: "APPNAME.appspot.com"
};
var domain = decodeURIComponent(document.documentURI);
var FJS = new FirebaseJS(config);
function ToElement(obj){
	var d = new Date(obj.Value.timestamp);
		return $('<div class="message '+((UserAuth == obj.Value.auth) ? 'sent' : 'received')+'" id="message-'+obj.Name+'">'+
                  '<b>'+obj.Value.auth+'</b><br />'+
				  obj.Value.content +
                  '<span class="metadata">'+
                  '<span class="time">'+d.getHours()+':'+d.getMinutes()+'</span>' +
				  '</span>'+
                '</div>');
}
var UserAuth;
function Room(room_name){
	"use strict";
	var _room = this;
	this.Name = null;
	this.Messages = {};
	this.MessagesObject = null;
	this.SendMessage = () => {
		if($("input#message").val() == "") return;
		var message = {
			auth:UserAuth,
			content:$("input#message").val(),
			timestamp:+new Date()
		};
		$("input#message").val('');
		this.MessagesObject.Push(message);
	}
	function NewMessage(id){
		var newobj = new FJS.FirebaseObject("rooms/"+_room.Name+"/"+id);
		_room.Messages[id] = newobj;
		newobj.On("get",() => {
			var e = ToElement(newobj);
			$("#chats").append(e);
		});
		newobj.On("changed",() => {
			var newe = ToElement(newobj);
			$("#message-"+newobj.Name).html(newe.html());
		});
		newobj.Get();
	}
	this.Initialize = () => {
		this.Name = room_name;
		this.MessagesObject = new FJS.FirebaseObject("rooms/"+this.Name);
		this.MessagesObject.On("get",() => {
			if(this.MessagesObject.Value == null) return;
			var ids = Object.keys(this.MessagesObject.Value);
			for(var i=0;i<ids.length;i++){
				NewMessage(ids[i]);
			}
			$("#chats").scrollTop($("#chats")[0].scrollHeight);
		});
		this.MessagesObject.On("changed",() => {
			var ids = Object.keys(this.MessagesObject.Value);
			for(var i=0;i<ids.length;i++){
				if(!(ids[i] in this.Messages)){
					NewMessage(ids[i]);
				}
			}
			$("#chats").scrollTop($("#chats")[0].scrollHeight);
		});
		this.MessagesObject.Get();
	}
	this.Initialize();
}
var room;
function EnterRoom(){
	UserAuth = $('input#auth').val();
	var roomname = $('input#joinroom').val();
	if(roomname == "" || UserAuth == "") return;
	$("title").html(roomname + ' | Chat BETA');
	room = new Room(roomname);
	$("span#room_name").html(roomname);
	$("span.username").html(UserAuth);
	$("#room").css("display","block");
	$("#enterroom").css("display","none");
	var src = "?room="+encodeURIComponent(roomname)+"&nick="+encodeURIComponent(UserAuth);
	var maindomain = domain.split("?")[0];
	window.history.pushState({}, null, src);
}
$(document).ready(() => {
	
	var domainsrc = domain.split("?");
	if(domainsrc.length > 1){
		var paramsArr = domainsrc[1].split("&");
		var params = {};
		for(var i=0;i<paramsArr.length;i++){
			var param = paramsArr[i].split("=");
			params[param[0]] = param[1];
		}
		$("input#joinroom").val(params["room"]);
		if($("input#joinroom").val() != "") $("title").html($("input#joinroom").val() + ' | Chat BETA');
		$("input#auth").val(params["nick"]);
		if($("input#joinroom").val() != "" && $("input#auth").val() != ""){
			EnterRoom();
		}
	}
	
	$("#message").on('keyup', function (e) {
		if (e.keyCode == 13) {
			room.SendMessage();
		}
	});
});

