const electron = require("electron")
const remote = electron.remote

var currentNick = "";
var currentSessionKey = "";

function setModalText(title, subtitle) {
    $(".modal .title").text(title);
    $(".modal .subtitle").text(subtitle);
}

function setModalEnabled() {
    $("html").addClass("is-clipped");
    $(".modal").addClass("is-active");
}

function setModalContent(html) {
    $(".modal .content").remove();
    if (html) {
        $(".modal .media-content").append("<div class=\"content\"></div>")
        $.get("assets/" + html, function(a) {
            $(".modal .content").html(a)
        });
    }
}

function joinButton() {
    currentSessionKey = $("input.sessionkey").val();
    msg.joinSession(currentNick, currentSessionKey);
    $("html").removeClass("is-clipped");
    $(".modal").removeClass("is-active")
}

function tailScroll() {
    var height = $(".chatbox").get(0).scrollHeight;
    $(".chatbox").animate({
        scrollTop: height
    }, 500);
}

function appendMsg(name, msg, color = "#F27CFD") {
    $("<div />").html("<span style=\"color: " + color + "\">" + name + "</span>: " + msg).appendTo(".chatbox");
    tailScroll();
}

function switchToMainUi(){
    $(".start-ui").fadeOut(500);
    $(".hero").fadeOut(500, function() {
        $(".main-ui").fadeIn(300);
    });
}

function sessionKeyModal(subtitle){
    setModalText("Connect", subtitle ? subtitle : "please enter the session key you want to connect to");
    setModalContent("modal-connect.tpl");
    setModalEnabled(true);
}

$(document).ready(function() {
    $(".main-ui").hide();
    $(".start-ui").hide();

    $(".start-ui button").click(function(e) {
        var type = "";

        switch($(this).text()) {
            case "Connect":
                sessionKeyModal();
                // TODO: handle nickname in use error
                break;
            case "Create":
                msg.createSession(currentNick);
                switchToMainUi();
                break;
        }
    });

    $(".intro-ui .ready-button").click(function() {
        currentNick = $(".intro-ui input.nickname").val();

        if (currentNick == "") {
            setModalText("No nickname!", "please specify a nickname");
            setModalContent("");
            setModalEnabled();
            return;
        }

        else if (currentNick.length > 20) {
            setModalText("Too long!", "your chosen nickname is over 20 letters long");
            setModalContent("");
            setModalEnabled();
            return;
        }

        $(".intro-ui").fadeOut(500, function() {
            $(".start-ui").fadeIn(300);
        });
    });

    $(".modal-background, .modal-close").click(function() {
        $("html").removeClass("is-clipped");
        $(this).parent().removeClass("is-active");
    });

    $(".input.chat").on('keyup', function (e) {
        if (e.keyCode == 13) {
            let t_message = $(".input.chat").val();
            if (t_message == ""){
                return;
            }
            msg.chatMessage(t_message);
            $(".input.chat").val("");
            e.preventDefault();
        }
    });

    appendMsg("mpv window handle", remote.getGlobal("mpvWindow"));

    msg.on("created_session", function(message) {
        appendMsg("session key", message["session_key"]);
        appendMsg("your nick", message["nick"]);
    });

    msg.on("user_joined", function(message) {
        if (message["nick"] == currentNick){
            appendMsg("session key", currentSessionKey);
            appendMsg("your nick", message["nick"]);
            switchToMainUi();
            return;
        }
        appendMsg("user joined", message["nick"]);
    });

    msg.on("user_left", function(message) {
        appendMsg("user left", message["nick"]);
    });

    msg.on("message", function(message) {
        appendMsg(message["nick"], message["message"]);
    });

    msg.on("error", function(message) {
        console.log(JSON.stringify(message));

        switch (message["error_type"]){
            case "invalid_session_key":
                sessionKeyModal("that session key was invalid");
                break;
            case "not_json":
            case "no_type":
            case "invalid_type":
            case "missing_key":
            default:
                //never should happen
                appendMsg("error", message["error"]);
                break;
        }
    });
});

const Messaging = require("./websockets.js");
const msg = new Messaging();
msg.connect();
