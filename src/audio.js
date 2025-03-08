const songs = [
    "around-the-world-lofi-chill-309230.mp3",
    "cafe-crumble-lofi-beat-309578.mp3",
    "cat-cafe-lofi-309576.mp3",
    "chill-lofi-beat-309207.mp3",
    "coverless-book-lofi-186307.mp3",
    "good-night-lofi-cozy-chill-music-160166.mp3",
    "honey-chill-lofi-309227.mp3",
    "lofi-295209.mp3",
    "lofi-background-music-2-309039.mp3",
    "lofi-background-music-309034.mp3",
    "lofi-girl-309226.mp3",
    "lofi-piano-beat-305563.mp3",
    "lovely-days-lofi-309580.mp3",
    "moving-on-lofi-309231.mp3",
    "new-lofi-309209.mp3",
    "smile-and-wave-lofi-beat-309584.mp3",
    "snoozy-day-chill-lofi-309228.mp3",
    "spring-time-lofi-309599.mp3",
    "wave-of-you-relaxing-lofi-305565.mp3",
    "whispering-vinyl-loops-lofi-beats-281193.mp3"
]; // Array of song file names
let currentSongIndex = 0; // Index of the currently playing song
let audio = new Audio(`audio/${songs[currentSongIndex]}`); // Audio object for the current song
const fadeDuration = 2000; // Duration of fade in/out in milliseconds
const fadeInterval = 50; // Interval for volume adjustment in milliseconds

// Function to play the next song with fade transitions
function playNextSong() {
  // Fade out the current song
  fadeOut(audio, () => {
    // Load and play the next song
    currentSongIndex = (currentSongIndex + 1) % songs.length; // Loop back to the first song if at the end
    audio.src = `audio/${songs[currentSongIndex]}`;
    audio.volume = 0; // Start with volume at 0 for fade in
    audio.play();

    // Fade in the next song
    fadeIn(audio);
  });
}

// Function to fade out the current song
function fadeOut(audio, callback) {
  const fadeOutInterval = setInterval(() => {
    if (audio.volume > 0.1) {
      audio.volume -= 0.1; // Decrease volume gradually
    } else {
      audio.volume = 0;
      clearInterval(fadeOutInterval); // Stop the interval
      callback(); // Call the callback after fade out
    }
  }, fadeInterval);
}

// Function to fade in the next song
function fadeIn(audio) {
  const fadeInInterval = setInterval(() => {
    if (audio.volume < 0.9) {
      audio.volume += 0.1; // Increase volume gradually
    } else {
      audio.volume = 1;
      clearInterval(fadeInInterval); // Stop the interval
    }
  }, fadeInterval);
}

// Event listener for when the current song ends
audio.addEventListener('ended', () => {
  playNextSong(); // Play the next song when the current one ends
});



export function startAudio() {
    // Start playing the first song
    audio.volume = 0; // Start with volume at 0 for fade in
    audio.play();
    fadeIn(audio); // Fade in the first song  
}


