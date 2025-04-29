const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

let CREATED = null

async function copyAndRenameDirectory(sourceDir, newRootName) {
    try {

      // Destination Folder to Copy to
      const dirName = 'Destination Folder Path Goes Here';

      // Define the destination directory
      const destinationDir = path.join(dirName, newRootName);
  
      // Copy the source directory to the destination directory
      await fs.copy(sourceDir, destinationDir);

      // Give new root folder a green label
      applyGreenLabelToFolder(destinationDir);
  
      console.log(`Copied directory to: ${destinationDir}`);

      // ---------- Rename After Effects and Premiere template projects ---------- //
  
      // Define the source file path
      const sourceAEFilePath = path.join(destinationDir, '00_PROJECTS', 'AFTER EFFECTS', `${path.basename(sourceDir)}.aep`);
      const sourcePPFilePath = path.join(destinationDir, '00_PROJECTS', 'PREMIERE PRO', `${path.basename(sourceDir)}.prproj`);
  
      // Define the destination file path with the new name
      const newAEFileName = `${newRootName}.aep`;
      const newPPFileName = `${newRootName}.prproj`;
      const destinationAEFilePath = path.join(destinationDir, '00_PROJECTS', 'AFTER EFFECTS', newAEFileName);
      const destinationPPFilePath = path.join(destinationDir, '00_PROJECTS', 'PREMIERE PRO', newPPFileName);
  
      // Rename the file
      await fs.rename(sourceAEFilePath, destinationAEFilePath);
      await fs.rename(sourcePPFilePath, destinationPPFilePath);
      console.log(`Renamed file to: ${destinationAEFilePath}`);
      console.log(`Renamed file to: ${destinationPPFilePath}`);
    } catch (error) {
      console.error('Error copying and renaming directory or file:', error);
    }

    // ---------- Rename After Effects and Premiere template projects ---------- //

  }

async function getDirectoryTree(pulseName, pulseId) {
  console.log('Fetching data for pulseId:', pulseId);
  const data = await fetchData(pulseId);

  // Check the structure of the data
  console.log('Fetched data:', data);
  console.log(data && data.data && data.data.items && data.data.items.length > 0);

  let msaValue = null;
  let projectIdValue = null;
  let statusValue = null;


  // Pull column data from Monday payload
  if (data && data.data && data.data.items && data.data.items.length > 0) {
      let columnValues = data.data.items[0].column_values;
      for (let column of columnValues) {
          console.log('Column:', column);
          if (column.column.title === "LucidLink Folder") {
              statusValue = column.value ? parseInt(JSON.parse(column.value)) : null;
              if (statusValue !== null && statusValue > 0) {
                  CREATED = true;
              }
          }
          if (column.column.title === "MSA") {
              msaValue = column.value ? JSON.parse(column.value) : null;
          }
          if (column.column.title === "Project ID") {
              projectIdValue = column.value ? JSON.parse(column.value) : null;
          }
      }
  }

  const baseDir = `${msaValue}_${pulseName}_${projectIdValue}`;
  console.log('Base Directory:', baseDir);

  return baseDir;
  }

  // Function to apply a green label to a folder
  function applyGreenLabelToFolder(folderPath) {
    const appleScriptCommand = `
      tell application "Finder"
        set theFolder to POSIX file "${folderPath}" as alias
        set label index of theFolder to 6 -- Green label
      end tell
    `;

    exec(`osascript -e '${appleScriptCommand}'`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error applying label: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`AppleScript Error: ${stderr}`);
        return;
      }
      console.log(`Green label applied to folder: ${folderPath}`);
    });
  }

  async function fetchData(pulseId) {

    let query = `query {
      items (ids: [${pulseId}]) {
        column_values {
          column {
            id
            title
          }
          id
          type
          value
        }
      }
    }`;

    console.log('Query:', query);

    try {
        let response = await fetch("https://api.monday.com/v2", {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'API KEY GOES HERE'
            },
            body: JSON.stringify({
                query: query
            })
        });

        let data = await response.json();
        console.log('Response data:', data);

        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  }


// Start the server

// Create an HTTP server that listens on port 80
const server = http.createServer(async(req, res) => {
    if (req.method === 'POST') {
      // Collect the data from the request
      let body = '';
  
      req.on('data', chunk => {
        body += chunk.toString(); // Convert Buffer to string
      });
  
      req.on('end', async () => {
        // Try to parse the body as JSON
        let parsedBody;
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          console.error('Invalid JSON received');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
  
        // Console log the parsed JSON 
        console.log('Received webhook payload:', parsedBody);
  
        // Check if there's a 'challenge' field in the JSON
        if (parsedBody.challenge) {
          // Respond with the challenge
          const response = {
            challenge: parsedBody.challenge,
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } else {
          // Extract 'pulseName' from the JSON payload
          console.log(parsedBody.event)
          const pulseName = parsedBody.event.pulseName;
          const pulseId = parsedBody.event.pulseId;
  
          if (!pulseName || !pulseId) {
            // If 'pulseName' is missing, respond with an error
            console.error('pulseName or pulseID is missing from the JSON payload');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'pulseName is required' }));
            return;
          }
  
          // Sanitize 'pulseName' to remove special characters but leave spaces
          const safePulseName = pulseName.replace(/[^a-zA-Z0-9 ]/g, '');
  
          try {
            // Get the base directory asynchronously
            const newRootName = await getDirectoryTree(safePulseName, pulseId);
  

            // Source Template Folder 
            const sourceDir = 'Source Template Folder Path Goes Here';

            if (!CREATED) {
              copyAndRenameDirectory(sourceDir, newRootName);
            } else {
              CREATED = false;
            }
  
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Directory structure created.\n');
          } catch (error) {
            console.error('Error creating directories:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error\n');
          }
        }
      });
    } else {
      // For other request methods, return a 405 Method Not Allowed
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed\n');
    }
  });
  
  // Start the server on port 80
  server.listen(80, () => {
    console.log('Server is listening on port 80');
  });