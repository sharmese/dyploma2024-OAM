let isUser = false;
const userSettings = [];
const newElement = ({
  element,
  className,
  hidden,
  textContent,
  firstAttribute,
  secondAttribute,
  src,
  value,
  forValue,
  name,
}) => {
  const newEl = document.createElement(element);
  if (className) newEl.className = className;
  if (firstAttribute && secondAttribute)
    newEl.setAttribute(firstAttribute, secondAttribute);
  if (textContent) newEl.textContent = textContent;
  if (hidden) newEl.hidden = hidden;
  if (src) newEl.src = src;
  if (value) newEl.value = value;
  if (forValue) newEl.htmlFor = forValue;
  if (name) newEl.name = name;
  return newEl;
};
window.onload = async () => {
  const token = localStorage.getItem('token');
  chrome.storage.local.set({ ['token']: token }, function () {
    if (chrome.runtime.lastError) {
      console.error('Error storing data: ' + chrome.runtime.lastError.message);
    } else {
      console.log('Data stored successfully!');
    }
  });
  await getUserSettings(token);

  await getUserData(token);

  if (isUser === false) {
    const parentElement = document.getElementById('popup');
    const inputWrapper = newElement({
      element: 'div',
      className: 'input-wrap',
    });
    const buttonWrapper = newElement({
      element: 'div',
      className: 'button-wrap',
    });
    const popupTitle = newElement({
      element: 'h1',
      className: 'title',
      textContent: 'Login',
      firstAttribute: 'type',
      secondAttribute: 'text',
    });

    let windowState = 'login';

    const submitButton = newElement({
      element: 'button',
      className: 'btn btn-active',
      textContent: 'log in',
      firstAttribute: 'type',
      secondAttribute: 'button',
    });
    const registerButton = newElement({
      element: 'button',
      className: 'btn',
      textContent: 'sign up',
      firstAttribute: 'type',
      secondAttribute: 'button',
    });
    const emailField = newElement({
      element: 'input',
      className: 'input-field',
      firstAttribute: 'type',
      secondAttribute: 'email',
    });

    emailField.setAttribute('id', 'email');
    emailField.placeholder = 'Email';
    const passwordField = newElement({
      element: 'input',
      className: 'input-field',
      firstAttribute: 'type',
      secondAttribute: 'password',
    });

    passwordField.setAttribute('id', 'password');
    passwordField.placeholder = 'Password';

    parentElement.appendChild(popupTitle);
    parentElement.appendChild(inputWrapper);
    inputWrapper.appendChild(emailField);
    inputWrapper.appendChild(passwordField);
    parentElement.appendChild(buttonWrapper);
    buttonWrapper.appendChild(submitButton);
    buttonWrapper.appendChild(registerButton);

    submitButton.onclick = (e) => {
      e.preventDefault();
      if (windowState === 'login') {
        let email = document.getElementById('email').value;
        let password = document.getElementById('password').value;
        authenticateUser(email, password);
      } else {
        windowState = 'login';
        popupTitle.textContent = 'Login';
        submitButton.className = 'btn btn-active';
        registerButton.className = 'btn';
      }
    };
    registerButton.onclick = (e) => {
      e.preventDefault();
      if (windowState === 'signup') {
        let email = document.getElementById('email').value;
        let password = document.getElementById('password').value;
        registerUser(email, password);
      } else {
        windowState = 'signup';
        popupTitle.textContent = 'Sign up';
        submitButton.className = 'btn';
        registerButton.className = 'btn btn-active';
      }
    };
  }
};

