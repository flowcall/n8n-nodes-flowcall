import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { flowcallApiRequest, flowcallListTickets } from './GenericFunctions';

export class Flowcall implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Flowcall',
		name: 'flowcall',
		icon: { light: 'file:flowcall.svg', dark: 'file:flowcall.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create and list support tickets in Flowcall',
		defaults: {
			name: 'Flowcall',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'flowcallApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Ticket',
						value: 'ticket',
					},
				],
				default: 'ticket',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['ticket'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a support ticket for a customer',
						action: 'Create a ticket',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many tickets',
						action: 'Get many tickets',
					},
				],
				default: 'create',
			},

			// Ticket → Create
			{
				displayName: 'Customer Name',
				name: 'customerName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['ticket'], operation: ['create'] } },
				description: 'Full name of the customer',
			},
			{
				displayName: 'Customer Phone',
				name: 'customerPhone',
				type: 'string',
				default: '',
				placeholder: '+919876543210',
				displayOptions: { show: { resource: ['ticket'], operation: ['create'] } },
				description:
					'Customer phone number, in international format. Either phone or email is required.',
			},
			{
				displayName: 'Customer Email',
				name: 'customerEmail',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
				displayOptions: { show: { resource: ['ticket'], operation: ['create'] } },
				description: 'Customer email address. Either phone or email is required.',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				default: '',
				displayOptions: { show: { resource: ['ticket'], operation: ['create'] } },
				description: "The customer's question or a description of the issue",
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['ticket'], operation: ['create'] } },
				options: [
					{
						displayName: 'Always Create New Ticket',
						name: 'forceCreateTicket',
						type: 'boolean',
						default: false,
						description:
							'Whether to always create a new ticket. When off, an open ticket for the same customer and task is reused.',
					},
					{
						displayName: 'Image URLs',
						name: 'images',
						type: 'string',
						default: '',
						description: 'Comma-separated URLs of images related to the ticket',
					},
					{
						displayName: 'Order Number',
						name: 'orderName',
						type: 'string',
						default: '',
						description: 'Order name or order number the ticket is about',
					},
					{
						displayName: 'Related Ticket Number',
						name: 'relatedTicketNumber',
						type: 'string',
						default: '',
						description: 'Number of a related or previous ticket',
					},
					{
						displayName: 'Subject',
						name: 'subject',
						type: 'string',
						default: '',
						description: 'Short summary or title for the ticket',
					},
					{
						displayName: 'Task Name',
						name: 'taskName',
						type: 'string',
						default: '',
						description: 'Name of the Flowcall workflow task that should handle the ticket',
					},
				],
			},

			// Ticket → Get Many
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				displayOptions: { show: { resource: ['ticket'], operation: ['getAll'] } },
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				displayOptions: {
					show: { resource: ['ticket'], operation: ['getAll'], returnAll: [false] },
				},
				description: 'Max number of results to return',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['ticket'], operation: ['getAll'] } },
				options: [
					{
						displayName: 'Date Field',
						name: 'timestampKey',
						type: 'options',
						options: [
							{ name: 'Assigned At', value: 'assignedAt' },
							{ name: 'Created At', value: 'createdAt' },
							{ name: 'Resolved At', value: 'resolvedAt' },
							{ name: 'Updated At', value: 'updatedAt' },
						],
						default: 'createdAt',
						description: 'Which date the From and To filters and the sort order use',
					},
					{
						displayName: 'From',
						name: 'startDate',
						type: 'dateTime',
						default: '',
						description: 'Only tickets on or after this date',
					},
					{
						displayName: 'Order Number',
						name: 'orderName',
						type: 'string',
						default: '',
						description: 'Order name or number; separate several with commas',
					},
					{
						displayName: 'Phone Number',
						name: 'phoneNumber',
						type: 'string',
						default: '',
						description: "Customer's phone number; separate several with commas",
					},
					{
						displayName: 'Search',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Text to search for in tickets',
					},
					{
						displayName: 'Sort Order',
						name: 'sortOrder',
						type: 'options',
						options: [
							{ name: 'Newest First', value: 'desc' },
							{ name: 'Oldest First', value: 'asc' },
						],
						default: 'desc',
					},
					{
						displayName: 'Statuses',
						name: 'statuses',
						type: 'multiOptions',
						options: [
							{ name: 'Assigned', value: 'assigned' },
							{ name: 'In Progress', value: 'in_progress' },
							{ name: 'Open', value: 'open' },
							{ name: 'Queued', value: 'queued' },
							{ name: 'Resolved', value: 'resolved' },
						],
						default: [],
						description: 'Only tickets with these statuses',
					},
					{
						displayName: 'To',
						name: 'endDate',
						type: 'dateTime',
						default: '',
						description: 'Only tickets on or before this date',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'ticket' && operation === 'create') {
					const name = (this.getNodeParameter('customerName', i, '') as string).trim();
					const phone = (this.getNodeParameter('customerPhone', i, '') as string).trim();
					const email = (this.getNodeParameter('customerEmail', i, '') as string).trim();
					const query = this.getNodeParameter('query', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

					if (!phone && !email) {
						throw new NodeOperationError(
							this.getNode(),
							'Enter the customer phone or email: Flowcall needs one of them to find or create the customer',
							{ itemIndex: i },
						);
					}

					const customer: IDataObject = {};
					if (name) customer.name = name;
					if (phone) customer.phone = phone;
					if (email) customer.email = email;

					const body: IDataObject = { customer, query };
					for (const key of ['subject', 'orderName', 'taskName', 'relatedTicketNumber']) {
						const value = additionalFields[key];
						if (typeof value === 'string' && value.trim()) body[key] = value.trim();
					}
					if (additionalFields.forceCreateTicket !== undefined) {
						body.forceCreateTicket = additionalFields.forceCreateTicket;
					}
					if (typeof additionalFields.images === 'string' && additionalFields.images.trim()) {
						body.images = additionalFields.images
							.split(',')
							.map((url) => url.trim())
							.filter(Boolean);
					}

					const response = await flowcallApiRequest.call(this, 'POST', '/apis/tickets/manual', body);
					returnData.push({ json: response, pairedItem: { item: i } });
					continue;
				}

				if (resource === 'ticket' && operation === 'getAll') {
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

					const body: IDataObject = {};
					for (const [key, value] of Object.entries(filters)) {
						if (value === '' || value === undefined || value === null) continue;
						if (Array.isArray(value) && value.length === 0) continue;
						body[key] = value;
					}
					for (const key of ['startDate', 'endDate']) {
						if (body[key]) body[key] = new Date(body[key] as string).toISOString();
					}

					const max = returnAll ? undefined : (this.getNodeParameter('limit', i) as number);
					const tickets = await flowcallListTickets.call(this, body, max);
					for (const ticket of tickets) {
						returnData.push({ json: ticket, pairedItem: { item: i } });
					}
					continue;
				}

				throw new NodeOperationError(
					this.getNode(),
					`The operation "${operation}" is not supported for "${resource}"`,
					{ itemIndex: i },
				);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
