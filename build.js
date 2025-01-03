#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { mkdirSync, readdirSync } from 'node:fs';
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

const formats = options.format?.length ? options.format : ['esm', 'cjs'];
const platforms = options.platform?.length ? options.platform : ['node', 'browser'];

const date = new Date();

const banner = {
	js: `/* Generated using @zenfs/bundle (${date.getUTCFullYear()}.${date.getUTCMonth() + 1}.${date.getUTCDate()}) */`,
};

const entryDir = join(import.meta.dirname, 'entry');

const entryPoints = readdirSync(entryDir);

// Create a single array of entry points, formats, and platforms

const bundles = entryPoints.flatMap(entryPoint =>
	formats.flatMap(format =>
		platforms.map(platform => ({
			entryPoint,
			format,
			platform,
		}))
	)
);

options.verbose && console.log('Building', bundles.length * 2, 'bundles...');

function color(text, n) {
	return `\x1b[${n}m${text}\x1b[0m`;
}

const init = performance.now();

for (const { format, platform, entryPoint } of bundles) {
	const { name: packageName } = parse(entryPoint);

	mkdirSync(join(options.output, format), { recursive: true });

	const config = { globalName: 'ZenFS', bundle: true, entryPoints: [join(entryDir, entryPoint)], platform, format, banner, target };

	const start = performance.now();

	const name = `${format}/${packageName}.${platform}`;

	const prefix = join(options.output, name);

	await build({ ...config, outfile: prefix + '.js' });

	const mid = performance.now();

	// Color the time

	options.verbose && console.log(`Built: ${name} (${color(Math.round(mid - start), 34)} ms)`);

	await build({ ...config, outfile: prefix + '.min.js', minify: true });

	options.verbose && console.log(`Built: ${name}.min (${color(Math.round(performance.now() - mid), 34)} ms)`);
}

options.verbose && console.log('Built', bundles.length * 2, 'bundles in', Math.round(performance.now() - init), 'ms');
