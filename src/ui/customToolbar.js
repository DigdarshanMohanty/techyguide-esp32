// injects color-coded circle icons into blockly toolbox categories
export function addCustomToolbar() {
  const categories = document.querySelectorAll(".blocklyToolboxCategory");

  categories.forEach((category, index) => {
    const newDiv = document.createElement("div");
    newDiv.id = "color-" + (index + 1);

    category.insertBefore(newDiv, category.firstElementChild);
  });
}
