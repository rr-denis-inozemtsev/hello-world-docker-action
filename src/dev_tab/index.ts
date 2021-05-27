import 'zone.js/dist/zone';
import browser from "../libs/browser";
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app.module';

const onPageLoaded = () => {
	if (document.readyState === 'complete') {
		return Promise.resolve();
	} else {
		return new Promise(res => {
			window.addEventListener('DOMContentLoaded', res);
		});
	}
};

onPageLoaded().then(async () => {
	try {
		platformBrowserDynamic().bootstrapModule(AppModule);
	} catch (err) {
		console.error(err);
	}
	browser.devtools.network.onRequestFinished.addListener((...args) => {
		browser.devtools.inspectedWindow.eval(`console.log('${JSON.stringify(...args)}'))`);
	})
	// await browser.runtime.sendMessage({name: 'start tracking'});
	// console.log('message sent');

});
