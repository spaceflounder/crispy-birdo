import './style.css'
import { startGame } from "./game.js";

document.querySelector('#app').innerHTML = `
  <div id="game">
  </div>
`


window.addEventListener("load", () => {
  startGame();
});
