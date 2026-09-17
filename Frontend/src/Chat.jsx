import './Chat.css';
import { useContext, useEffect, useState } from 'react';
import { MyContext } from './MyContext.jsx';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

function Chat() {
  const { newChat, prevChat, reply, theme } = useContext(MyContext);
  const [latestReply, setLatestReply] = useState(null);

  const [currentlySpeakingIdx, setCurrentlySpeakingIdx] = useState(null);
  const [isTypingSpeaking, setIsTypingSpeaking] = useState(false);

  useEffect(() => {
    if (reply === null) {
      setLatestReply(null);
      return;
    }
    if (!prevChat?.length || !reply) return;

    const content = reply.split(' ');
    let idx = 0;
    const interval = setInterval(() => {
      setLatestReply(content.slice(0, idx + 1).join(' '));
      idx++;
      if (idx >= content.length) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [prevChat, reply]);

  const handleSpeak = (text, idx, isLatest = false) => {
    if (
      (isLatest && isTypingSpeaking) ||
      (!isLatest && currentlySpeakingIdx === idx)
    ) {
      setTimeout(() => {
        window.speechSynthesis.cancel();
      }, 0);

      setCurrentlySpeakingIdx(null);
      setIsTypingSpeaking(false);
      return;
    }

    setTimeout(() => {
      window.speechSynthesis.cancel();
    }, 0);

    const cleanText = text.replace(/[*#`_\-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'hi-IN';

    utterance.onend = () => {
      setCurrentlySpeakingIdx(null);
      setIsTypingSpeaking(false);
    };
    utterance.onerror = () => {
      setCurrentlySpeakingIdx(null);
      setIsTypingSpeaking(false);
    };

    if (isLatest) {
      setIsTypingSpeaking(true);
      setCurrentlySpeakingIdx(null);
    } else {
      setCurrentlySpeakingIdx(idx);
      setIsTypingSpeaking(false);
    }

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingIdx(null);
      setIsTypingSpeaking(false);
    };
  }, [prevChat]);

  return (
    <>
      {newChat && <h1>Start a New Chat!</h1>}
      <div className={`chats ${theme === 'dark' ? 'code-dark' : 'code-light'}`}>
        {prevChat?.slice(0, -1).map((chat, idx) => (
          <div
            className={chat.role === 'user' ? 'userDiv' : 'gptDiv'}
            key={idx}
          >
            {chat.role === 'user' ? (
              <p className="userMessage">{chat.content}</p>
            ) : (
              <div className="gptMessageContainer">
                <div className="gptMessage">
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {chat.content}
                  </ReactMarkdown>
                </div>
                <button
                  className={`voiceBtn ${currentlySpeakingIdx === idx ? 'speakingActive' : ''}`}
                  onClick={() => handleSpeak(chat.content, idx)}
                  title={
                    currentlySpeakingIdx === idx
                      ? 'Stop narration'
                      : 'Listen to response'
                  }
                >
                  <i
                    className={
                      currentlySpeakingIdx === idx
                        ? 'fa-solid fa-volume-high'
                        : 'fa-solid fa-volume-xmark'
                    }
                  ></i>
                </button>
              </div>
            )}
          </div>
        ))}

        {prevChat.length > 0 && (
          <>
            {latestReply === null ? (
              <div className="gptDiv" key={'non-typing'}>
                <div className="gptMessageContainer">
                  <div className="gptMessage">
                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                      {prevChat[prevChat.length - 1].content}
                    </ReactMarkdown>
                  </div>
                  <button
                    className={`voiceBtn ${currentlySpeakingIdx === 'last' ? 'speakingActive' : ''}`}
                    onClick={() =>
                      handleSpeak(prevChat[prevChat.length - 1].content, 'last')
                    }
                    title={
                      currentlySpeakingIdx === 'last'
                        ? 'Stop narration'
                        : 'Listen to response'
                    }
                  >
                    <i
                      className={
                        currentlySpeakingIdx === 'last'
                          ? 'fa-solid fa-volume-high'
                          : 'fa-solid fa-volume-xmark'
                      }
                    ></i>
                  </button>
                </div>
              </div>
            ) : (
              <div className="gptDiv" key={'typing'}>
                <div className="gptMessageContainer">
                  <div className="gptMessage">
                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                      {latestReply}
                    </ReactMarkdown>
                  </div>
                  <button
                    className={`voiceBtn ${isTypingSpeaking ? 'speakingActive' : ''}`}
                    onClick={() => handleSpeak(latestReply, null, true)}
                    title={
                      isTypingSpeaking ? 'Stop narration' : 'Listen to response'
                    }
                  >
                    <i
                      className={
                        isTypingSpeaking
                          ? 'fa-solid fa-volume-high'
                          : 'fa-solid fa-volume-xmark'
                      }
                    ></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Chat;
