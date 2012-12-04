var highlight = "";
$(document).ready(function(){



  $('#msg').focus(function() {
    //console.log("focus on msg : "+targetUser+":"+room);
    $.ajax({
      url: jzChatUpdateUnreadMessages,
      data: {"room": room,
              "user": username,
              "sessionId": sessionId
            },

      success:function(response){
        //console.log("success");
      },

      error:function (xhr, status, error){

      }

    });

  });

  $('#msg').keydown(function(event) {
    if ( event.which == 18 ) {
      keydown = 18;
    }
  });

  $('#msg').keyup(function(event) {
    var msg = $(this).attr("value");
    // console.log(event.which + " ;"+msg.length+";");
    if ( event.which == 13 && keydown !== 18 && msg.length>1) {
      //console.log("sendMsg=>"+username + " : " + room + " : "+msg);
      if(!msg)
      {
        return;
      }
      var im = messages.length;
      messages[im] = {"user": username,
                      "fullname": "You",
                      "date": "pending",
                      "message": msg};
      showMessages();
      document.getElementById("msg").value = '';

      $.ajax({
        url: jzChatSend,
        data: {"user": username,
               "targetUser": targetUser,
               "room": room,
               "message": msg,
               "sessionId": sessionId
              },

        success:function(response){
          //console.log("success");
          refreshChat();
        },

        error:function (xhr, status, error){

        }

      });
    }
    if ( event.which == 13 && keydown == 18 ) {
      keydown = -1;
    }
    if ( event.which == 13 && msg.length == 1) {
      document.getElementById("msg").value = '';
    }


  });

  $(".chatstatus-chat").on("click", function() {
    if ($(".chatStatusPanel").css("display")==="none")
      $(".chatStatusPanel").css("display", "inline-block");
    else
      $(".chatStatusPanel").css("display", "none");
  });

  $("div.chatMenu").click(function(){
    var status = $(this).attr("status");
    console.log("setStatus :: "+status);

    $.ajax({
      url: jzSetStatus,
      data: { "user": username,
              "sessionId": sessionId,
              "status": status
              },

      success: function(response){
        console.log("SUCCESS:setStatus::"+response);
        changeStatusChat(response);
        $(".chatStatusPanel").css('display', 'none');
      },
      error: function(response){
        changeStatusChat("offline");
      }

    });

  });

  $(".msgEmoticons").on("click", function() {
    if ($(".msgEmoticonsPanel").css("display")==="none")
      $(".msgEmoticonsPanel").css("display", "inline-block");
    else
      $(".msgEmoticonsPanel").css("display", "none");
  });

  $(".smileyBtn").on("click", function() {
    var sml = $(this).attr("data");
    $(".msgEmoticonsPanel").css("display", "none");
    var val = $('#msg').val();
    if (val.charAt(val.length-1)!==' ') val +=" ";
    val += sml + " ";
    $('#msg').val(val);
  });

  $(".msgHelp").on("click", function() {
    $(".chatHelpPanel").css("display", "block");
  });

  $(".chatHelpPanel").on("click", function() {
    $(".chatHelpPanel").css("display", "none");
  });

  $(".filter").on("click", function() {
    var child = $("span:first",this);
    if (child.hasClass("filter-on")) {
      child.removeClass("filter-on").addClass("filter-off");
      if ($(this).hasClass("filter-user")) {
        $(".filter-space span:first-child").removeClass("filter-off").addClass("filter-on");
      } else {
        $(".filter-user span:first-child").removeClass("filter-off").addClass("filter-on");
      }
    } else {
      child.removeClass("filter-off").addClass("filter-on");
    }
    refreshWhoIsOnline();
  });

  $('#chatSearch').keyup(function(event) {
    var filter = $(this).attr("value");
    if (filter == ":aboutme" || filter == ":about me") {
      $('.chatAboutPanel').css("display", "block");
    }
    if (filter.indexOf(":")===-1) {
      userFilter = filter;
      filterInt = clearTimeout(filterInt);
      filterInt = setTimeout(refreshWhoIsOnline, 500);
    } else {
      highlight = filter.substr(1, filter.length-1);
      showMessages();
    }
  });

  chatOnlineInt = clearInterval(chatOnlineInt);
  chatOnlineInt = setInterval(refreshWhoIsOnline, 3000);
  refreshWhoIsOnline();

  setTimeout(showSyncPanel, 1000);

  function strip(html)
  {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent||tmp.innerText;
  }



  function initChatProfile() {
    $.ajax({
      url: jzInitChatProfile,
      success: function(response){
        console.log("Chat Profile Update : "+response);

        notifStatusInt = window.clearInterval(notifStatusInt);
        notifStatusInt = setInterval(refreshStatusChat, 60000);
        refreshStatusChat();

      },
      error: function(response){
        //retry in 3 sec
        setTimeout(initChatProfile, 3000);
      }
    });
  }
  initChatProfile();

  function maintainSession() {
    $.ajax({
      url: jzMaintainSession,
      success: function(response){
        console.log("Chat Session Maintained : "+response);
      },
      error: function(response){
        chatSessionInt = clearInterval(chatSessionInt);
      }
    });
  }

  if (window.fluid!==undefined) {
    chatSessionInt = clearInterval(chatSessionInt);
    chatSessionInt = setInterval(maintainSession, 60000);
  }



});

