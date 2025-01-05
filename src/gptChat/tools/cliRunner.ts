import { cli_summariseHistory } from './summariseHistory';

async function main() {
  let args = process.argv.slice(2); // Capture command-line arguments
  const functionName = args[0]; // The first argument is the function name
  args = args.slice(1); // The rest of the arguments are function arguments

  try {
    if (functionName === 'summariseHistory') {
      await cli_summariseHistory(args);
    } else {
      console.error(`Unknown function: ${functionName}`);
      console.error(`Usage: ts-node functions.ts <functionName>`);
    }
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
  }
}

main();
