/*! @license MIT ©2014-2016 Ruben Verborgh, Ghent University - imec */
/* An CsvwDatasource fetches data from a JSON-LD document. */

let MemoryDatasource = require('@ldf/core').datasources.MemoryDatasource,
    CsvwParser = require('rdf-parser-csvw'),
    JsonLdParser = require('jsonld-streaming-parser').JsonLdParser,
    rdf = require('@rdfjs/dataset');

let ACCEPT = 'text/csv;q=1.0';
let ACCEPT_CSVW = 'application/csvm+json;q=1.0,application/ld+json;q=0.9,application/json;q=0.7';

function promiseCsvwMetadata(input) {
  return new Promise((resolve, reject) => {
    let metadata = rdf.dataset();
    let parser = new JsonLdParser()
      .import(input)
      .on('error', (error) => { reject(error); })
      .on('data', (quad) => { metadata.add(quad); })
      .on('end', () => { resolve(metadata); });
  });
}

// Creates a new CsvwDatasource
class CsvwDatasource extends MemoryDatasource {
  constructor(options) {
    super(options);
    this._url = options && (options.url || options.file);

    options = options || {};
    this._metadata = options.metadata;
  }

  // Retrieves all quads from the document
  _getAllQuads(addQuad, done) {
    let document = this._fetch({ url: this._url, headers: { accept: ACCEPT } });
    let metadataDocument = this._fetch({ url: this._metadata, headers: { accept: ACCEPT_CSVW } });

    let metadata = promiseCsvwMetadata(metadataDocument);

    return metadata.then((md) => {
      new CsvwParser({ dataFactory: this.dataFactory, url: this._url, metadata: metadata })
        .import(document)
        .on('error', done)
        .on('data', addQuad)
        .on('end', done);
    });
  }
}

module.exports = CsvwDatasource;
