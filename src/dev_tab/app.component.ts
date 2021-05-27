import { Component } from '@angular/core';
import template from './button.component.html';
import browser from '../libs/browser';
import {ExtensionEvents} from "../enums";
import {Observable, Subscriber} from 'rxjs'

@Component({
	selector: 'my-app',
	// template: '<a (click)="toggleTracker()">kek</a>',
	templateUrl: './button.component.html',
	// styleUrls: [ './app.component.css' ]
})
export class AppComponent {
	cache: string[] = []
	urls: Observable<string[]> = new Observable<string[]>(observer => {
		(async () => {
			const cachedRequests: string[] = await browser.runtime.sendMessage({
				name: ExtensionEvents.GetCachedRequests,
				// tabId,
			});
			this.cache = this.cache.concat(cachedRequests)
			observer.next(this.cache)
		})()
		browser.devtools.network.onRequestFinished.addListener((request) => {
			// @ts-ignore
			this.cache.push(request.request.url)
			observer.next(this.cache)
			// @ts-ignore
			console.log(request.request.url)
		})
	})
	async toggleTracker() {
		const tabId = browser.devtools.inspectedWindow.tabId;
		await browser.runtime.sendMessage({
			name: ExtensionEvents.StartTracking,
			tabId,
		});
		console.log('started stacking')
	}
}