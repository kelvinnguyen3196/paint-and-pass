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
