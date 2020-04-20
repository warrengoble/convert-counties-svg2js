const fs = require("fs");
const xml2js = require("xml2js");
const axios = require("axios");

const url =
  "https://upload.wikimedia.org/wikipedia/commons/5/59/Usa_counties_large.svg";

const processData = (data) => {
  const parser = new xml2js.Parser();

  parser.parseString(data, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }

    const {
      svg: {
        $: { width: mapWidth, height: mapHeight } = {},
        g,
        g: [
          countyGroup,
          { path: [{ $: { d: pathSeparator } = {} } = {}] = [] },
        ] = {},
        ...rest
      } = {},
    } = result;
    const { path: counties = [] } = countyGroup;
    const {
      path,
      path: [{ $: { d: pathBorders } = {} } = {}],
      metadata: [{ "rdf:RDF": rdf } = {}],
    } = rest;

    const [
      {
        "cc:Work": [
          {
            "cc:license": [{ $: { "rdf:resource": license } = {} } = {}] = [],
            "dc:creator": [
              { "cc:Agent": [{ "dc:title": [title] = [] }] = [] } = {},
            ] = [],
          },
        ] = [],
      },
    ] = rdf;

    const countiesObj = counties
      .map(({ $: { id, d: path } = {}, title: [{ _: title } = {}] }) => {
        const [name, state] = title.split(",");

        return { id, path, name: name.trim(), state: state.trim() };
      })
      .filter((id) => id)
      .reduce((a, { id, path, name, state }) => {
        const cleanId = Number(id.replace(/\D+/g, ""));

        a[cleanId] = {
          name: name.trim(),
          state: state.trim(),
          path,
        };

        return a;
      }, {});

    const jsonPayload = JSON.stringify(
      {
        title,
        license,
        pathBorders,
        pathSeparator,
        mapWidth,
        mapHeight,
        counties: countiesObj,
      },
      null,
      2
    );

    // Export JSON
    fs.writeFile("usaCounties.json", jsonPayload, (err) => {
      if (err) {
        console.log("err", err);
        return;
      }
      console.log("JSON data export. Done.");
    });
  });
};

axios({
  method: "get",
  url,
  responseType: "text",
}).then(({ data }) => {
  processData(data);
});
