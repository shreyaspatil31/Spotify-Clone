let currentSong = new Audio(); // Declare a global Audio object
let songs = []; // Store the full URLs of the songs
let songNames = []; // Store just the song names
let currFolder;
let isMuted = false; // Track mute state
let lastVolume = 0.5; // Track last volume level, default to 50%

// Function to convert seconds to minutes:seconds format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;  // Corrected template string
}

// Fetch the list of songs from the server when a card is clicked
async function getSongs(folder) {
    currFolder = folder;

    try {
        let response = await fetch(`http://127.0.0.1:5501/Spotify%20Clone/${folder}`); // Corrected template string for fetch URL
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`); // Corrected template string
        }
        let text = await response.text();

        let div = document.createElement("div");
        div.innerHTML = text;

        let as = div.getElementsByTagName("a");

        songs = []; // Reset songs array
        songNames = [];

        for (let element of as) {
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href); // Full song URL
                songNames.push(decodeURIComponent(element.href.split('/').pop())); // Decode song name for special characters
            }
        }

        return songs;
    } catch (error) {
        console.error('Error fetching songs:', error);
    }
}

// Function to play a song after the user clicks on it
const playMusic = (track, pause = false) => {
    if (!currentSong.paused) {
        currentSong.pause(); // Stop the currently playing song
    }
    currentSong.src = track; // Set the source to the selected track
    if (!pause) {
        currentSong.play(); // Play the song
        play.src = "img/pause.svg";
    }

    // Extract the song name (filename), replacing %20 with spaces
    const songName = decodeURIComponent(track.split('/').pop()); // Use decodeURIComponent for song names with special characters
    document.querySelector(".songinfo").innerHTML = songName;
    document.querySelector(".songtime").innerHTML = `00:00 / ${secondsToMinutesSeconds(currentSong.duration)}`; // Corrected template string
}

// Populate the song list after fetching the songs
function populateSongList() {
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = ""; // Clear the previous song list

    for (const song of songs) {
        let songName = decodeURIComponent(song.split("/").pop()); // Decode song name

        songUL.innerHTML += `<li>
                                <img class="invert" src="img/music.svg" alt="music icon">
                                <div class="info">
                                    <div>${songName}</div>
                                    <div>Shreyas</div>
                                </div>
                                <div class="playNow">
                                    <span>Play Now</span>
                                    <img class="invert" src="img/play.svg" alt="play icon">
                                </div>
                            </li>`;
    }

    // Attach event listener to each song item to play the clicked song
    Array.from(songUL.getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            playMusic(songs[index]); // Pass the song URL to the playMusic function
        });
    });
}

// Main function to handle card clicks and user interactions
async function main() {
    // Add event listener to cards for fetching songs on click
    document.querySelectorAll(".cards").forEach(card => {
        card.addEventListener("click", async () => {
            // Use data-folder attribute to fetch songs from the specific folder
            const folder = card.getAttribute('data-folder');
            songs = await getSongs(folder); // Fetch songs from the selected folder
            populateSongList(); // Populate song list with the new songs
        });
    });

    // Attach event listener to the play button for play/pause functionality
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Listen for the timeupdate event to update the song time display
    currentSong.addEventListener("timeupdate", () => {
        const currentTimeFormatted = secondsToMinutesSeconds(currentSong.currentTime);
        const durationFormatted = secondsToMinutesSeconds(currentSong.duration);
        document.querySelector(".songtime").innerHTML = `${currentTimeFormatted} / ${durationFormatted}`; // Corrected template string

        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Add event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Add event listener to hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add event listener to close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Add event listener to previous button
    previous.addEventListener("click", () => {
        let currentIndex = songs.indexOf(currentSong.src);
        if (currentIndex > 0) {
            playMusic(songs[currentIndex - 1]);
        }
    });

    // Add event listener to next button
    next.addEventListener("click", () => {
        let currentIndex = songs.indexOf(currentSong.src);
        if (currentIndex < songs.length - 1) {
            playMusic(songs[currentIndex + 1]);
        }
    });

    // Add an event to volume slider
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("input", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100; // Volume ranges from 0.0 to 1.0
    });

    // Optionally, display the current volume value (as a percentage)
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("input", (e) => {
        const volumePercentage = e.target.value; // Current volume percentage (0-100)
        document.querySelector(".volume-display").innerText = `Volume: ${volumePercentage}%`; // Update the volume display
    });

    // Add event listener to mute/unmute song
    document.querySelector(".volume>img").addEventListener("click", (e) => {
        if (isMuted) {
            // Restore volume
            currentSong.volume = lastVolume; // Restore to last volume level
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg");
            document.querySelector(".range").getElementsByTagName("input")[0].value = lastVolume * 100; // Update volume slider
        } else {
            // Mute volume
            lastVolume = currentSong.volume; // Store the current volume before muting
            currentSong.volume = 0; // Mute the song
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg");
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0; // Update volume slider to 0
        }
        isMuted = !isMuted; // Toggle mute state
    });

}

main(); // Initialize the app