function writeUserData(isUser, userData) {
  if (isUser) {
    const parentElement = document.getElementById('popup');
    const dataMenu = newElement({ element: 'div', className: 'data-menu' });
    const optionsMenu = newElement({
      element: 'div',
      className: 'options-menu',
      hidden: 'true',
    });
    const popupTitle = newElement({
      element: 'h1',
      className: 'title',
      textContent: 'Your data',
    });

    parentElement.appendChild(popupTitle);
    parentElement.appendChild(dataMenu);
    parentElement.appendChild(optionsMenu);

    const logoutButton = newElement({
      element: 'button',
      className: 'btn btn-active logout',
      textContent: 'Logout',
      firstAttribute: 'type',
      secondAttribute: 'button',
    });

    logoutButton.onclick = () => {
      localStorage.removeItem('token');
      window.location.reload(true);
    };
    const optionsButton = newElement({
      element: 'button',
      className: 'btn btn-active options-btn',
      textContent: 'Options',
      firstAttribute: 'type',
      secondAttribute: 'button',
    });

    optionsButton.onclick = () => {
      if (optionsMenu.hidden) {
        optionsMenu.hidden = false;
        dataMenu.hidden = true;
        popupTitle.textContent = 'Options';
      } else if (!optionsMenu.hidden) {
        optionsMenu.hidden = true;
        dataMenu.hidden = false;
        popupTitle.textContent = 'Your data';
      }
    };
    const optionDiv = newElement({
      element: 'div',
      className: 'options-div',
    });
    const saveButton = newElement({
      element: 'button',
      textContent: 'Save',
      firstAttribute: 'type',
      secondAttribute: 'button',
      className: 'btn btn-active options-save',
    });
    const optionAutocomplete = newElement({
      element: 'input',
      firstAttribute: 'type',
      secondAttribute: 'checkbox',
    });
    const optionAskToSave = newElement({
      element: 'input',
      firstAttribute: 'type',
      secondAttribute: 'checkbox',
    });

    optionAutocomplete.setAttribute('id', 'autocomplete');
    optionAutocomplete.checked = userSettings[0].autocomplete;
    optionAskToSave.setAttribute('id', 'save');
    optionAskToSave.checked = userSettings[0].autosave;

    const autocompleteLabel = newElement({
      element: 'label',
      textContent: 'Autocomplete without asking',
      forValue: 'autocomplete',
    });
    const saveLabel = newElement({
      element: 'label',
      textContent: 'Save without asking',
      forValue: 'save',
    });

    optionDiv.appendChild(optionAutocomplete);
    optionDiv.appendChild(autocompleteLabel);
    optionDiv.appendChild(optionAskToSave);
    optionDiv.appendChild(saveLabel);

    optionsMenu.appendChild(optionDiv);
    optionsMenu.appendChild(saveButton);

    saveButton.onclick = () => {
      updateUserSettings(
        localStorage.getItem('token'),
        optionAutocomplete.checked,
        optionAskToSave.checked
      );
    };

    const ul = newElement({
      element: 'ul',
      className: 'user-data',
    });

    dataMenu.appendChild(ul);

    if (userData.length > 0) {
      userData.forEach((item) => {
        const li = newElement({
          element: 'li',
          className: 'data-element',
        });
        const maskDiv = newElement({
          element: 'div',
          className: 'mask-div',
        });
        const deleteButton = newElement({
          element: 'button',
          className: 'remove-btn',
          textContent: 'remove',
          firstAttribute: 'type',
          secondAttribute: 'button',
        });
        const showButton = newElement({
          element: 'img',
          className: 'eye-icon',
          src: './assets/visible.png',
          firstAttribute: 'type',
          secondAttribute: 'button',
        });
        const hideButton = newElement({
          element: 'img',
          className: 'eye-icon',
          src: './assets/visible.png',
          firstAttribute: 'type',
          secondAttribute: 'button',
        });

        hideButton.style.display = 'none';

        const website = newElement({
          element: 'p',
          className: 'data-website',
        });

        const email = newElement({
          element: 'p',
        });
        const password = newElement({
          element: 'p',
          firstAttribute: 'id',
          secondAttribute: 'password',
        });

        const passwordMask = newElement({
          element: 'p',
          textContent: '**************',
        });

        website.textContent = item.website;
        email.textContent = item.email;
        password.textContent = item.password;
        password.hidden = true;

        deleteButton.onclick = () => {
          console.log(item.website);
          deleteUserData(localStorage.getItem('token'), item.website);
        };

        showButton.onclick = () => {
          showButton.style.display = 'none';
          hideButton.style.display = 'block';
          password.hidden = false;
          passwordMask.hidden = true;
        };

        hideButton.onclick = () => {
          showButton.style.display = 'block';
          hideButton.style.display = 'none';
          password.hidden = true;
          passwordMask.hidden = false;
        };

        li.appendChild(website);
        li.appendChild(email);
        li.appendChild(maskDiv);
        li.appendChild(deleteButton);

        maskDiv.appendChild(password);
        maskDiv.appendChild(passwordMask);
        maskDiv.appendChild(showButton);
        maskDiv.appendChild(hideButton);

        ul.appendChild(li);
      });
    } else {
      const emptyData = newElement({
        element: 'p',
        className: 'empty',
        textContent: 'You have no credentials saved',
      });
      dataMenu.appendChild(emptyData);
    }
    parentElement.appendChild(logoutButton);
    parentElement.appendChild(optionsButton);
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
async function updateUserSettings(token, autocomplete, autosave) {
  const apiUrl = 'http://localhost:3005/api/settings';
  const patchData = {
    autocomplete: autocomplete,
    autosave: autosave,
  };
  const options = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patchData),
  };
  try {
    const response = await fetch(apiUrl, options);
    if (!response) {
      throw new Error('Network response was not ok');
    }
    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error('Error', error);
  }
}
async function getUserData(token) {
  const apiUrl = 'http://localhost:3005/api/credentials';

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
    const userData = await response.json();
    console.log(userData);
    if (!userData.error) {
      isUser = true;
      writeUserData(isUser, userData);
      console.log('SUCCESS');
    }
  } catch (error) {
    console.error('Error', error);
  }
}
async function deleteUserData(token, website) {
  const apiUrl = 'http://localhost:3005/api/credentials';

  const options = {
    method: 'DELETE',
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
    const result = await response.json();
    console.log(result);
    window.location.reload(true);
  } catch (error) {
    console.error('Error', error);
  }
}
function authenticateUser(email, password) {
  const apiUrl = 'http://localhost:3005/api/users/login';
  const postData = {
    email: email,
    password: password,
  };
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  };
  fetch(apiUrl, options)
    .then((response) => {
      if (!response) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      const token = data.token;
      localStorage.setItem('token', token);
      console.log('SUCCESS');
      window.location.reload(true);
    })
    .catch((error) => {
      console.error('Error', error);
    });
}
function registerUser(email, password) {
  const apiUrl = 'http://localhost:3005/api/users/register';
  const postData = {
    email: email,
    password: password,
  };
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  };
  fetch(apiUrl, options)
    .then((response) => {
      if (!response) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      const token = data.token;
      localStorage.setItem('token', token);
      console.log('SUCCESS');
      window.location.reload(true);
    })
    .catch((error) => {
      console.error('Error', error);
    });
}
