var MS_PER_MINUTE = 60000; // Milliseconds in a minute
var durationInMinutes = 15;
var intervalBetweenChecks = 1;
var timerID = setInterval(function()
{
    chrome.storage.sync.get(function(item)
    {
        if (item.timeBeforeMatch != undefined && item.timeBeforeMatch !== "")
            durationInMinutes = item.timeBeforeMatch;
    });

    chrome.storage.sync.get("match", function(item)
    {
        if (item.match == undefined)
        {
            console.log("item.match == undefined");
            return false;
        }

        console.log(item.match.length + " matches in storage");
        var matchToday = false;
        var matches = item.match;
        console.log(item.match);
        $.each(item.match, function(index, obj)
        {
            if (obj == undefined)
                return false;

            //TODO fix time
            var matchStartDay = obj.matchStart.split('/')[0];
            var matchStartMonth = obj.matchStart.split('/')[1];
            var matchStartYear = obj.matchStart.split('/')[2].split(' ')[0];
            var matchStartTime = obj.matchStart.split(' - ')[1];

            var formattedMatchStart = matchStartMonth + "/" + matchStartDay++ + "/" + matchStartYear + " " + matchStartTime;
            if (new Date().getTime() > Date.parse(formattedMatchStart) - durationInMinutes * MS_PER_MINUTE)
            {
                var timeUntilMatchStart = (Date.parse(formattedMatchStart) - new Date().getTime()) / MS_PER_MINUTE;

                var notification = new Notification(obj.matchTeamOne + " VS " + obj.matchTeamTwo, {
                    icon: obj.tournamentLogo,
                    body: "starting in " + Math.round(timeUntilMatchStart) + " mins"
                });

                notification.onclick = function()
                {
                    window.open(obj.streamLink);
                };

                // Remove the match from storage
                matches.splice(index, 1);
                chrome.storage.sync.set({
                    "match": matches
                });
            }
        });
    });
}, intervalBetweenChecks * MS_PER_MINUTE);