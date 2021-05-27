import browser from '../libs/browser';
// import EventEmitter from "../libs/events";
import EventEmitter from "events";
import {WebRequest} from 'webextension-polyfill-ts/lib/webRequest'

interface Tracker {
	startTracking(): void;
	stopTracking(): void;
	toggleTracking(): boolean;
}

const throttle: (func: (...args: any[]) => void, ms: number) => () => void = (func, ms) => {
	let lastSaved = 0;
	let timeout: ReturnType<typeof setTimeout>;

	const throttledFunc = (...args: any[]) => {
		if (lastSaved + ms <= Date.now()) {
			lastSaved = Date.now();
			func(...args);
		} else {
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => {
				throttledFunc(...args);
			},(lastSaved + ms) - Date.now());
		}
	};
	return throttledFunc;
};

export default class RequestTracker extends EventEmitter.EventEmitter implements Tracker {
	readonly #tabId: number;
	#isTracking: boolean;
	private readonly cacheRequests: () => void;
	#requestsList: {[requestId: string]: {
		request: WebRequest.OnBeforeRequestDetailsType,
		response?: WebRequest.OnCompletedDetailsType,
		debugResponseBody?: any,
	}} = {}
	#debuggee: any
	// #requestsList: Map<string, {
	// 	request: WebRequest.OnBeforeRequestDetailsType,
	// 	response: WebRequest.OnCompletedDetailsType
	// }> = new Map();
	requestHandler: (request: WebRequest.OnBeforeRequestDetailsType) => void
	responseHandler: (response: WebRequest.OnCompletedDetailsType) => void
	constructor(tabId: number) {
		super();
		this.#tabId = tabId;
		this.#isTracking = false;
		this.cacheRequests = throttle(async () => {
			const saveState: {[s:string] : any} = {[`tabId_${tabId}`]: JSON.stringify(this.#requestsList)}
			console.log(this.#requestsList)
			browser.storage.local.set(saveState);
		}, 750);
		this.requestHandler = (request: WebRequest.OnBeforeRequestDetailsType) => {
			const {requestId, frameId} = request
			this.#requestsList[requestId] = {request}
			this.cacheRequests()
		}
		this.responseHandler = (response: WebRequest.OnCompletedDetailsType) => {
			const {requestId, frameId} = response
			this.#requestsList[requestId].response = response
			this.cacheRequests()
		}
	}
	startTracking() {
		if (!this.#isTracking) {
			const filter = {
				urls: ["<all_urls>"],
				tabId: this.#tabId,
			}
			browser.webRequest.onBeforeRequest.addListener(
				this.requestHandler,
				filter,
				["requestBody", "extraHeaders"]
			);
			browser.webRequest.onCompleted.addListener(
				this.responseHandler,
				filter,
				["responseHeaders", "extraHeaders"]
			);
			// @ts-ignore
			browser.debugger.getTargets(targets => {
				targets.forEach(({id, attached, url}: {id: string, attached: boolean, url: string}) => {
					if (!attached && url.includes('thebodyshop')) {
						// @ts-ignore
						browser.debugger.attach({ //debug at current tab
							targetId: id
						}, '1.0', this.debuggerFetch.bind(this, id));
					}
				})
			});
			// browser.debugger.attach({ //debug at current tab
			// 	// tabId: this.#tabId
			// }, '1.0', this.debuggerFetch.bind(this));
			this.#isTracking = true;
		}
	}
	debugger() {
		console.log('start debugging', this.#tabId)
		// @ts-ignore
		browser.debugger.sendCommand({ //first enable the Network
			tabId: this.#tabId
		}, "Network.enable");

		// @ts-ignore
		browser.debugger.onEvent.addListener((debuggeeId, message, params) => {
			this.#debuggee = debuggeeId
			// if (this.#tabId != debuggeeId.tabId) {
			// 	return;
			// }

			if (message == "Network.responseReceived") { //response return

				console.log({debuggeeId, message, params})
				// @ts-ignore
				// browser.debugger.sendCommand({
				// 	tabId: debuggeeId.tabId
				// }, "Network.getResponseBody", {
				// 	"requestId": params.requestId
				// }, (response: any) => {
				// 	console.log('Network.getResponseBody ', response)
				// 	// you get the response body here!
				// 	// you can close the debugger tips by:
				// 	if (this.#requestsList[params.requestId]) {
				// 		this.#requestsList[params.requestId].debugResponseBody = response
				// 	}
				// });
				// @ts-ignore
				browser.debugger.sendCommand({
					tabId: debuggeeId.tabId
				}, "Network.getResponseBodyForInterception", {
					"requestId": params.requestId
				}, (response: any) => {
					console.log('Network.getResponseBodyForInterception', response)
					// you get the response body here!
					// you can close the debugger tips by:
					if (this.#requestsList[params.requestId]) {
						this.#requestsList[params.requestId].debugResponseBody = response
					}
				});
			}
		});
	}
	debuggerFetch(id: string) {
		console.log('start fetch debugging', this.#tabId)
		// @ts-ignore
		browser.debugger.sendCommand({ //first enable the Network
			targetId: id
		}, "Fetch.enable", {
			patterns: [{requestStage: "Response"}]
		});

		// @ts-ignore
		browser.debugger.onEvent.addListener((debuggeeId, message, params) => {
			// this.#debuggee = debuggeeId
			// console.log('any debug event', {debuggeeId, message, params})
			// if ((this.#tabId != debuggeeId.tabId) && debuggeeId.tabId) {
			// 	return;
			// }

			if (message == "Fetch.requestPaused" && params.request && params.request.url && params.request.url.includes('voucherId')) { //response return
				// @ts-ignore
				browser.debugger.sendCommand({
					targetId: id
				}, "Fetch.getResponseBody",{
					requestId: params.requestId

				}, (...args: any[]) => {
					console.log('in Fetch.getResponseBody', ...args, params)
				})
			}
			// @ts-ignore
			browser.debugger.sendCommand({
				targetId: id
			}, "Fetch.continueRequest",{
				requestId: params.requestId
			}, (...args: any[]) => {
				// console.log('in Fetch.continueRequest', ...args)
			})
		});
	}
	stopTracking() {
		if (this.#isTracking) {
			browser.webRequest.onBeforeRequest.removeListener(this.requestHandler)
			browser.webRequest.onCompleted.removeListener(this.responseHandler)
			if (this.#debuggee) {
				// @ts-ignore
				// browser.debugger.detach(this.#debuggee);
			}
			this.#isTracking = false;
		}
		console.log(`stopped tracking${this.#tabId}`)
	}
	toggleTracking(): boolean {
		if (this.#isTracking) {
			this.stopTracking();
		} else {
			this.startTracking();
		}
		return this.#isTracking;
	}

}