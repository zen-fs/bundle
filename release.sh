#!/usr/bin/bash

# Update dependencies

UPDATE=$(npm outdated --json | jq -r 'to_entries[] | .key + " " + .value.current + " -> " + .value.latest')

if [[ -z $UPDATE ]]; then
	echo "No updates available."
else

	echo -e "Updating dependencies:\n$UPDATE"

	read -p "Proceed with update? (y/N) " -n 1 -r
	echo ""

	if [[ $REPLY =~ ^[Yy]$ ]]
	then
		npm install @zenfs/archives@latest @zenfs/cloud@latest @zenfs/core@latest @zenfs/dom@latest @zenfs/emscripten@latest
		git commit -am "$(echo -e "Updated dependencies\n$UPDATE")"
	else
		echo "Update aborted."
		exit
	fi
fi

# x.x.x-date-yyyy.mm.dd
npm version 1.0.0-date-$(date +%Y.%m.%d)

npm publish --dry-run --tag latest

read -p "Do you want to continue and publish? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
	npm publish --tag latest
else
	echo "Publish aborted."
fi
