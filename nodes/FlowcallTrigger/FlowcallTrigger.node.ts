import type {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { flowcallApiRequest, flowcallListTickets } from '../Flowcall/GenericFunctions';

/** How many recently seen ticket IDs to remember, so a ticket is never emitted twice. */
const SEEN_IDS_TO_KEEP = 1000;

export class FlowcallTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Flowcall Trigger',
		name: 'flowcallTrigger',
		icon: { light: 'file:flowcall.svg', dark: 'file:flowcall.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when a Flowcall ticket is created or resolved',
		defaults: {
			name: 'Flowcall Trigger',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'flowcallApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				required: true,
				options: [
					{
						name: 'New Ticket',
						value: 'newTicket',
						description: 'Triggers when a ticket is created',
					},
					{
						name: 'Ticket Resolved',
						value: 'ticketResolved',
						description: 'Triggers when a ticket is resolved',
					},
				],
				default: 'newTicket',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const event = this.getNodeParameter('event') as string;
		const timestampKey = event === 'ticketResolved' ? 'resolvedAt' : 'createdAt';
		const statusFilter: IDataObject = event === 'ticketResolved' ? { statuses: ['resolved'] } : {};

		// When testing the trigger in the editor, return the latest matching ticket.
		if (this.getMode() === 'manual') {
			const response = await flowcallApiRequest.call(this, 'POST', '/apis/task-runs/tickets/list', {
				...statusFilter,
				timestampKey,
				sortOrder: 'desc',
				page: 1,
				limit: 1,
			});
			const latest = (response.data as IDataObject[] | undefined) ?? [];
			return latest.length ? [this.helpers.returnJsonArray(latest)] : null;
		}

		const staticData = this.getWorkflowStaticData('node');
		const now = new Date().toISOString();
		const since = (staticData.lastTimeChecked as string | undefined) ?? now;
		const seen = new Set((staticData.seenIds as string[] | undefined) ?? []);

		const tickets = await flowcallListTickets.call(this, {
			...statusFilter,
			timestampKey,
			sortOrder: 'asc',
			startDate: since,
			endDate: now,
		});

		const fresh = tickets.filter((ticket) => !seen.has(String(ticket.id)));
		for (const ticket of fresh) seen.add(String(ticket.id));

		staticData.lastTimeChecked = now;
		staticData.seenIds = [...seen].slice(-SEEN_IDS_TO_KEEP);

		return fresh.length ? [this.helpers.returnJsonArray(fresh)] : null;
	}
}
