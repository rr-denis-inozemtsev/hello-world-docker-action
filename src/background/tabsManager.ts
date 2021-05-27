import Tab from './tabModel';
import browser from '../libs/browser';

export default class TabsManager {
	private tabs: Map<number, Tab>;
	constructor() {
		this.tabs = new Map();
		browser.tabs.query({}).then(tabs => {
			for (const {id, url} of tabs) {
				this.tabs.set(id, new Tab(id, url));
			}
		});
		browser.tabs.onCreated.addListener(({id, url}) => {
			this.tabs.set(id, new Tab(id, url));
		});
		browser.tabs.onRemoved.addListener((id) => {
			this.tabs.delete(id);
		});
	}
	get(tabId: number) {
		return this.tabs.get(tabId);
	}
}