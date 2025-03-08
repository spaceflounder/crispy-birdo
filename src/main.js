import './style.css'
import { startAudio } from "./audio.js";
import { startGame } from "./game.js";

document.querySelector('#app').innerHTML = `
  <div id="game">
  </div>
`


window.addEventListener("load", () => {
  startAudio();
  startGame();
});
