# n8n-nodes-flowcall

This is an n8n community node for [Flowcall](https://www.flowcall.co/). It lets you create and list support tickets in Flowcall from your n8n workflows, and start a workflow when a ticket is created or resolved.

Flowcall is an omnichannel AI customer service platform: an AI agent for your customers and a customer service CRM for your agents, in one.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [Operations](#operations)
- [Trigger](#trigger)
- [Compatibility](#compatibility)
- [Resources](#resources)
- [Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation and install `n8n-nodes-flowcall`.

## Credentials

You need a Flowcall access token.

1. In the Flowcall dashboard, open **Settings → Integrations** and create an access token.
2. In n8n, create a **Flowcall API** credential and paste the token.

n8n tests the credential by listing one ticket. Keep the token secret: it gives access to your Flowcall account.

## Operations

**Ticket**

- **Create**: create a support ticket for a customer. Give the customer's phone or email (and name, if you have it) and their query. Optional fields: subject, order number, Flowcall task name, related ticket number, image URLs, and whether to always create a new ticket instead of reusing an open one for the same customer and task.
- **Get Many**: list tickets, newest or oldest first, filtered by status, date range (created, updated, resolved or assigned), customer phone, order number or search text.

## Trigger

The **Flowcall Trigger** node checks Flowcall on n8n's polling schedule and starts the workflow for:

- **New Ticket**: each ticket created since the last check.
- **Ticket Resolved**: each ticket resolved since the last check.

Each ticket is sent once. When you test the trigger in the editor, it returns the latest matching ticket.

## Compatibility

Built for n8n 1.x (community nodes API version 1) and Flowcall's public API (`https://api.flowcall.co`). Flowcall's ticket creation API allows 10 requests a minute, 200 an hour and 1,000 a day.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Flowcall developer API](https://docs.flowcall.co/developers)
- [Flowcall ticket APIs](https://docs.flowcall.co/api/tickets)

## Version history

- **0.1.0**: Ticket Create and Get Many; Flowcall Trigger for new and resolved tickets.
