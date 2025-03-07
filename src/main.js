import './style.css'
import { restartGame, renderGame } from "./game.js";

document.querySelector('#app').innerHTML = `
  <div id="game">
  </div>
`


window.addEventListener("load", () => {
  restartGame();
  window.requestAnimationFrame(() => {
    renderGame();
  });
});
