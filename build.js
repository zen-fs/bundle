#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, parse } from 'node:path/posix';
import { build } from 'esbuild';

const { values: options } = parseArgs({
	options: {
		help: { short: 'h', type: 'boolean' },
		verbose: { short: 'v', type: 'boolean' },
		output: { short: 'o', type: 'string', default: 'dist' },
		platform: { short: 'p', type: 'string', multiple: true },
		format: { short: 'f', type: 'string', multiple: true },
		target: { short: 't', type: 'string', multiple: true },
	},
});

if (options.help) {
	console.log(`Usage: @zenfs/bundle [options]

Options:
	-h, --help      Show this help message
	-v, --verbose   Show verbose output
	-o, --output    Output directory
	-p, --platform  Platform to target (node, browser)
	-f, --format    Module format (esm, cjs, iife)
	-t, --target    Target environment (node, chrome, firefox, safari, edge, ie11)`);
	process.exit(0);
}

const target = options.target?.flatMap(target => target.split(','));

const formats = options.format?.length ? options.format : ['esm', 'cjs', 'iife'];
const platforms = options.platform?.length ? options.platform : ['node', 'browser'];

const date = new Date();

const banner = {
	js: `/* Generated using @zenfs/bundle (${date.getUTCFullYear()}.${date.getUTCMonth() + 1}.${date.getUTCDate()}) */`,
};

const entryDir = join(import.meta.dirname, 'entry');

const entryPoints = readdirSync(entryDir);

function flatMatrix(options) {
	// Start by turning the first key's array into an array of objects
	return Object.entries(options).reduce((current, [key, values], index) => {
		// Initialize with the first array of values
		if (index == 0) return values.map(value => ({ [key]: value }));

		// For each current object, produce new objects for each value
		return current.flatMap(currentObj => values.map(value => ({ ...currentObj, [key]: value })));
	}, []);
}

function color(text, n) {
	return `\x1b[${n}m${text}\x1b[0m`;
}

const { format: formatNumber } = new Intl.NumberFormat('en-US', {
	style: 'unit',
	unit: 'byte',
	unitDisplay: 'narrow',
	notation: 'compact',
	compactDisplay: 'short',
	compactDisplay: 'short',
});

const bundles = flatMatrix({
	format: formats,
	platform: platforms,
	entryPoint: entryPoints,
	minify: [false, true],
});

options.verbose && console.log('Building', bundles.length, 'bundles...');

const init = performance.now();

for (const { format, platform, entryPoint, minify } of bundles) {
	const { name: packageName } = parse(entryPoint);

	mkdirSync(join(options.output, format), { recursive: true });

	const start = performance.now();

	const name = `${format}/${packageName}.${platform}${minify ? '.min' : ''}`;

	const prefix = join(options.output, name);

	await build({
		globalName: packageName == 'all' ? 'ZenFS' : 'ZenFS_' + packageName,
		bundle: true,
		outfile: prefix + '.js',
		entryPoints: [join(entryDir, entryPoint)],
		platform,
		format,
		banner,
		target,
		minify,
	});

	const time = color(Math.round(performance.now() - start), 34),
		size = color(formatNumber(statSync(prefix + '.js').size), 33);

	options.verbose && console.log(`Built: ${name} (${time} ms, ${size})`);
}

options.verbose && console.log('Built', bundles.length, 'bundles in', Math.round(performance.now() - init), 'ms');
