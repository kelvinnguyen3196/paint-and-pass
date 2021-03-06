import urlInfo from './linkInfo.js';
// fade out landing and fade in settings
const landingWrapper = document.getElementById('landing-wrapper');
const settingsWrapper = document.getElementById('settings-wrapper');
const getStartedButton = document.getElementById('get-started-button');

getStartedButton.addEventListener('click', function() {
    landingWrapper.classList.toggle('fade');
    settingsWrapper.classList.toggle('noFade');

    setTimeout(() => {
        landingWrapper.parentNode.removeChild(landingWrapper);
    }, 1000);
});

// enter canvas
const joinButton = document.getElementById('settings-button');
joinButton.addEventListener('click', () => {
    const userName = document.getElementById('name-input').value;
    const roomIdInput = document.getElementById('room-id-input').value;
    let userRoom;

    if(!userName) {
        document.getElementById('name-input').style.border = 'solid 3px var(--color-cloud-orange)';
        return;
    }
    if(!roomIdInput) {
        // random 4 digit number
        userRoom = Math.floor(1000 + Math.random() * 9000);
    }
    else {
        userRoom = roomIdInput;
    }

    window.location.href = `http://${urlInfo.url}:${urlInfo.port}/canvas?name=${userName}&room=${userRoom}`;
});

// enter button in input text event listeners
document.getElementById('name-input').addEventListener('keyup', function(event) {
    if(event.keyCode === 13) {
        if(!document.getElementById('name-input').value) {
            return;
        }
        document.getElementById('settings-button').click();
    }
});

document.getElementById('room-id-input').addEventListener('keyup', function(event) {
    if(event.keyCode === 13) {
        if(!document.getElementById('name-input').value) {
            return;
        }
        document.getElementById('settings-button').click();
    }
});