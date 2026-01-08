// function parseJSON(jsonData) {
//     const schedule = [];

//     jsonData.forEach(channel => {
//         const channelName = channel.channel_name;
//         channel.shows.forEach(show => {
//             schedule.push({
//                 channel: channelName,
//                 day: show.day,
//                 startTime: show.start_time,
//                 endTime: show.end_time,
//                 program: show.show_name
//             });
//         });
//     });

//     return schedule;
// }

// function findCurrentProgramsFromJSON(jsonData, timezoneOffset = 0) {
//     const schedule = parseJSON(jsonData);
//     const currentTime = new Date();
//     currentTime.setMinutes(currentTime.getMinutes() + timezoneOffset);
    
//     const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

//     schedule.forEach(entry => {
//         if (entry.day !== dayOfWeek) return;

//         const [startH, startM, startS] = entry.startTime.split(':').map(Number);
//         const [endH, endM, endS] = entry.endTime.split(':').map(Number);

//         const start = new Date();
//         start.setHours(startH, startM, startS || 0, 0);

//         const end = new Date();
//         end.setHours(endH, endM, endS || 0, 0);

//         if (end < start) end.setDate(end.getDate() + 1); // handle crossing midnight

//         if (currentTime >= start && currentTime < end) {
//             const safeChannelName = CSS.escape(entry.channel);
//             const selector = `[data-channel-name="${CSS.escape(entry.channel)}"]`;
// 			const channelElement = document.querySelector(selector);
//             if (channelElement) {
// 				console.log('hit')
//                 channelElement.innerHTML = '';

//                 const onNowSpan = document.createElement('span');
//                 onNowSpan.textContent = 'On now: ';

//                 const programText = document.createTextNode(entry.program);

//                 channelElement.appendChild(onNowSpan);
//                 channelElement.appendChild(programText);
//                 console.log(entry.channel)
//             }
//             else {
//                 console.log(`Channel "${entry.channel}" not found on DOM.`);
//             }
//         }
//     });
// }

// const jsonUrl = 'https://www.eternityready.com/tv/tv-schedule-data.json';

// window.updatePrograms = function() {
// 	console.log('fetching')
//     fetch(jsonUrl)
//         .then(response => response.json())
//         .then(jsonData => {
//             findCurrentProgramsFromJSON(jsonData, 0);
//         })
//         .catch(error => {
//             console.error('Error fetching or parsing JSON:', error);
//         });
// };

// setInterval(() => {
//     updatePrograms();
// }, 60000);


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


function findAndDisplayCurrentPrograms(scheduleData, timezoneOffset = 0) {
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

    let currentEntry = null;
    let nextEntry = null;

    channelEntries.forEach((entry, index) => {
      const [startH, startM] = entry.startTime.split(":").map(Number);
      const [endH, endM] = entry.endTime.split(":").map(Number);

      const start = new Date();
      start.setHours(startH, startM, 0, 0);

      const end = new Date();
      end.setHours(endH, endM, 0, 0);

      // handle programs ending after midnight
      if (end < start) end.setDate(end.getDate() + 1);

      if (currentTime >= start && currentTime < end) {
        currentEntry = entry;
        nextEntry = channelEntries[index + 1] || null;
      }
    });

    if (currentEntry) {
      const selector = `div[data-channel-name="${CSS.escape(
        channelName.toLowerCase()
      )}"]`;
      const channelElements = $(selector);

      const nextProgram = nextEntry
        ? nextEntry.program
        : "None (end of schedule)";

      if (channelElements.length == 0) {
        console.log(`Channel "${channelName}" not found on DOM.`);
      } else {
        channelElements.each(function () {
          $(this).empty().html(
            `<div><span>On now:</span> ${currentEntry.program}</div><div><span>Up next:</span> ${nextProgram}</div>`
          );
        });
      }
    }
  });
}

function startProgramUpdates() {
  const jsonUrl = "./tv-schedule-data.json";
  ("");
  const fetchAndUpdate = () => {
    console.log("Fetching program schedule...");
    fetch(jsonUrl)
      .then((response) => response.json())
      .then((jsonData) => {
        findAndDisplayCurrentPrograms(jsonData, 0);
      })
      .catch((error) => {
        console.error("Error fetching or parsing schedule JSON:", error);
      });
  };

  fetchAndUpdate();
  setInterval(fetchAndUpdate, 60000);
}
