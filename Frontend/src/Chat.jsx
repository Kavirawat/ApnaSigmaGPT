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

  const safeChats = Array.isArray(prevChat) ? prevChat : [];

  return (
    <>
      {newChat && <h1>Start a New Chat!</h1>}
      <div className={`chats ${theme === 'dark' ? 'code-dark' : 'code-light'}`}>
        {safeChats.map((chat, idx) => {
          const isLast = idx === safeChats.length - 1;
          const isAssistant = chat.role === 'assistant';
          const isTyping = isLast && isAssistant && latestReply !== null;
          const contentToDisplay = isTyping ? latestReply : chat.content;

          return chat.role === 'user' ? (
            <div className="userDiv" key={idx}>
              <p className="userMessage">{chat.content}</p>
            </div>
          ) : (
            <div className="gptDiv" key={idx}>
              <div className="gptMessageContainer">
                <div className="gptMessage">
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {contentToDisplay}
                  </ReactMarkdown>
                </div>
                <button
                  className={`voiceBtn ${
                    isTyping
                      ? isTypingSpeaking
                        ? 'speakingActive'
                        : ''
                      : currentlySpeakingIdx === idx
                      ? 'speakingActive'
                      : ''
                  }`}
                  onClick={() =>
                    isTyping
                      ? handleSpeak(contentToDisplay, null, true)
                      : handleSpeak(contentToDisplay, idx)
                  }
                  title={
                    (isTyping && isTypingSpeaking) ||
                    (!isTyping && currentlySpeakingIdx === idx)
                      ? 'Stop narration'
                      : 'Listen to response'
                  }
                >
                  <i
                    className={
                      (isTyping && isTypingSpeaking) ||
                      (!isTyping && currentlySpeakingIdx === idx)
                        ? 'fa-solid fa-volume-high'
                        : 'fa-solid fa-volume-xmark'
                    }
                  ></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Chat;
