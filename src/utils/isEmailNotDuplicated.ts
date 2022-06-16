const isEmailNotDuplicated = (clients) => (
  clients.map(
    (client) => client.email,
  ).length === new Set(clients.map((client) => client.email)).size);

export default isEmailNotDuplicated;
