# 🍽️ Place Your Orders

## Overview

Place Your Orders is a Microsoft Copilot Studio solution that provides an interactive food ordering experience through a conversational AI assistant. The copilot guides users through the process of selecting meals, customizing order preferences, and submitting requests using automated Power Automate workflows.

This project demonstrates how Microsoft Copilot Studio can be integrated with Power Automate and Adaptive Cards to create an intelligent and user-friendly ordering system.

---

## Features

- Conversational food ordering experience
- Adaptive Card-based order collection
- Sandwich order processing
- Soup order processing
- Automated order handling through Power Automate
- Built with Microsoft Copilot Studio
- Power Platform Solution-based deployment
- GitHub-friendly source control structure

---

## Solution Components

### Copilot Studio Agent

The Copilot Studio agent manages the complete customer interaction lifecycle, including:

- Greeting users
- Understanding order requests
- Collecting order information
- Managing conversation flow
- Handling errors and fallback scenarios
- Escalating conversations when needed
- Confirming completed orders

### Topics

| Topic | Description |
|---------|---------|
| Greeting | Welcomes users and initiates the interaction |
| Conversation Start | Initializes the conversation session |
| Place Orders | Main ordering workflow |
| Search | Handles user search requests |
| Thank You | Confirms successful completion |
| Fallback | Handles unrecognized user inputs |
| Escalate | Transfers conversations when required |
| Goodbye | Ends the conversation |
| Reset Conversation | Clears conversation context |
| Start Over | Restarts the ordering process |
| Sign In | Supports user authentication scenarios |
| On Error | Handles unexpected system errors |

---

## Power Automate Flows

### Send Sandwich Order

Processes sandwich orders submitted by users and routes the order information to the configured destination.

### Soup Order

Processes soup orders submitted by users and routes the order information to the configured destination.

---

## Architecture

```text
User
  │
  ▼
Copilot Studio Agent
  │
  ▼
Place Orders Topic
  │
  ▼
Adaptive Card
  │
  ▼
Power Automate Flows
  ├── Send Sandwich Order
  └── Soup Order
  │
  ▼
Order Processing
```

---

## Technologies Used

- Microsoft Copilot Studio
- Microsoft Power Automate
- GitHub

---

## Repository Structure

```text
PlaceYourOrders_1_0_0_1/
│
├── Assets/
│   └── Solution metadata
│
├── botcomponents/
│   ├── Agent configuration
│   ├── System topics
│   ├── Custom topics
│   └── Topic data
│
├── Workflows/
│   ├── Send Sandwich Order
│   └── Soup Order
│
├── solution.xml
├── customizations.xml
└── [Content_Types].xml
```

---

## Installation

### Prerequisites

- Microsoft Copilot Studio
- Microsoft Power Platform Environment
- Microsoft Power Automate
- Appropriate environment permissions

### Import the Solution

1. Open Power Apps.
2. Navigate to **Solutions**.
3. Select **Import Solution**.
4. Upload the solution package.
5. Configure connection references.
6. Validate Power Automate connections.
7. Publish all customizations.

---

## Configuration

After importing the solution:

1. Update all connection references.
2. Verify Power Automate flow connections.
3. Configure environment-specific settings.
4. Test the sandwich ordering workflow.
5. Test the soup ordering workflow.
6. Publish the solution.

---

## Usage

1. Start a conversation with the copilot.
2. Select the desired meal category.
3. Provide order preferences.
4. Submit the order.
5. Receive confirmation.
6. Allow the Power Automate workflow to process the request.

---

## Example Use Case

A customer wants to place a lunch order:

1. The customer starts a conversation.
2. The copilot presents ordering options.
3. The customer selects a sandwich or soup.
4. The copilot collects customization details.
5. The order is submitted.
6. A Power Automate flow processes the request.
7. The customer receives confirmation.

---

## Future Enhancements

Potential future improvements include:

- Additional menu categories
- Order tracking functionality
- Integration with restaurant management systems
- Payment processing
- Order history
- Analytics and reporting dashboards

---

## Version Information

| Property | Value |
|-----------|---------|
| Solution Name | Place Your Orders |
| Version | 1.0.0.1 |
| Platform | Microsoft Copilot Studio |
| Deployment Type | Unmanaged Solution |

---

## Learning Objectives

This project serves as a practical example of:

- Building conversational AI experiences using Copilot Studio
- Integrating Copilot Studio with Power Automate
- Designing Adaptive Card-based user interfaces
- Managing Copilot Studio solutions in source control repositories

---

## License

This project is provided for educational, demonstration, and learning purposes.
