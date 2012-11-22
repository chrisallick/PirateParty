var channel = "";
var loaded = false;
var current_index = 0;
var trashio;
var fullscreen = false;

$(document).ready(function() {
    channel = window.location.pathname.split("/")[2];

    trashio = new TrashIO(this,channel);

    $("#newvid").submit(function(event){
        event.preventDefault();

        if( $("#url").val() != "" ) {
            $.ajax({
                type: "POST",
                url: "/addvid",
                dataType: "json",
                data: {
                    "channel": channel,
                    url: $("#url").val()
                }
            }).done(function( resp ) {
                if( resp && resp["result"] == "success" ) {
                    //$("#videos").prepend('<div class="video" id="'+resp.vid+'"><img src="http://img.youtube.com/vi/'+resp.vid+'/1.jpg"/><img class="delete" src="/img/delete.png" />');
                    //attachClicks();
                    var msg = trashio.createMessage( "add", resp.vid );
                    trashio.sendMessage( msg );
                }
            });
        }
    });

    $.ajax({
        type: "GET",
        url: "/vids",
        dataType: "json",
        data: {
            "channel": channel
        }
    }).done(function(resp){
        if( resp && resp.vids ) {
            displayVideos( resp.vids );
        }
    });

    $("#letsdothis a").click(function(event){
        event.preventDefault();
        var msg = trashio.createMessage("startParty", "true");
        trashio.sendMessage( msg );
    });
});

startParty = function() {
    fullscreen = true;

    $("#letsdothis").css("z-index","1");
    $("#videos").css("z-index","1");
    $("#videos .thumb").css("z-index","1");
    $("#newvid").css("z-index","1");

    playNextVideo();
}

addVideo = function( vid ) {
    $("#videos").append('<div class="video" id="'+vid+'"><img src="http://img.youtube.com/vi/'+vid+'/1.jpg"/><img class="delete" src="/img/delete.png" />');
    attachClicks();
}

displayVideos = function( vids ) {
    for( var i = 0,len = vids.length; i < len; i++ ) {
        $("#videos").append('<div class="video" id="'+vids[i]+'"><img class="thumb" src="http://img.youtube.com/vi/'+vids[i]+'/1.jpg"/><img class="delete" src="/img/delete.png" />');
    }
    if( vids.length > 0 ) {
        attachClicks();
        //playNextVideo();
    }
}

deleteVideo = function( vid ) {
    $.ajax({
        type: "POST",
        url: "/deletevid",
        dataType: "json",
        data: {
            "channel": channel,
            "vid": vid
        }
    }).done(function( resp ) {
        if( resp && resp["result"] == "success" ) {
            $("#"+vid).remove();
        }
    });
}

attachClicks = function() {
    $(".video").unbind().bind("click", function(event) {
        event.stopPropagation();

        //switchVideo( $(this).attr("id") );
        var msg = trashio.createMessage("play", $(this).attr("id") );
        trashio.sendMessage(msg);
    });

    $(".delete").unbind().bind("click", function(event) {
        event.stopPropagation()

        deleteVideo( $(this).parent().attr("id") );
    });

    if( $(".video").length == 1 ) {
        playNextVideo();
    }
}

switchVideo = function( vid ) {
    // pop playing and set new playing
    $(".playing").removeClass("playing");
    $("#"+vid).addClass("playing");

    // embed vid
    var params = { allowScriptAccess: "always", wmode: "transparent" };
    if( fullscreen ) {
        var atts = { id: "video_container_fs" };
        swfobject.embedSWF( "http://www.youtube.com/v/"+vid+"?enablejsapi=1&playerapiid=ytplayer&version=3&controls=0", "video_container_fs", "100%", "100%", "9", null, null, params, atts );
    } else {
        var atts = { id: "video_container" };
        swfobject.embedSWF( "http://www.youtube.com/v/"+vid+"?enablejsapi=1&playerapiid=ytplayer&version=3&controls=0", "video_container", "320", "240", "9", null, null, params, atts );
    }
    

    
    var playing_index = $(".playing").index();

    // slide left index times width of first video
    var dist = "-" + (playing_index * $('#videos .video:first').width()) + "px";

    // update play index
    current_index = playing_index;
}

playNextVideo = function() {
    // if we have never played this playlist before, play it from the start
    // if there is not a next item to play, play it from the start
    // else play the next video
    var vid;
    if( !$(".playing").length || !$(".playing").next().length ) {
        vid = $(".video:eq(0)").attr("id");
        //switchVideo( vid );
    } else {
        //switchVideo( $(".playing").next().attr("id") );
        vid = $(".playing").next().attr("id");
    }
    var msg = trashio.createMessage("play", vid);
    trashio.sendMessage( msg );
}

function onytplayerStateChange(newState) {
    if( newState == 0 ) {
        playNextVideo();
    }
}

// on error just go to next vid
function onytplayerError(error) {
    playNextVideo()
}

onYouTubePlayerReady = function( playerId ) {
    if( fullscreen ) {
        ytplayer = document.getElementById( "video_container_fs" );
    } else {
        ytplayer = document.getElementById( "video_container" );    
    }
    ytplayer.addEventListener("onStateChange", "onytplayerStateChange");
    ytplayer.addEventListener("onError", "onytplayerError");

    ytplayer.playVideo();

    if( fullscreen ) {
        $("#video_container_fs").css("height","110%");
    }
}