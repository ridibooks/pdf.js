/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var fs = require('fs');
var https = require('https');
var path = require('path');

// Defines all languages that have a translation at mozilla-aurora.
// This is used in make.js for the importl10n command.
var langCodes = ['ko'];

function normalizeText(s) {
  return s.replace(/\r\n?/g, '\n').replace(/\uFEFF/g, '');
}

function downloadLanguageFiles(root, langCode, callback) {
  console.log('Downloading ' + langCode + '...');

  // Constants for constructing the URLs. Translations are taken from the
  // Aurora channel as those are the most recent ones. The Nightly channel
  // does not provide all translations.
  var MOZ_AURORA_ROOT = 'https://hg.mozilla.org/releases/l10n/mozilla-aurora/';
  var MOZ_AURORA_PDFJS_DIR = '/raw-file/tip/browser/pdfviewer/';

  // Defines which files to download for each language.
  var files = ['chrome.properties', 'viewer.properties'];
  var downloadsLeft = files.length;

  var outputDir = path.join(root, langCode);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Download the necessary files for this language.
  files.forEach(function(fileName) {
    var outputPath = path.join(outputDir, fileName);
    var url = MOZ_AURORA_ROOT + langCode + MOZ_AURORA_PDFJS_DIR + fileName;

    https.get(url, function(response) {
      var content = '';
      response.setEncoding('utf8');
      response.on('data', function(chunk) {
        content += chunk;
      });
      response.on('end', function() {
        fs.writeFileSync(outputPath, normalizeText(content), 'utf8');
        downloadsLeft--;
        if (downloadsLeft === 0) {
          callback();
        }
      });
    });
  });
}

function downloadL10n(root, callback) {
  var i = 0;
  (function next() {
    if (i >= langCodes.length) {
      if (callback) {
        callback();
      }
      return;
    }
    downloadLanguageFiles(root, langCodes[i++], next);
  })();
}

exports.downloadL10n = downloadL10n;
