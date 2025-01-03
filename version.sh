#!/usr/bin/bash

# x.x.x-date-yyyy.mm.dd
npm version 1.0.0-date-$(date +%Y.%m.%d)

npm publish --access public --dry-run --tag latest

read -p "Do you want to continue and publish? (y/N) " -n 1 -r

if [[ $REPLY =~ ^[Yy]$ ]]
then
	npm publish --access public --tag latest
else
	echo "Publish aborted."
fi
