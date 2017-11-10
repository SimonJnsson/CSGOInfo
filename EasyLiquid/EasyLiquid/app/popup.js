document.addEventListener("DOMContentLoaded", function()
{
    var DEFAULT_TIMEBEFOREMATCH = 15;
    $('.settingsInput').focus(function()
    {
        $(this).parent().addClass('active');
        $(this).attr('placeholder', '');
    });

    $('.settingsInput').blur(function()
    {
        if ($(this).val() == "")
            $(this).parent().removeClass('active');

        $(this).attr('placeholder', $(this).parent().find('.settingsText').text());
    });

    chrome.storage.sync.get(function(item)
    {
        if (item.timeBeforeMatch != undefined && item.timeBeforeMatch != "")
        {
            $('.timeBeforeMatch').val(item.timeBeforeMatch);
            $('.timeBeforeMatch').parent().addClass('active');
        }
        else if (item.timeBeforeMatch == "")
        {
            $('.timeBeforeMatch').val(DEFAULT_TIMEBEFOREMATCH);
            $('.timeBeforeMatch').parent().addClass('active');
        }
    });

    $('.timeBeforeMatch').change(function()
    {
        var that = $(this);
        chrome.storage.sync.set({
            "timeBeforeMatch": that.val()
        });
    });

    var originalColor = $(".button").css("background-color");
    var originalBorder = $(".button").css("border");

    $(".button").on("click", function() // Change styling when a tab button is clicked
    {
        $(".button").css("background-color", originalColor);
        $(".button").css("border", originalBorder);
        $(this).css("background-color", "#2c3e50");
        $(this).css("border-bottom", "2px solid #2c3e50");
        $(".tab").hide();
        $("#tab" + $(this).attr("alt")).show();
    });

    $("#button1").click(); // Start the extension in the 'tournaments' tab

    var arrow = "img/arrow.png";

    var NAME_MAXLENGTH = 36;

    tournaments = [];
    var tournamentUrl = "https://api.toornament.com/v1/tournaments";

    currDate = new Date();
    var tournamentEndAfter = (currDate.getFullYear() + '-'
        + ('0' + (currDate.getMonth() + 1)).slice(-2) + '-'
        + ('0' + (currDate.getDate() + 1)).slice(-2));

    // Get Tournaments
    // API Reference https://developer.toornament.com/doc/tournaments/counterstrike_go
    $.ajax({
        type: "GET",
        url: tournamentUrl,
        headers: { "X-Api-Key": "Q6Hu41MTYzjED8a0hNr7x6sSDEc-eUVQvo6qmv4ckp8" },
        data: {
            "discipline": "counterstrike_go",
            "featured": "1",
            "sort": "date_asc",
            "after_end": tournamentEndAfter

        },
        success: function(response)
        {
            tournaments = response;

            $.each(tournaments, function(index, obj)
            {
                var tournamentName = obj.full_name;
                tournamentName == null ? tournamentName = obj.name : tournamentName = obj.full_name;

                if (tournamentName.length > NAME_MAXLENGTH) // Limit the length of tournament name
                    tournamentName = tournamentName.substring(0, NAME_MAXLENGTH);

                var rawStartdate = new Date(obj.date_start); // Cast the start date to a new 'Date'
                var startDate = rawStartdate.getDate() + "/" + (rawStartdate.getMonth() + 1) + "/" + rawStartdate.getFullYear(); // Format the newly created 'Date'
                var rawEndDate = new Date(obj.date_end);
                var endDate = rawEndDate.getDate() + "/" + (rawEndDate.getMonth() + 1) + "/" + rawEndDate.getFullYear();
                var tournamentDate = startDate + " - " + endDate; // Combine start and end dates
                var tournamentLocation = obj.country != null ? obj.country.toLowerCase() : "Unknown";

                var tournamentId = obj.id;

                var teamCount = obj.size;

                // String for creating a 'tournament' element
                var tournament = '<div class="tournament" id=' + tournamentId + '>' +
                    '<div class="tournamentInfo">' +
                    '<img class="tournamentLogo" src="' + obj.logo.logo_small + '"/>' +
                    '<img class="arrow" src="' + arrow + '"/>' +
                    '<p class="tournamentName">' + tournamentName + '</p>' +
                    '<p class="tournamentDate">' + tournamentDate + '</p>';

                tournamentLocation != "" ? tournament += '<img class="infoIcon" src="img/flags/' + tournamentLocation + '.png" />' : "";

                switch (obj.status)
                {
                    case "setup":
                        tournament += '<div style="background-color:#f1c40f;" class="status"></div>';
                        break;
                    case "running":
                        tournament += '<div style="background-color:#27ae60;" class="status"></div>';
                        break;
                    case "completed":
                        tournament += '<div style="background-color:#c0392b;" class="status"></div>';
                        break;
                    default:
                        break;
                }

                tournament += '<img style="height:11px;width:auto;margin-right:0" src="img/teamIcon.png" /><p style="display: inline;margin-right: 5px;">' + obj.size + '</p>';

                obj.online == 1 ? tournament += '<img class="infoIcon" src="img/globe.png" />' : "";

                tournament += '</div>' +
                    '<div class="dropdown hidden">' +
                    '<br>' +
                    '</div>' +
                    '</div>';
                $('.tournamentArea').append(tournament);

                var participantUrl = "https://api.toornament.com/v1/tournaments/" + tournamentId + "/participants";
                var participants = [];

                // Get tournament participant info
                // API Reference https://developer.toornament.com/doc/participants/counterstrike_go#get:tournaments:tournament_id:participants
                $.ajax({
                    type: "GET",
                    url: participantUrl,
                    headers: { "X-Api-Key": "Q6Hu41MTYzjED8a0hNr7x6sSDEc-eUVQvo6qmv4ckp8" },
                    data: {
                        "sort": "alphabetic"
                    },
                    success: function(response)
                    {
                        participants = response;

                        $.each(participants, function(index, obj)
                        {
                            var participantName = obj.name;

                            var participant = '<p class="participantName">' + participantName + '</p>';

                            $('#' + tournamentId).find('.dropdown').prepend(participant);
                        });
                    },
                    error: function(error)
                    {
                        //console.log("Error " + error.status + " - " + this.url);
                    }
                });

                var indiTournamentUrl = "https://api.toornament.com/v1/tournaments/" + tournamentId;

                // Get individual tournament info
                // API Reference https://developer.toornament.com/doc/tournaments/counterstrike_go#get:tournaments:id
                $.ajax({
                    type: "GET",
                    url: indiTournamentUrl,
                    headers: { "X-Api-Key": "Q6Hu41MTYzjED8a0hNr7x6sSDEc-eUVQvo6qmv4ckp8" },
                    success: function(response)
                    {
                        var tournementStreams = response.streams;
                        var tournamentStatus = response.status;
                        var tournementWebsite = response.website;
                        //console.log("Status: " + tournamentStatus);
                        console.log(response);
                        if (tournementWebsite != null && tournementWebsite !== 'undefined') // If the obj contains a website
                        {
                            $('#' + tournamentId).find('.tournamentLogo').attr('href', tournementWebsite); // Set the 'href' attribute on the tournament logo
                            $('#' + tournamentId).find('.tournamentLogo').on('click', function() // Create href
                            {
                                chrome.tabs.create({ url: $(this).attr('href') });
                                return false;
                            });
                        }

                        if (tournementStreams.length > 0) // If streams exist, create links to all available english streams
                        {
                            $.each(tournementStreams, function(index, obj)
                            {
                                if (obj.language === "en")
                                {
                                    var currGuid = guid(); // Create a guid for the new elements ID
                                    var streamLink = obj.url;
                                    var linkElement = '<a class="streamLink" id="' + currGuid + '" href="' + streamLink + '"><img src="img/twitchIcon.png"/></a>';

                                    $('#' + tournamentId).find('.dropdown').append(linkElement); // Append the link to the stream

                                    $('#' + currGuid).on('click', function() // Create link on new element
                                    {
                                        chrome.tabs.create({ url: $(this).attr('href') });
                                        return false;
                                    });
                                }
                            });
                        }
                        else
                            $('#' + tournamentId).find('.streamText').hide(); // If there is nothing to show, hide the element
                    },
                    error: function(error)
                    {
                        console.log("Error " + error.status + " - " + this.url);
                    }
                });
            });
        },
        error: function(error)
        {
            console.log("Error " + error.status + " - " + this.url);
        },
        complete: function()
        {
            $(".arrow").on('click', function() // When a tournament element is clicked
            {
                var target = $(this).closest('.tournamentInfo').parent();

                target.find('.dropdown').toggleClass("visible", 'hidden'); // Toggle classes on the dropdown to determine if is should be visible or not
                target.children().children('.arrow').toggleClass('rotated'); // Toggle classes to rotate arrow on click
                // If the dropdown will be below the screen whgen folded down
                if (target.offset().top + target.height() + $('#topBar').outerHeight() - $('body').scrollTop() > $('body').height() && target.find('.dropdown').hasClass('visible'))
                {
                    $('body').animate({
                            scrollTop: target.offset().top - $('#topBar').outerHeight() - target.height() / 2 // Smoothly scroll the element to the top of the screen
                        },
                        1000);
                }
            });

            $(".dropdown").on('click', function(e)
            {
                e.preventDefault();
            });
        }
    });

    var matchUrl = "https://api.toornament.com/v1/disciplines/counterstrike_go/matches";
    var matches = [];

    // Get tournament participant info
    var daysInMonth = new Date(currDate.getFullYear(), currDate.getMonth() + 1, 0).getDate();
    var getNextMonth = currDate.getDate() + 1 > daysInMonth;
    var getNextYear = getNextMonth && currDate.getMonth() >= 11;
    var currentDate = ((getNextYear ? currDate.getFullYear() + 1 : currDate.getFullYear()) + '-'
        + ('0' + (getNextMonth ? (currDate.getMonth() + 2 > 12 ? 1 : currDate.getMonth() + 2) : currDate.getMonth() + 1)).slice(-2) + '-'
        + ('0' + (getNextMonth ? 1 : currDate.getDate())).slice(-2));

    $.ajax({
        type: "GET",
        url: matchUrl,
        headers: { "X-Api-Key": "Q6Hu41MTYzjED8a0hNr7x6sSDEc-eUVQvo6qmv4ckp8" },
        data: {
            "featured": "1",
            "has_result": "0",
            "sort": "date_asc",
            "after_date": currentDate
        },
        success: function(response)
        {
            matches = response;

            $.each(matches, function(index, obj)
            {
                var tournamentName = obj.tournament.full_name == null ? obj.tournament.name : obj.tournament.full_name;
                var teamOne = "";
                var teamTwo = "";
                var rawStartdate = new Date(obj.date); // Cast the start date to a new 'Date'
                var formatMinutes = rawStartdate.getMinutes() < 10 ? "0" + rawStartdate.getMinutes() : rawStartdate.getMinutes();
                var formatHours = rawStartdate.getHours() < 10 ? "0" + rawStartdate.getHours() : rawStartdate.getHours();
                console.log(rawStartdate);
                var startDate = rawStartdate.getDate() + "/" + ('0' + (rawStartdate.getMonth() + 1)).slice(-2) + "/" + rawStartdate.getFullYear() + " - " + formatHours + ":" + formatMinutes; // Format the newly created 'Date'
                obj.opponents[0].participant == null ? teamOne = "TBD" : teamOne = obj.opponents[0].participant.name;
                obj.opponents[1].participant == null ? teamTwo = "TBD" : teamTwo = obj.opponents[1].participant.name;
                var tournamentId = obj.tournament.id;
                var matchId = obj.id;
                var tournamentLogo = $.grep(tournaments, function(e) { return e.id == tournamentId; })[0] == null ? "img/icon.png" : $.grep(tournaments, function(e) { return e.id == tournamentId; })[0].logo.logo_small;
                console.log(tournaments);

                console.log(obj);

                var match = '<div id="' + matchId + '" class="match" data-matchId="' + matchId + '" data-tournamentId="' + tournamentId + '">' +
                    '<div class="matchInfo">' +
                    '<img class="tournamentLogo" src="' + tournamentLogo + '"/>' +
                    '<div class="opponents">' +
                    '<p class="opponentOne">' + teamOne + '</p>' +
                    '<p class="versus"> VS </p>' +
                    '<p class="opponentTwo">' + teamTwo + '</p>' +
                    '<p class="matchStart">' + startDate + '</p>' +
                    '</div>' +
                    '<img class="alarmBtn" src="img/alarmIdle.png"/>' +
                    '</div>' +
                    '</div>';
                $('.matchArea').append(match);
            });
        },
        error: function(error)
        {
            console.log("Error " + error.status + " - " + this.url);
        },
        complete: function()
        {
            $(".alarmBtn").on('click', function(e)
            {
                $(this).toggleClass('selected');
                saveData($(this));
            });
            loadData();
        }
    });

    $.ajax({
        type: 'GET',
        url: 'https://api.twitch.tv/kraken/streams?game=Counter-Strike:+Global+Offensive',
        headers: {
            'Client-ID': 'cw208ax9fx4md7ny1jkqfsivbajxq8q'
        },
        success: function(data)
        {
            $.each(data.streams, function(index, obj)
            {
                if (obj.channel.broadcaster_language == "en")
                {
                    var streamId = guid();
                    var channel = '<div data-streamlink="' + obj.channel.url + '" class="stream tournament" id=' + streamId + '>' +
                        '<div class="tournamentInfo">' +
                        '<img class="tournamentLogo" src="' + (obj.channel.logo == null ? "img/twitchIcon.png" : obj.channel.logo) + '"/>' +
                        '<p class="tournamentName">' + obj.channel.display_name + '</p>' +
                        '<p class="streamStatus">' + obj.channel.status + '</p>';
                    channel += '<img style="height:11px;width:auto;margin-right:0" src="img/teamIcon.png" /><p style="display: inline;margin-right: 5px;">' + obj.viewers + '</p>';
                    obj.average_fps >= 60 ? channel += '<p style="display: inline;"> 60FPS </p>' : "";
                    channel += '</div>' +
                        '</div>';
                    $('.streamArea').append(channel);

                    $('#' + streamId).on('click', function()
                    {
                        chrome.tabs.create({ url: $(this).data('streamlink') });
                        return false;
                    });
                }
            });
        }
    });
});

