var channel = "";
var loaded = false;
var current_index = 0;

$(document).ready(function() {
    channel = window.location.pathname.split("/")[2];

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
                    $("#videos").prepend('<div class="video" id="'+resp.vid+'"><img src="http://img.youtube.com/vi/'+resp.vid+'/1.jpg"/><img class="delete" src="/img/delete.png" />');
                    attachClicks();
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
    });
});

displayVideos = function( vids ) {
    for( var i = 0,len = vids.length; i < len; i++ ) {
        $("#videos").append('<div class="video" id="'+vids[i]+'"><img class="thumb" src="http://img.youtube.com/vi/'+vids[i]+'/1.jpg"/><img class="delete" src="/img/delete.png" />');
    }
    if( vids.length > 0 ) {
        attachClicks();
        playNextVideo();
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

        switchVideo( $(this).attr("id") );
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
    var atts = { id: "video_container" };
    swfobject.embedSWF( "http://www.youtube.com/v/"+vid+"?enablejsapi=1&playerapiid=ytplayer&version=3&controls=0", "video_container", "320", "240", "9", null, null, params, atts );
    
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
    if( !$(".playing").length || !$(".playing").next().length ) {
        var vid = $(".video:eq(0)").attr("id");
        switchVideo( vid );
    } else {
        switchVideo( $(".playing").next().attr("id") );
    }
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
    ytplayer = document.getElementById( "video_container" );
    ytplayer.addEventListener("onStateChange", "onytplayerStateChange");
    ytplayer.addEventListener("onError", "onytplayerError");

    ytplayer.playVideo();
}