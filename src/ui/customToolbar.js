export function addCustomToolbar() {
  const categories = document.querySelectorAll(".blocklyToolboxCategory");

  categories.forEach((category, index) => {
    const newDiv = document.createElement("div");
    newDiv.innerText = "";
    newDiv.id = "color-" + ++index;

    category.insertBefore(newDiv, category.firstElementChild);
  });
}
