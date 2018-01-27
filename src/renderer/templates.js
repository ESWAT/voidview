export const layout = `
  <div class="js-list list"></div>
  <div class="js-edge edge"></div>
`;

export const titlebar = `
  <div class="js-titlebar titlebar">Yuffie</div>
`;

export const splash = `
  <div
    class="js-splash splash"
  >
    <button class="js-splash-open splash-open">Open or drop folder here</button>
  </div>
`;

export function peek(backgroundUrl) {
  return `
  <div class="js-peek peek">
    <div
      class="js-peek-image peek-image"
      style='background-image: url("${backgroundUrl}")'
    >
    </div>
  </div>
  `;
}

function getItem(backgroundUrl, datasetUrl, index) {
  return `
    <div
      class="js-item item"
      style='background-image: url("${backgroundUrl}")'
      data-image="${datasetUrl}"
      data-index="${index}"
      tabindex="0"
    >
    </div>
  `;
}

export function list(items, startingIndex) {
  return new Promise((res) => {
    const listOfItems = [];
    items.forEach((item, index) => {
      listOfItems.push(getItem(item.backgroundUrl, item.datasetUrl, startingIndex + index));
    });

    res(listOfItems);
  });
}
