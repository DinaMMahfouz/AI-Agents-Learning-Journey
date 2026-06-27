# 🏖️ HR Leave Management Agent

An AI-powered HR self-service assistant built with Microsoft Copilot Studio and Power Automate that enables employees to access HR policies, review employee benefits, and submit vacation requests through a conversational experience.

## Overview

The HR Leave Management Agent simplifies employee interactions with Human Resources by providing instant access to HR information and automating leave request submissions.

Using Microsoft Copilot Studio, and Power Automate, the solution allows employees to:

* View vacation policies
* Review employee benefits
* Submit vacation requests
* Receive automated confirmations
* Access HR information through natural language conversations

## Features

* Conversational HR assistant
* Vacation request submission
* Employee benefits information lookup
* HR policy knowledge base integration
* Power Automate workflow integration
* Automated request processing
* User-friendly conversational interface

## Workflow

<p align="center">
  <img src="Workflow_HR Leave.png" alt="HR Leave Management Workflow" width="900"/>
</p>

```text
Employee
   │
   ▼
HR Leave Management Agent
   │
   ├── HR Policy Questions
   │         │
   │         ▼
   │    Knowledge Base
   │
   └── Vacation Request
             │
             ▼
      Collect Leave Details
             │
             ▼
      Power Automate Flow
             │
             ▼
      Request Processing
             │
             ▼
      Confirmation
```

## Technology Stack

* Microsoft Copilot Studio
* Microsoft Power Automate
* GitHub

## Copilot Studio Topics

* Greeting
* Conversation Start
* Vacation Policy
* Book a Vacation
* Search
* Thank You
* Fallback
* Escalate
* Goodbye
* Reset Conversation

## Power Automate

* Vacation Request Processing Workflow
* Automated Notifications
* Request Submission Handling

## Repository Structure
│
├── README.md
├── Assets/
├── botcomponents/
├── Workflows/
├── solution.xml
├── customizations.xml
└── [Content_Types].xml

## Installation

1. Open Power Apps.
2. Navigate to Solutions.
3. Select Import Solution.
4. Upload the managed solution package.
5. Configure connection references.
6. Validate Power Automate connections.
7. Publish all customizations.

## Usage

### View Vacation Policy

Ask questions such as:

* What is the annual leave policy?
* How many vacation days do employees receive?
* What is the leave approval process?

### Submit a Vacation Request

Provide:

* Start Date
* End Date
* Additional Notes

The agent automatically processes the request through Power Automate and returns a confirmation message.

## Future Enhancements

* Leave balance tracking
* Manager approval workflow
* Outlook Calendar integration
* Microsoft Teams integration
* Employee profile lookup
* Analytics dashboard
* Multi-language support

## Learning Objectives

This project demonstrates:

* Conversational AI development using Microsoft Copilot Studio
* Knowledge source integration
* Power Automate workflow automation
* HR process automation

## Author

Developed using Microsoft Copilot Studio and Microsoft Power Platform to demonstrate AI-powered HR self-service and leave management automation.
