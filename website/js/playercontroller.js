/*! 
    quirli, replay with ease.
    Copyright (C) 2012-2018 by marcel suter, marcel@codeministry.ch

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*!
 * Controller for the player, using AngularJS.
 */
var playerController = function ($scope, $location) {

    globalScope = $scope; //TODO to give easy access, but later rework to fit the angular style

    //---Track adder field which are used when a new track is added
    $scope.ArtistName = "";
    $scope.AlbumName = "";
    $scope.TrackTitle = "";

    $scope.cues = [];
    $scope.MediaUrl = "";
    $scope.PlaybackType = ""; //type of playback of the player: flash, native, silverlight or empty if no media loaded. Thus, this property can also be used to check whether a media was loaded by the player
    $scope.ViewStyle = "edit"; //can change to play later, but this is the default.
    $scope.IsMediaLoaded = false;
    
    //adds a new cue without denoting as the newest one
    $scope.addCue = function () {
        $scope.cues.push({ text: $scope.text, position: $scope.position, recycle: false, isNewest: false, shortcut: $scope.shortcut }); 

        $scope.postAddTask();
    };

    //adds a new cue with this one denoting as the newest one
    $scope.addCueAsNewest = function () {
        //first make all non-newest
        angular.forEach($scope.cues, function (cue) {
            cue.isNewest = false;
        });

        //add this one as the newest
        $scope.cues.push({ text: $scope.text, position: $scope.position, recycle: false, isNewest: true, shortcut: $scope.shortcut }); 

        $scope.postAddTask();
    };

    //doest the stuff after adding a cue
    $scope.postAddTask = function () {
        $scope.cues.sort(function (a, b) {
            return a.position - b.position //order by position in time
        });

        //clean up the container variables for reuse
        $scope.text = '';
        $scope.position = '';
        $scope.shortcut = '';
    };

    //removes any recycled cue from the cues collection
    //as there is no "remove" in JavaScript for array, implemented by rebuilding the cues collection
    $scope.archive = function () {
        var oldcues = $scope.cues;
        $scope.cues = [];
        angular.forEach(oldcues, function (cue) {
            if (!cue.recycle) $scope.cues.push(cue);
        });
    };

    $scope.recycle = function (cue) {
        cue.recycle = true;
        $scope.archive(); //immediately for this cue
    }

    //Seeks the currently loaded media to the given position
    //This uses the global do actions.
    $scope.playFromPosition = function (position) {
        if (quirliControlType === "youtube") {
            $scope.doSeekTo(position); //invoke global doSeekTo method as defined for the media players
            $scope.doPlay(); //for youtube, playing must start after seeking.
        }
        else {
            $scope.doPlay(); //playing first seems necessary to make this work after a load of a new file in all other cases than youtube. Seeking and then playing will not work in this case.
            $scope.doSeekTo(position); //invoke global doSeekTo method as defined for the media players
        }
    }

    $scope.setViewStyle = function (style) {
        $scope.ViewStyle = style;
    }


    //creates an url of the current page, with parameters describing the media and cues
    //and presents that in a textbox for copying by the user
    $scope.SaveAsLink = function () {
        var cues = [];
        $.each($scope.cues, function (index, item) {
            var cue = item.position + "=" + encodeURIComponent(item.text) ;
            if (item.shortcut)
            { 
                cue = cue + "--" + encodeURIComponent(item.shortcut);
            }
            cues.push(cue);
        });
        var serializedCues = cues.join('&');

        //serialize the media file url
        var pageUrlWithoutQuery = $location.absUrl().split('?')[0]; //get the url without the (probably already existing) query part
        pageUrl = pageUrlWithoutQuery.split('#')[0]; //get the url without the (probably already existing) fragment part

        //provide the link url
        var linkUrl = pageUrl + "?media=" + encodeURIComponent($scope.MediaUrl) +
            "&title=" + encodeURIComponent($scope.TrackTitle) +
            "&artist=" + encodeURIComponent($scope.ArtistName) +
            "&album=" + encodeURIComponent($scope.AlbumName) +
            "&" + serializedCues;
        //Provide as model property
        $scope.TrackShareUrl = linkUrl;
    }

    //loads the content of the specified url into a new, matching media player
    //later, instead of interpreting the url, actually request the file
    $scope.loadMediaUrl = function () {
        var objectURL = $scope.MediaUrl;
        if ((objectURL === null) || (objectURL === '')) {
            return false; //nothing to load at all
        }
        //TODO later check the existence of the referenced file first, to create a better user experience
        $scope.RemoveErrors();

        //determine media type and handle accordingly
        if (objectURL.substr(objectURL.length - 4) === ".wav") {
            createPlayerAndLoadSource(objectURL, "audio");
        } else if (objectURL.substr(objectURL.length - 4) === ".mp3") {
            createPlayerAndLoadSource(objectURL, "audio");
        } else if (objectURL.substr(objectURL.length - 4) === ".ogv") {
            createPlayerAndLoadSource(objectURL, "video");
        } else if (objectURL.substr(objectURL.length - 4) === ".wmv") {
            createPlayerAndLoadSource(objectURL, "video");
        } else if (objectURL.substr(objectURL.length - 5) === ".webm") {
            createPlayerAndLoadSource(objectURL, "video");
        } else if (objectURL.substr(objectURL.length - 4) === ".mp4") {
            createPlayerAndLoadSource(objectURL, "video");
        } else { //we dont know or it is from a content provider like youtube or vimeo: Just assume video, because video generally also can play audio
            createPlayerAndLoadSource(objectURL, "video");
        }
    }
    
    //Displays an error text in the error area
    $scope.DisplayError = function (errortext) {
        $scope.ErrorMessage = errortext;
    }

    //Removes any previously displayed error
    $scope.RemoveErrors = function () {
        $scope.ErrorMessage = null;
    }

    //preload this scope from the url query when available
    $scope.location = $location;
    parseQueryParameter($scope);
}

