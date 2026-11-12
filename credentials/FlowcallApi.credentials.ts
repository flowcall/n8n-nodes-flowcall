import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class FlowcallApi implements ICredentialType {
	name = 'flowcallApi';

	displayName = 'Flowcall API';

	icon: Icon = {
		light: 'file:../nodes/Flowcall/flowcall.svg',
		dark: 'file:../nodes/Flowcall/flowcall.dark.svg',
	};

	documentationUrl = 'https://docs.flowcall.co/developers';

	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Create an access token in the Flowcall dashboard under Settings → Integrations. Keep it secret: it gives access to your Flowcall account.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.flowcall.co',
			url: '/apis/task-runs/tickets/list',
			method: 'POST',
			body: { page: 1, limit: 1 },
		},
	};
}
