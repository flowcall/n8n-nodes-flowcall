import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IPollFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export const FLOWCALL_BASE_URL = 'https://api.flowcall.co';

/** The ticket list endpoint returns at most 250 tickets per page. */
export const MAX_PAGE_SIZE = 250;

export async function flowcallApiRequest(
	this: IExecuteFunctions | IPollFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${FLOWCALL_BASE_URL}${endpoint}`,
		body,
		json: true,
		headers: { Accept: 'application/json' },
	};

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'flowcallApi',
			options,
		)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Lists tickets page by page. Stops when `max` tickets have been collected
 * (if given) or when the last page has been read.
 */
export async function flowcallListTickets(
	this: IExecuteFunctions | IPollFunctions,
	filters: IDataObject,
	max?: number,
): Promise<IDataObject[]> {
	const tickets: IDataObject[] = [];
	let page = 1;
	let totalPages = 1;

	do {
		const remaining = max === undefined ? MAX_PAGE_SIZE : max - tickets.length;
		const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, remaining));
		const response = await flowcallApiRequest.call(this, 'POST', '/apis/task-runs/tickets/list', {
			...filters,
			page,
			limit,
		});
		const data = (response.data as IDataObject[] | undefined) ?? [];
		tickets.push(...data);
		totalPages = Number(response.totalPages ?? 1);
		page += 1;
		if (data.length === 0) break;
	} while (page <= totalPages && (max === undefined || tickets.length < max));

	return max === undefined ? tickets : tickets.slice(0, max);
}
