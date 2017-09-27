// helper functions

let clearCookies = function(cookieDomain) {
  chrome.cookies.getAll({domain: cookieDomain}, function(cookies) {
    for(var i=0; i<cookies.length;i++) {
      let urlPath = `http://${cookieDomain}/${cookies[i].path}`;
      chrome.cookies.remove({url: urlPath, name: cookies[i].name});
    }
  });
}

let openPopup = function() {
  window.open("popup.html", "extension_popup", "width=400,height=620,status=no,scrollbars=yes,resizable=no");
}

// debugging functions

let clearStorage = function() {
  chrome.storage.local.clear(function() {
    var error = chrome.runtime.lastError;
    if (error) {
      console.error(error);
    }
  });
}

let logAllStorage = function() {
  chrome.storage.local.get(null, function(items) {
    console.log(items);
  });
}

let getStorage = function(key) {
  chrome.storage.local.get(key, function(lastSent) {
    alert(lastSent[key]);
  });
}

// functions called from front-end (`var` because `let` is not accessible when called from popup)

var epicenterLogin = function(credentials) {
  clearCookies("epicenter.epicodus.com");
  chrome.tabs.create({url: "https://epicenter.epicodus.com/"}, function(){
    chrome.tabs.executeScript(
      null,
      {code:`
        let email = document.getElementById('user_email');
        let password = document.getElementById('user_password');
        let submit  = document.querySelectorAll('input[type="submit"]')[0];
        email.value = '${credentials.username}';
        password.value = '${credentials.password}';
        submit.click();
      `}
    );
  });
}

var attendanceLogin = function(credentials) {
  chrome.tabs.create({url: "https://epicenter.epicodus.com/sign_in"}, function(){
    chrome.tabs.executeScript(
      null,
      {code:`
        var email1 = document.getElementById('email1');
        var password1 = document.getElementById('password1');
        var email2 = document.getElementById('email2');
        var password2 = document.getElementById('password2');
        var station = document.getElementById('station');
        var submit  = document.querySelectorAll('input[type="submit"]')[0];
        email1.value = '${credentials.email1}';
        password1.value = '${credentials.password1}';
        email2.value = '${credentials.email2}';
        password2.value = '${credentials.password2}';
        station.value = '${credentials.station}';
        submit.click();
      `}
    );
  });
}

var attendanceLogout = function(credentials) {
  chrome.tabs.create({url: "https://epicenter.epicodus.com/sign_out"}, function(){
    chrome.tabs.executeScript(
      null,
      {code:`
        var email = document.getElementById('email');
        var password = document.getElementById('password');
        var submit  = document.querySelectorAll('input[type="submit"]')[0];
        email.value = '${credentials.email}';
        password.value = '${credentials.password}';
        submit.click();
      `}
    );
  });
}

// notifications

const ONEDAY = 1440

const ALARMS = {
  "sign-in-reminder": {
    title: "Sign In Reminder",
    message: "Don't foget to sign in!",
    time: "8:00",
    requireInteraction: false
  }
}

chrome.runtime.onInstalled.addListener(function() {
  for (let key of Object.keys(ALARMS)) {
    // set alarms
    hour = parseInt(ALARMS[key].time.split(":")[0]);
    minute = parseInt(ALARMS[key].time.split(":")[1]);
    time = new Date().setHours(hour, minute, 0, 0);
    chrome.alarms.create(key, { when: time, periodInMinutes: ONEDAY });

    // initialize localStorage objects
    let localStorageObject = {};
    localStorageObject[key] = "";
    chrome.storage.local.set(localStorageObject);
  }
});

let sendNotification = function(alarmName) {
  // actually send the notification
  let messageValues = {
    type: "basic",
    iconUrl: "/chrome-store-assets/e_small.png",
    title: ALARMS[alarmName].title,
    message: ALARMS[alarmName].message,
    requireInteraction: ALARMS[alarmName].requireInteraction
  }
  chrome.notifications.create(messageValues);

  // add last run time to localStorage object
  let localStorageObject = {};
  localStorageObject[alarmName] = new Date().toDateString();
  chrome.storage.local.set(localStorageObject);
}

// run every time any alarm is triggered
chrome.alarms.onAlarm.addListener(function(alarm) {
  chrome.storage.local.get(alarm.name, function(lastSent) {
    let alarmName = Object.keys(lastSent)[0];

    // send notification if alarm not already triggered today
    if (lastSent[alarmName] !== new Date().toDateString()) {
      sendNotification(alarmName);
      if (alarmName == "sign-in-reminder") {
        openPopup();
      }
    }
  });
});
