# Monday Automation Template

This script is designed to automate the creation and renaming of directory structures and files based on data fetched from the Monday.com API. It also includes functionality to apply labels to folders and handle webhook events.

## Features

- Fetches data from Monday.com using a GraphQL query.
- Creates and renames directories and files based on Monday.com pulse data.
- Applies a green label to newly created folders (macOS-specific).
- Handles webhook events from Monday.com.
- Includes a simple HTTP server to listen for POST requests.

## Prerequisites

- Node.js installed on your system.
- [ngrok](https://ngrok.com/downloads/mac-os) installed and running on your system 
- Have a Monday.com webhook that points to the ngrok URL
- `fs-extra` package for file system operations.
- macOS (for the folder labeling feature using AppleScript).
- A valid Monday.com API key.

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-repo/monday-template.git
   cd monday-template
   ```

2. Install dependencies
   ```bash
   npm install fs-extra
   ```

3. Replace placeholders in the script:
    * Replace API KEY GOES HERE with your Monday.com API key.
    * Replace Source Template Folder Path Goes Here with the path to your source template folder.
    * Replace Destination Folder Path Goes Here with the path to your destination folder.

## Usage

1. Start the server:
    ```bash
    node Monday_Automation_Template.js
    ```

2. Start ngrok:
    ```bash
    ngrok http 80
    ```

3. Copy the forwarding address provided by ngrok and add it into your Monday automation as the Webhook URL

4. You should now be able to update the Monday board and see the Automation run