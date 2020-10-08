'use strict';

const path = require('path');
const {readFile, writeFile} = require('fs');
const {minify} = require('uglify-js');

const INPUT_FILE = path.resolve(__dirname, 'frontend.js');
const OUTPUT_FILE = path.resolve(__dirname, 'frontend.min.js');

/* eslint-disable unicorn/no-process-exit */
readFile(INPUT_FILE, 'utf8', (error, file) => {
	if (error) {
		console.error(error);
		process.exit(1);
	}

	const result = minify(file, {
		warnings: true,
		sourceMap: {
			filename: INPUT_FILE,
			url: 'frontend.min.js.map'
		}
	});

	if (result.error) {
		console.error(result.error);
		process.exit(2);
	}

	if (result.warnings) {
		console.warn('warnings found');
		console.warn(result.warnings);
	}

	writeFile(OUTPUT_FILE, result.code, writeError => {
		if (writeError) {
			console.error(error);
			process.exit(4);
		}

		writeFile(`${OUTPUT_FILE}.map`, result.map, mapWriteError => {
			if (mapWriteError) {
				console.error(error);
				process.exit(5);
			}

			console.log('Successfully compiled file');
			process.exit(0);
		});
	});
});

/* eslint-enable unicorn/no-process-exit */
