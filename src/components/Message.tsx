import ReactMarkdown from 'react-markdown';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export function Message({ role, content, createdAt }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
        ) : (
          <div className="text-sm [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0 [&_pre]:my-2 [&_pre]:rounded [&_pre]:bg-gray-200 [&_pre]:px-2 [&_pre]:py-1 [&_code]:rounded [&_code]:bg-gray-200 [&_code]:px-1">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        <p className={`mt-1 text-xs ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
          {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
