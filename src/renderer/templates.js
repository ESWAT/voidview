export const layout = `
  <div id="list" class="js-list list" class="clusterize-content"></div>
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

export function list(items) {
  return new Promise((res) => {
    const listOfItems = [];
    let row = '<li class="row">';

    items.forEach((item, index) => {
      if (index % 5 === 0 && index !== 0) {
        row = row.concat('</li>');
        listOfItems.push(row);

        if (index < items.length) {
          row = '<li class="row">';
        }
      }

      row = row.concat(getItem(item.backgroundUrl, item.datasetUrl, index));
    });

    res(listOfItems);
  });
}
