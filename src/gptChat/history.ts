export const history: {
  role: 'user' | 'assistant' | 'system';
  content: string;
}[] = [];

export const drop = () => {
  history.splice(0, history.length);
};

export const print = () => {
  return history
    .map((message, index) => {
      const escapedContent = message.content
        .replace(/\\/g, '\\\\')
        .replace(/\*/g, '\\*')
        .replace(/_/g, '\\_')
        .replace(/`/g, '\\`')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/#/g, '\\#')
        .replace(/\+/g, '\\+')
        .replace(/-/g, '\\-')
        .replace(/\./g, '\\.')
        .replace(/!/g, '\\!')
        .replace(/\|/g, '\\|')
        .replace(/>/g, '\\>')
        .replace(/</g, '\\<');
      return `*${message.role}:* ${escapedContent}`;
    })
    .join('\n');
};
