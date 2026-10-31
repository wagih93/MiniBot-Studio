import { normalizeRobotAppearance } from '../domain/robot-appearance.js';

const directionSymbol = { north: '↑', east: '→', south: '↓', west: '←' };
const designBadge = { classic: '●', explorer: '◆', turbo: '★' };

export function createWorldGridView({ worldGridElement, isCollectibleCollected }) {
  function render(level, robotState, objectiveProgress, robotAnimation = null, robotAppearance = null) {
    worldGridElement.style.gridTemplateColumns = `repeat(${level.grid.columns}, minmax(36px, 1fr))`;
    const cells = [];
    const appearance = normalizeRobotAppearance(robotAppearance);

    for (let row = 0; row < level.grid.rows; row += 1) {
      for (let column = 0; column < level.grid.columns; column += 1) {
        const cell = document.createElement('span');
        cell.classList.add('cell');
        cell.dataset.row = String(row);
        cell.dataset.column = String(column);

        const isRobot = robotState.row === row && robotState.column === column;
        const collectibles = Array.isArray(level.collectibles) ? level.collectibles : [];
        const isCollectible = !isRobot && collectibles.some((c) => c.row === row && c.column === column);
        const isObstacle = !isRobot && level.obstacles.some((o) => o.row === row && o.column === column);

        if (isRobot) {
          cell.classList.add('robot');
          cell.classList.add(`robot-design-${appearance.design}`);
          cell.classList.add(`robot-color-${appearance.color}`);
          if (robotState.lightOn === true) {
            cell.classList.add('robot-light-on');
          }
          cell.dataset.direction = robotState.direction;
          cell.dataset.robotDesign = appearance.design;
          cell.dataset.robotColor = appearance.color;
          const appearanceBadge = designBadge[appearance.design] ?? designBadge.classic;
          const lightMarker = robotState.lightOn === true ? '💡' : '⚪';
          cell.textContent = `🤖 ${lightMarker}${appearanceBadge} ${directionSymbol[robotState.direction] ?? ''}`;
          if (robotAnimation?.row === row && robotAnimation?.column === column) {
            if (robotAnimation.kind === 'move') cell.classList.add(`moving-${robotAnimation.direction}`);
            if (robotAnimation.kind === 'turn') cell.classList.add(`rotating-${robotAnimation.turnDirection}`);
          }
        } else if (isCollectible) {
          const collected = isCollectibleCollected(objectiveProgress, row, column);
          cell.classList.add(collected ? 'target-collected' : 'target');
          cell.textContent = collected ? '✨' : '⭐';
        } else if (isObstacle) {
          cell.classList.add('wall');
          cell.textContent = '⬛';
        }

        cells.push(cell);
      }
    }

    worldGridElement.replaceChildren(...cells);
  }

  return { render };
}
