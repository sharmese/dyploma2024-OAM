chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'showPopup') {
    chrome.browserAction.openPopup();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCurrentTabUrl') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        sendResponse({ url: tabs[0].url });
      } else {
        sendResponse({ error: 'Failed to get current tab URL' });
      }
    });
    return true;
  }
  if (message.action === 'getToken') {
    chrome.storage.local.get('token', (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          'Error retrieving token:',
          chrome.runtime.lastError.message
        );
        sendResponse({ error: 'Error retrieving token' });
      } else {
        console.log(result);
        const token = result.token;
        sendResponse({ token: result['token'] });
      }
    });
    return true;
  }
});
