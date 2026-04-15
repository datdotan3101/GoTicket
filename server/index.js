import "dotenv/config";
import { createServer } from "node:http";
import app from "./src/app.js";
import { initSocket } from "./src/config/socket.js";
import { startJobs } from "./jobs/index.js";

const port = Number(process.env.PORT || 5000);
const server = createServer(app);
initSocket(server);
startJobs();

server.listen(port, () => {
  console.log(`GoTicket backend listening on http://localhost:${port}`);
});