function showSyncPanel() {
  if (!isLoaded)
    $(".chatSyncPanel").css("display", "block");
}

var totalNotif = 0;
var oldNotif = 0;

function refreshWhoIsOnline() {
  var withSpaces = $(".filter-space span:first-child").hasClass("filter-on");
  var withUsers = $(".filter-user span:first-child").hasClass("filter-on");
  $('#whoisonline').load(jzChatWhoIsOnline, {"user": username, "sessionId": sessionId,
    "filter": userFilter, "withSpaces": withSpaces, "withUsers": withUsers}, function (response, status, xhr) {
    isLoaded = true;
    $(".chatSyncPanel").css("display", "none");
    $(".leftchat").css("display", "block");
    if (status == "error") {
      $("#whoisonline").html("");
      $(".chatErrorPanel").css("display", "block");
      $(".chatLoginPanel").css("display", "none");
    } else {
      $(".chatErrorPanel").css("display", "none");

      if (window.fluid!==undefined) {
        totalNotif = 0;
        $('span.room-total').each(function(index) {
          totalNotif = parseInt(totalNotif,10) + parseInt($(this).attr("data"),10);
          window.fluid.dockBadge = totalNotif;
        });
        if (totalNotif>oldNotif && profileStatus !== "donotdisturb" && profileStatus !== "offline") {
          window.fluid.showGrowlNotification({
              title: "eXo Chat",
              description: "You have new messages",
              priority: 1,
              sticky: false,
              identifier: "messages"
          });
        }
        oldNotif = totalNotif;
      }
    }
  });
}

function setStatus(status) {
  $.ajax({
    url: "http://localhost:8888/chatServer/setStatus",
    data: { "user": username,
            "sessionId": sessionId,
            "status": status
            },

    success: function(response){
      console.log("SUCCESS:setStatus::"+response);
      changeStatusChat(status);
    },
    error: function(response){
    }

  });

}

function setStatusAvailable() {
  setStatus("available");
}

function setStatusAway() {
  setStatus("away");
}

function setStatusDoNotDisturb() {
  setStatus("donotdisturb");
}

function setStatusInvisible() {
  setStatus("invisible");
}

function initFluidApp() {
  if (window.fluid!==undefined) {
    window.fluid.addDockMenuItem("Available", setStatusAvailable);
    window.fluid.addDockMenuItem("Away", setStatusAway);
    window.fluid.addDockMenuItem("Do not disturb", setStatusDoNotDisturb);
    window.fluid.addDockMenuItem("Invisible", setStatusInvisible);
  }
  
  
}
initFluidApp();


function refreshStatusChat() {
  $.ajax({
    url: jzGetStatus,
    data: {
      "user": username,
      "sessionId": sessionId
    },
    success: function(response){
      changeStatusChat(response);
    },
    error: function(response){
      changeStatusChat("offline");
    }
  });
}


function changeStatusChat(status) {
  profileStatus = status;

  $("span.chatstatus").removeClass("chatstatus-available-black");
  $("span.chatstatus").removeClass("chatstatus-donotdisturb-black");
  $("span.chatstatus").removeClass("chatstatus-invisible-black");
  $("span.chatstatus").removeClass("chatstatus-away-black");
  $("span.chatstatus").removeClass("chatstatus-offline-black");
  $("span.chatstatus").addClass("chatstatus-"+status+"-black");

  $("span.chatstatus-chat").removeClass("chatstatus-available");
  $("span.chatstatus-chat").removeClass("chatstatus-donotdisturb");
  $("span.chatstatus-chat").removeClass("chatstatus-invisible");
  $("span.chatstatus-chat").removeClass("chatstatus-away");
  $("span.chatstatus-chat").removeClass("chatstatus-offline");
  $("span.chatstatus-chat").addClass("chatstatus-"+status);

}

