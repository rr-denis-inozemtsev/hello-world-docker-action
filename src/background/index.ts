import {Browser} from 'webextension-polyfill-ts';
import Tracker from './RequestTracker';
import {ExtensionEvents} from "../enums";

// @ts-ignore
const browser:Browser = window.browser;
(async () => {
	const tabsManager:Map<number, Tracker> = new Map()
	browser.runtime.onMessage.addListener(async (message, sender) => {
		console.log('message received', {message});
		const name = message.name;
		if (name === ExtensionEvents.StartTracking) {
			const tabsArr = await browser.tabs.query({});
			const currentTab = tabsArr.find(({id}) => id === message.tabId);
			if (currentTab.id) {
				const tracker = new Tracker(currentTab.id);
				// tabsManager.set(currentTab.id, tracker)
				tracker.startTracking();
			}
		}
		if (name === ExtensionEvents.GetCachedRequests) {
			// TODO: implement it
		}
		return true;
	});

	browser.webNavigation.onBeforeNavigate.addListener(async ({tabId}) => {
		if (tabsManager.has(tabId)) {
			tabsManager.get(tabId).stopTracking()
			tabsManager.delete(tabId)
		}
		// const tabsArr = await browser.tabs.query({});

		const tracker = new Tracker(tabId);
		tabsManager.set(tabId, tracker)
		tracker.startTracking();
		// const currentTab = tabsArr.find(({id}) => id === tabId);
		// if (currentTab.id) {
		// 	const tracker = new Tracker(currentTab.id);
		// 	// tabsManager.set(currentTab.id, tracker)
		// 	tracker.startTracking();
		// }
	})

})();