//Register controller with module
quirliApp.controller("playerController", playerController);

//TODO move into the controller
//parses the query parameter and preloads the model with it's data
function parseQueryParameter($scope) {
    //TODO later use the $location from the scope to get the url, to comply with angular style
    var windowUrl = window.location.href;
    url = windowUrl.split('#')[0]; //get the url without the (probably existing) fragment part

    //Load track from parameters		
    var mediaUrl = decodeURIComponent(gup(url, 'media'));
    if (mediaUrl) { //there is any?
        $scope.MediaUrl = mediaUrl;
    }
    var trackTitle = decodeURIComponent(gup(url, 'title'));
    if (trackTitle) { //there is any?
        $scope.TrackTitle = trackTitle;
    }
    var artistName = decodeURIComponent(gup(url, 'artist'));
    if (artistName) { //there is any?
        $scope.ArtistName = artistName;
    }
    var albumName = decodeURIComponent(gup(url, 'album'));
    if (albumName) { //there is any?
        $scope.AlbumName = albumName;
    }

    //now find the cues
    //get the entries
    var query = url.substring(url.indexOf('?') + 1, url.length)
    var entries = query.split('&');
    var anyCuesFound = false;
    //translate the entries to cues
    $.each(entries, function (index, item) {
        var entryParts = item.split('='); //separate key and value	
        var key = entryParts[0];
        var value = entryParts[1];
        if (isNumber(key)) {
            anyCuesFound = true;
            $scope.position = parseFloat(key);
            //parse the text and shortcut (if available)
            var text = decodeURIComponent(value);
            var textComponent = text.split('--');
            $scope.text = textComponent[0];
            $scope.shortcut = textComponent[1];
            $scope.addCue();
        } //otherwise leave that entry out     			
    });

    //determine which style to show
    if (anyCuesFound) {
        $scope.ViewStyle = "play"; //to allow easy replay
    }
    else {
        $scope.ViewStyle = "edit"; //to encourage adding cues
    }
    $scope.loadMediaUrl(mediaUrl); //TODO later decouple this presenter method from here and use a watch with comparing to the current value to avoid flickering on textbox blur
}

//---Helpers

//Parses the current URL and returns the value for the specified parameter specified.
//It does this using javascript's built in regular expressions.
//Taken from http://www.netlobo.com/url_query_string_javascript.html 
function gup(url, name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    if (results == null)
        return "";
    else
        return results[1];
}


//tests whether the argument is a number
//taken from http://stackoverflow.com/a/1421988/79485
function isNumber(item) {
    return !isNaN(item - 0) && item != null && item != "";
}
