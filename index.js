const fs = require("fs");
const xml2js = require("xml2js");
const { stringify } = require("javascript-stringify");
const axios = require("axios");

const url =
  "https://upload.wikimedia.org/wikipedia/commons/5/59/Usa_counties_large.svg";

const processData = data => {
  const parser = new xml2js.Parser();

  parser.parseString(data, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }

    const { svg: { g: [countyGroup] = {} } = {} } = result;
    const { path: counties = [] } = countyGroup;

    const countiesObj = counties
      .map(({ $: { id, d: path } = {}, title: [title] }) => {
        const [name, state] = title.split(",");

        return { id, path, name: name.trim(), state: state.trim() };
      })
      .filter(id => id)
      .reduce((a, { id, path, name, state }) => {
        a[id] = {
          name: name.trim(),
          state: state.trim(),
          path
        };

        return a;
      }, {});

    // TODO Do transform?
    const countiesObjCodeStr = stringify(countiesObj);
    const codeExport = `
    // Generated from Wikipedia link. https://upload.wikimedia.org/wikipedia/commons/5/59/Usa_counties_large.svg

    export default ${countiesObjCodeStr}
    `;

    fs.writeFile("usaCounties.js", codeExport, err => {
      console.log("Done");
    });
  });
};

// Use web image
axios({
  method: "get",
  url,
  responseType: "text"
}).then(({ data }) => {
  processData(data);
});

// Use a local file
// fs.readFile("./Usa_counties_large.svg", (err, data) => {
//   if (err) {
//     console.log(err);
//     return;
//   }
//   processData(data);
// });
