export const forBlock = Object.create(null);

forBlock["wait_block"] = function (block, generator) {
  const seconds = block.getFieldValue("TIME");
  // Register the import so pythonGenerator emits it at the top
  generator.definitions_["import_time"] = "import time";
  const code = "time.sleep(" + seconds + ")\n";
  return code;
};