matches = [];

function saveData(dataToAdd)
{
    var matchToAdd = $(dataToAdd).closest('.match');

    match = {
        "matchId": $(matchToAdd).attr('data-matchId'),
        "tournamentId": $(matchToAdd).attr('data-tournamentId'),
        "matchStart": $(matchToAdd).find('.matchStart').text(),
        "matchTeamOne": $(matchToAdd).find('.opponentOne').text(),
        "matchTeamTwo": $(matchToAdd).find('.opponentTwo').text(),
        "tournamentLogo": $(matchToAdd).find('.tournamentLogo').attr('src'),
        "streamLink": $('#' + $(matchToAdd).attr('data-tournamentId')).find('.streamLink').attr('href')
    };

    chrome.storage.sync.get(function(item)
    {
        if (item.match !== undefined)
            matches = item.match;

        var matchAlreadyAdded = false;

        $.each(matches, function(index, obj)
        {
            if (obj.matchId === match.matchId)
            {
                console.log("Match already in storage");
                matches.splice(index, 1);
                matchAlreadyAdded = true;
                return false;
            }
        });

        console.log(matches);
        if (!matchAlreadyAdded)
            matches.push(match);

        chrome.storage.sync.set({
            "match": matches
        });
    });
}

function loadData()
{
    chrome.storage.sync.get("match", function(item)
    {
        $.each(item.match, function(index, obj)
        {
            $('#' + obj.matchId).find(".alarmBtn").addClass('selected');
        });
    });
}

$(document).ready(function()
{
    var arrow = "img/arrow.png";

    $('#toorLogo').on('click', function() // Create link on 'powered by toornament' logo
    {
        chrome.tabs.create({ url: $(this).parent().attr('href') });
        return false;
    });
});

function guid()
{
    function s4()
    {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}