function showMessages(msgs) {
  var im, message, out="", prevUser="";
  if (msgs!==undefined) {
    messages = msgs;
  }

  if (messages.length===0) {
    out = "<div class='msgln' style='padding:22px 20px;'>";
    out += "<b><center>No messages yet.</center></b>";
    out += "</div>";
  } else {
    for (im=0 ; im<messages.length ; im++) {
      message = messages[im];

      if (prevUser != message.user)
      {
        if (prevUser !== "")
          out += "</span></div>";
        if (message.user != username) {
          out += "<div class='msgln-odd'>";
          out += "<span style='position:relative; padding-right:9px;top:8px'>";
          out += "<img onerror=\"this.src='/chat/img/Avatar.gif;'\" src='/rest/jcr/repository/social/production/soc:providers/soc:organization/soc:"+message.user+"/soc:profile/soc:avatar' width='30px'>";
          out += "</span>";
          out += "<span>";
        } else {
          out += "<div class='msgln'>";
          out += "<span style='margin-left:40px;'>";
          //out += "<span style='float:left; '>&nbsp;</span>";
        }
        out += "<b><span class='invisibleText'>- </span><a href='/portal/intranet/profile/"+message.user+"' class='userLink' target='_new'>"+message.fullname+"</a><span class='invisibleText'> : </span>";
        out += "</b><br/>";
      }
      else
      {
        out += "<hr style='margin:0px;'>";
      }
      out += "<div style='margin-left:40px;'><span style='float:left'>"+messageBeautifier(message.message)+"</span>" +
              "<span class='invisibleText'> [</span>"+
              "<span style='float:right;color:#CCC;font-size:10px'>"+message.date+"</span>" +
              "<span class='invisibleText'>]</span></div>"+
              "<div style='clear:both;'></div>";
      prevUser = message.user;
    }
  }
  $("#chats").html('<span>'+out+'</span>');
  sh_highlightDocument();
  $("#chats").animate({ scrollTop: 20000 }, 'fast');

}

function refreshChat() {
    $.getJSON(chatEventURL, function(data) {
      var lastTS = jzGetParam("lastTS");
      //console.log("chatEvent :: lastTS="+lastTS+" :: serverTS="+data.timestamp);
      var im, message, out="", prevUser="";
      if (data.messages.length===0) {
        showMessages(data.messages);
      } else {
        var ts = data.timestamp;
        if (ts != lastTS) {
          jzStoreParam("lastTS", ts, 600);
          //console.log("new data to show");
          showMessages(data.messages);
        }
      }
      $(".rightchat").css("display", "block");
      $(".chatLoginPanel").css("display", "none");
    })
    .error(function() {
      $(".rightchat").css("display", "none");
      if ( $(".chatErrorPanel").css("display") == "none") {
        $(".chatLoginPanel").css("display", "block");
      } else {
        $(".chatLoginPanel").css("display", "none");
      }
    });

}


function toggleFavorite(targetFav) {
  console.log("FAVORITE::"+targetFav);
  $.ajax({
    url: jzChatToggleFavorite,
    data: {"targetUser": targetFav,
            "user": username,
            "sessionId": sessionId
            },
    success: function(response){
      refreshWhoIsOnline();
    },
    error: function(xhr, status, error){
    }
  });
}

function loadRoom() {
  console.log("TARGET::"+targetUser);
  $(".users-online").removeClass("info");
  $("#users-online-"+targetUser).addClass("info");

  $.ajax({
    url: jzChatGetRoom,
    data: {"targetUser": targetUser,
            "user": username,
            "sessionId": sessionId
            },

    success: function(response){
      console.log("SUCCESS::getRoom::"+response);
      room = response;
      $('#msg').removeAttr("disabled");
      chatEventURL = jzChatSend+'?room='+room+'&user='+username+'&sessionId='+sessionId+'&event=0';

      jzStoreParam("lastUser", targetUser, 60000);
      jzStoreParam("lastTS", "0");
      chatEventInt = window.clearInterval(chatEventInt);
      chatEventInt = setInterval(refreshChat, 3000);
      refreshChat();

    },

    error: function(xhr, status, error){
      console.log("ERROR::"+xhr.responseText);
    }

  });

}



