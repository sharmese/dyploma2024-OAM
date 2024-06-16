let passwordField = document.querySelector('input[type="password"]');
let emailField = document.querySelector('input[type="email"]');
let usernameField = document.querySelector('input[type="text"]');

const userSettings = [];

document.addEventListener('click', function (event) {
  if (
    event.target.tagName.toLowerCase() === 'button' &&
    event.target.type === 'submit' &&
    passwordField &&
    (emailField || usernameField)
  ) {
    if (userSettings[0].autosave) {
      passwordField = document.querySelector('input[type="password"]');
      emailField = document.querySelector('input[type="email"]');
      usernameField = document.querySelector('input[type="text"]');
      processFields();
    } else {
      let isAccepted = confirm('Do you want to save your credentials?');
      if (isAccepted) {
        passwordField = document.querySelector('input[type="password"]');
        emailField = document.querySelector('input[type="email"]');
        usernameField = document.querySelector('input[type="text"]');
        processFields();
      } else {
        return;
      }
    }
  }
});
window.onload = () => {
  retrieveToken(function (token) {
    getUserSettings(token);
    retrieveWebsiteUrl(function (url) {
      getAutocompleteUserData(token, url);
    });
  });
};
function autoFill(data) {
  if (data.length > 0 && emailField && passwordField) {
    if (userSettings[0].autocomplete) {
      emailField.value = data[0].email;
      passwordField.value = data[0].password;
    } else {
      let isAccepted = confirm('Do you want to fill you credentials?');
      if (isAccepted) {
        emailField.value = data[0].email;
        passwordField.value = data[0].password;
      }
    }
  }
  if (data.length > 0 && usernameField && passwordField) {
    if (userSettings[0].autocomplete) {
      usernameField.value = data[0].email;
      passwordField.value = data[0].password;
    } else {
      let isAccepted = confirm('Do you want to fill you credentials?');
      if (isAccepted) {
        usernameField.value = data[0].email;
        passwordField.value = data[0].password;
      }
    }
  }
}
function processFields() {
  if (!emailField && !usernameField) {
    console.error('Email or username field not found on the webpage.');
    return;
  }
  let isEmailField;
  let email = '';
  let username = '';
  if (emailField) {
    isEmailField = true;
    email = emailField.value;
  } else if (usernameField) {
    isEmailField = false;
    username = usernameField.value;
  }
  if (passwordField) {
    const password = passwordField.value;

    retrieveToken(function (token) {
      retrieveWebsiteUrl(function (url) {
        if (!isEmailField) {
          saveCredentials(token, url, username, password);
        } else if (isEmailField) {
          saveCredentials(token, url, email, password);
        }
      });
    });
  } else {
    console.error('Password field not found on the webpage.');
  }
}
function retrieveWebsiteUrl(callback) {
  chrome.runtime.sendMessage({ action: 'getCurrentTabUrl' }, (response) => {
    if (response && response.url) {
      console.log('Current tab URL:', response.url);
      response.url;
      callback(response.url);
    } else {
      console.error('Failed to get current tab URL');
    }
  });
}

function retrieveToken(callback) {
  chrome.runtime.sendMessage({ action: 'getToken' }, (response) => {
    if (response && response.token) {
      console.log('Token received from background script:', response.token);
      callback(response.token);
    } else {
      console.error('Failed to get token from background script');
    }
  });
}
async function getAutocompleteUserData(token, website) {
  const apiUrl = 'http://localhost:3005/api/autocomplete';

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ website }),
  };
  try {
    const response = await fetch(apiUrl, options);
    if (!response) {
      throw new Error('Network response was not ok');
    }
    const userData = await response.json();
    if (!userData.error) {
      autoFill(userData);
    }
  } catch (error) {
    console.error('Error', error);
  }
}
async function getUserSettings(token) {
  const apiUrl = 'http://localhost:3005/api/settings';

  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await fetch(apiUrl, options);
    if (!response) {
      throw new Error('Network response was not ok');
    }
    const settings = await response.json();
    if (!settings.error) {
      userSettings.push(settings);
    }
  } catch (error) {
    console.error('Error', error);
  }
}
function saveCredentials(token, website, email, password) {
  const apiUrl = 'http://localhost:3005/api/credentials';
  const postData = {
    website: website,
    email: email,
    password: password,
  };
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  };

  fetch(apiUrl, options)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Credentials saved successfully:', data);
    })
    .catch((error) => {
      console.error('Error saving credentials:', error);
    });
}
