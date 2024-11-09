export const history: { role: string; content: string }[] = [];

export const drop = () => {
  history.splice(0, history.length);
};

export const print = () => {
  return history
    .map((message, index) => {
      return `**${index + 1}. ${message.role}:** ${message.content}`;
    })
    .join('\n');
};
