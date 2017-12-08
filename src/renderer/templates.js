export const shell = `
  <div class="js-list list"></div>
`;

function renderItem(backgroundUrl, datasetUrl) {
  return `
    <div
      class="js-item item"
      style="background-image: url(${backgroundUrl})"
      data-image="${datasetUrl}"
    >
    </div>
  `;
}

export function list(items, callback) {
  return new Promise(res => {
    const list = [];
    items.map(item => {
      list.push(renderItem(item.backgroundUrl, item.datasetUrl));
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
