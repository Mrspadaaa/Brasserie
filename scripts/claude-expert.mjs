// Preferred Sol -> Claude expert entry point; uses the same native Pro bridge.
import { main } from './claude-frontend.mjs';
main(['--expert', ...process.argv.slice(2)]).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
