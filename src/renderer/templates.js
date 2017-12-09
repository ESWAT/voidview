export const shell = `
  <div class="js-list list"></div>
  <div class="js-edge edge"></div>
`;

function renderItem(backgroundUrl, datasetUrl, index) {
  return `
    <div
      class="js-item item"
      style="background-image: url(${backgroundUrl})"
      data-image="${datasetUrl}"
      data-index="${index}"
    >
    </div>
  `;
}

export function list(items, startingIndex) {
  return new Promise(res => {
    const list = [];
    items.map((item, index) => {
      list.push(renderItem(item.backgroundUrl, item.datasetUrl, startingIndex + index));
    });

    res(list);
  });
}

export function peek(backgroundUrl) {
  return `
  <div class="js-peek peek">
    <div
      class="js-peek-image peek-image"
      style="background-image: url(${backgroundUrl})"
    >
        <button class="js-close-peek close-peek">×</button>
    </div>
  </div>
  `
}
