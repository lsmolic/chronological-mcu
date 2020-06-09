chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostContains: 'disneyplus|netflix' },
      })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

var currentIndex = -1
var tabId;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message', request)
  if(request.type === 'start') {
    currentIndex = 7 // DEBUG
    goToFilm(currentIndex)
  } else if (request.type === 'next') {
    currentIndex += 1
    goToFilm(currentIndex)
  } else if (request.type === 'back') {
    sendMessage({ type: 'reset-clip', sequenceData: sequence[currentIndex], tabId , film}, tabId)
  } else if (request.type === 'stop') {
    sendMessage({type: 'stop'}, tabId)
    currentIndex = -1
    tabId = null
  } else if (request.type === 'popover') {
    const sequenceData = currentIndex >= 0 ? sequence[currentIndex] : null
    const film = sequenceData ? films[sequenceData["Film"]] || null : null
    const nextClip = currentIndex >= 0 ? sequence[currentIndex + 1] : null
    const next = nextClip ? films[nextClip["Film"]]["Name"] || null : null
    sendResponse({currentIndex, film, sequenceData, next})
  }
})

function goToFilm(id) {
  const sequenceData = sequence[id]
  const film = films[sequenceData["Film"]]

  // tabId will be undefined the first time
  chrome.tabs.update(tabId, {
    url: film["Link"]
  }, (tab) => {
    chrome.tabs.onUpdated.addListener((updatedTabId) => {
      if (tab.id === updatedTabId) {
        // ensure tabId is now set
        tabId = tab.id
        // Send message to tab
        sendMessage({ type: 'redirected', film, sequenceData, tabId}, tabId)
      }
    })
  })


// if (tabId) {
//   chrome.tabs.query({ active: true }, (tab) => {
//     tabId = tab.id
//     updateLink(tabId)
//   })
// } else {
//   updateLink(tabId)
// }

// function updateLink(tab) {
//   chrome.tabs.update(tab, {
//     url: film["Link"]
//   }, () => {
//     chrome.tabs.onUpdated.addListener((updatedTabId) => {
//       if (tab === updatedTabId) {
//         // Send message to tab
//         sendMessage({ type: 'redirected', film, sequenceDat }, tab)
//       }
//     })
//   })
// }
}

function sendMessage(payload, toTab) {
  if (toTab) {
    console.log('Sending message to tab', toTab)
    chrome.tabs.sendMessage(toTab, payload);
  } else {
    console.log('Sending message')
    chrome.runtime.sendMessage(payload)
  }
}