function closeAbout() {
  $('.chatAboutPanel').css("display", "none");
}


function reloadWindow() {
  var sURL = unescape(window.location.href);
  //console.log(sURL);
  window.location.href = sURL;
  //window.location.reload( false );
}

// We change the current history by removing get parameters so they won't be visible in the popup
// Having a location bar with ?noadminbar=true is not User Friendly ;-)
function removeParametersFromLocation() {
  var sURL = window.location.href;
  if (sURL.indexOf("?")>-1) {
    sURL = sURL.substring(0,sURL.indexOf("?"));
    window.history.replaceState("#", "Chat", sURL);
  }
}

//removeParametersFromLocation();

function messageBeautifier(message) {
  var msg = "";
  if (message.indexOf("java:")===0) {
    msg = "<div class='sh_container '><pre class='sh_java'>"+message.substr(5, message.length-6)+"</pre></div>";
    return msg;
  } else if (message.indexOf("html:")===0) {
    msg = "<div class='sh_container '><pre class='sh_html'>"+message.substr(5, message.length-6)+"</pre></div>";
    return msg;
  } else if (message.indexOf("js:")===0) {
    msg = "<div class='sh_container '><pre class='sh_javascript'>"+message.substr(3, message.length-4)+"</pre></div>";
    return msg;
  } else if (message.indexOf("css:")===0) {
    msg = "<div class='sh_container '><pre class='sh_css'>"+message.substr(4, message.length-5)+"</pre></div>";
    return msg;
  }


  var lines = message.split("<br/>");
  var il,l;
  for (il=0 ; il<lines.length ; il++) {
    l = lines[il];
    if (l.indexOf("google:")===0) {
      // console.log("*"+l+"* "+l.length);
      msg += "google:<a href='http://www.google.com/search?q="+l.substr(7, l.length-7)+"' target='_new'>"+l.substr(7, l.length-7)+"</a> ";
    } else if (l.indexOf("wolfram:")===0) {
      // console.log("*"+l+"* "+l.length);
      msg += "wolfram:<a href='http://www.wolframalpha.com/input/?i="+l.substr(8, l.length-8)+"' target='_new'>"+l.substr(8, l.length-8)+"</a> ";
    } else {
      var tab = l.split(" ");
      var it,w;
      for (it=0 ; it<tab.length ; it++) {
        w = tab[it];
        if (w.indexOf("google:")===0) {
          w = "google:<a href='http://www.google.com/search?q="+w.substr(7, w.length-7)+"' target='_new'>"+w.substr(7, w.length-7)+"</a>";
        } else if (w.indexOf("wolfram:")===0) {
          w = "wolfram:<a href='http://www.wolframalpha.com/input/?i="+w.substr(8, w.length-8)+"' target='_new'>"+w.substr(8, w.length-8)+"</a>";
        } else if (w.indexOf("/")>-1 && w.indexOf("&lt;/")===-1 && w.indexOf("/&gt;")===-1) {
          w = "<a href='"+w+"' target='_new'>"+w+"</a>";
        } else if (w == ":-)" || w==":)") {
          w = "<span class='smiley smileySmile'><span class='smileyText'>:)</span></span>";
        } else if (w == ":-D" || w==":D") {
          w = "<span class='smiley smileyBigSmile'><span class='smileyText'>:D</span></span>";
        } else if (w == ":-|" || w==":|") {
          w = "<span class='smiley smileyNoVoice'><span class='smileyText'>:|</span></span>";
        } else if (w == ":-(" || w==":(") {
          w = "<span class='smiley smileySad'><span class='smileyText'>:(</span></span>";
        } else if (w == ";-)" || w==";)") {
          w = "<span class='smiley smileyEyeBlink'><span class='smileyText'>;)</span></span>";
        } else if (w == ":-O" || w==":O") {
          w = "<span class='smiley smileySurprise'><span class='smileyText'>:O</span></span>";
        } else if (highlight.length >1) {
          w = w.replace(eval("/"+highlight+"/g"), "<span style='background-color:#FF0;font-weight:bold;'>"+highlight+"</span>");
        }
        msg += w+" ";
      }
    }
    // console.log(il + "::" + lines.length);
    if (il < lines.length-1) {
      msg += "<br/>";
    }
  }

  // if (highlight.length >2) {
  //   msg = msg.replace(eval("/"+highlight+"/g"), "<span style='background-color:#FF0;font-weight:bold;'>"+highlight+"</span>");
  // }

  return msg;
}