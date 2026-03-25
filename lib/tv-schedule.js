/**
 * TV schedule parsing and "Playing Now" display.
 * Loaded as a global script — all functions are available on window.
 * Requires jQuery for DOM manipulation.
 */

function parseScheduleJSON(jsonData) {
  const schedule = [];
  jsonData.forEach((channel) => {
    const channelName = channel.channel_name;
    channel.shows.forEach((show) => {
      schedule.push({
        channel: channelName,
        day: show.day,
        startTime: show.start_time,
        endTime: show.end_time,
        program: show.show_name,
      });
    });
  });
  return schedule;
}

function findAndDisplayCurrentPrograms(scheduleData, timezoneOffset) {
  if (typeof timezoneOffset === "undefined") timezoneOffset = 0;

  const schedule = parseScheduleJSON(scheduleData);
  const currentTime = new Date();
  currentTime.setMinutes(currentTime.getMinutes() + timezoneOffset);

  const dayOfWeek = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
  });

  // Only today's entries, sorted by start time
  const todayEntries = schedule
    .filter((entry) => entry.day === dayOfWeek)
    .sort((a, b) => {
      const [aH, aM] = a.startTime.split(":").map(Number);
      const [bH, bM] = b.startTime.split(":").map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });

  // Group today's entries by channel
  const entriesByChannel = todayEntries.reduce((map, entry) => {
    if (!map[entry.channel]) map[entry.channel] = [];
    map[entry.channel].push(entry);
    return map;
  }, {});

  Object.keys(entriesByChannel).forEach((channelName) => {
    const channelEntries = entriesByChannel[channelName];

    var currentEntry = null;
    var nextEntry = null;

    channelEntries.forEach((entry, index) => {
      const [startH, startM] = entry.startTime.split(":").map(Number);
      const [endH, endM] = entry.endTime.split(":").map(Number);

      const start = new Date();
      start.setHours(startH, startM, 0, 0);

      const end = new Date();
      end.setHours(endH, endM, 0, 0);

      if (end < start) end.setDate(end.getDate() + 1);

      if (currentTime >= start && currentTime < end) {
        currentEntry = entry;
        nextEntry = channelEntries[index + 1] || null;
      }
    });

    if (currentEntry) {
      var selector = 'div[data-channel-name="' + CSS.escape(channelName.toLowerCase()) + '"]';

      var nextProgram = nextEntry
        ? nextEntry.program
        : "None (end of schedule)";

      // Use jQuery if available, fall back to vanilla DOM
      if (typeof $ !== "undefined") {
        var channelElements = $(selector);
        if (channelElements.length === 0) {
          console.log('Channel "' + channelName + '" not found on DOM.');
        } else {
          channelElements.each(function () {
            $(this).empty().html(
              '<div><span>On now:</span> ' + currentEntry.program + '</div><div><span>Up next:</span> ' + nextProgram + '</div>'
            );
          });
        }
      } else {
        var el = document.querySelector(selector);
        if (el) {
          el.innerHTML = '<div><span>On now:</span> ' + currentEntry.program + '</div><div><span>Up next:</span> ' + nextProgram + '</div>';
        }
      }
    }
  });
}

function startProgramUpdates(scheduleJsonUrl) {
  var url = scheduleJsonUrl || "./tv-schedule-data.json";

  var fetchAndUpdate = function () {
    console.log("Fetching program schedule...");
    fetch(url)
      .then(function (response) { return response.json(); })
      .then(function (jsonData) {
        findAndDisplayCurrentPrograms(jsonData, 0);
      })
      .catch(function (error) {
        console.error("Error fetching or parsing schedule JSON:", error);
      });
  };

  fetchAndUpdate();
  setInterval(fetchAndUpdate, 60000);
}
