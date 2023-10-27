const getCurrentWeekDates = () => {
  var currentDate = new Date()
  var day = currentDate.getDay()
  var startDate = new Date(currentDate)
  startDate.setDate(currentDate.getDate() - day + (day == 0 ? -6 : 1))
  var endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 4)
  return { start: startDate, end: endDate }
}

const get24HoursLaterTime = () => {
  const t1 = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));
  t1.setHours(new Date().getHours() + 5)
  if(t1.getMinutes() >= 30){
    t1.setMinutes(30);
  }else{
    t1.setMinutes(0);
  }
  t1.setSeconds(0);
  t1.setMilliseconds(0)
  return new Date(t1);
}

// start_time='4:00 pm' , end_time='8:00 pm' , duration='40' 
function generateTimeSlots(start_time, end_time, duration, d_id, av_id) {
  const timeSlots = []
  const startTime = new Date(`01/01/2000 ${start_time}`)
  const endTime = new Date(`01/01/2000 ${end_time}`)
  while (startTime < endTime) {
    const startTimeString = startTime.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })
    startTime.setMinutes(startTime.getMinutes() + duration)
    const endTimeString = startTime.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })
    timeSlots.push({
      d_id: [d_id],
      startTime: startTimeString,
      endTime: endTimeString,
      av_id: av_id,
    })
  }
  return timeSlots
}

// convert time 00:20:00 in min
function convertTimeInMinDuration(time) {
  const parts = time.split(':');
  const minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  return minutes;
}

// time = '15:00:00'
function convertTimeInAmPm(time) {
  const parts = time.split(':');
  let hours = parseInt(parts[0]);
  let minutes = parseInt(parts[1]);

  // Convert to 12-hour format
  const ampm = hours >= 12 ? ' pm' : ' am';
  hours = hours % 12;
  hours = hours ? hours : 12; // The hour '0' should be '12'

  // Format the time as a string
  const formattedTime = hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ampm;
  return formattedTime;
}


function extractTime(dateString){
  const dateObj = new Date(dateString);

  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const seconds = dateObj.getSeconds();

  const timeString = `${hours}:${minutes}:${seconds}`;
  return timeString;
}

function uniqueTimeSlotsArray(timeArray){
  let uniqueTimeArray = timeArray.reduce((acc, curr) => {
    const existing = acc.find(time => time.startTime === curr.startTime && time.endTime === curr.endTime);

    if (existing) {
      existing.d_id.push(...curr.d_id);
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  uniqueTimeArray.sort((a, b) => {
    const startTimeA = a.startTime.replace(/[^\d]/g, '');
    const startTimeB = b.startTime.replace(/[^\d]/g, '');
    return startTimeA.localeCompare(startTimeB);
  });

  return uniqueTimeArray;
}

// 2023-06-07T09:30:00.000Z
const getTimeOnly = (date) => {
  // return '2:30 PM' like
  return new Date(date).toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}


module.exports = { 
  getCurrentWeekDates, 
  get24HoursLaterTime, 
  generateTimeSlots, 
  convertTimeInMinDuration, 
  convertTimeInAmPm, 
  uniqueTimeSlotsArray,
  extractTime,
  getTimeOnly,
}
