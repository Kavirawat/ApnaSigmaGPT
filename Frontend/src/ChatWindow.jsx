import { v1 as uuidv1 } from 'uuid';
import './ChatWindow.css';
import Chat from './Chat.jsx';
import { MyContext } from './MyContext.jsx';
import { useContext, useState } from 'react';
import { CircleLoader } from 'react-spinners';
import { API_BASE_URL } from './config.js';

function ChatWindow() {
  const savedUser = sessionStorage.getItem('user')
    ? JSON.parse(sessionStorage.getItem('user'))
    : null;
  const currentUserName = savedUser?.name || 'User';

  const {
    promt,
    setPromt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    setNewChat,
    setPrevChat,
    setAllThreads,
    theme,
    setTheme,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getReply = async () => {
    if (!promt.trim()) return;

    const userMessage = promt;
    setLoading(true);
    setNewChat(false);

    // Save active thread ID in session so it persists on refresh
    sessionStorage.setItem('activeThreadId', currThreadId);

    setPrevChat((prev) => [...prev, { role: 'user', content: userMessage }]);
    setPromt('');

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        threadId: currThreadId,
      }),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, options);
      const data = await response.json();

      if (!response.ok && data.error) {
        setPrevChat((prev) => [
          ...prev,
          { role: 'assistant', content: data.error },
        ]);
        setLoading(false);
        return;
      }

      if (data && data.Reply) {
        setReply(data.Reply);
        setPrevChat((prev) => [
          ...prev,
          { role: 'assistant', content: data.Reply },
        ]);
      }

      // Refresh sidebar threads list so new chat appears in sidebar
      try {
        const threadRes = await fetch(`${API_BASE_URL}/api/thread`);
        const threadsData = await threadRes.json();
        if (Array.isArray(threadsData)) {
          setAllThreads(
            threadsData.map((t) => ({ threadId: t.threadId, title: t.title })),
          );
        }
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.log(err);
      setPrevChat((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong!' },
      ]);
    }
    setLoading(false);
  };

  const handleProfileClick = () => {
    setIsOpen(!isOpen);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="chatWindow">
      <div className="navbar">
        <button
          className="menuToggleBtn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.3rem',
            margin: '0 0 0 1rem',
          }}
        >
          <i
            className={isSidebarOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'}
          ></i>
        </button>
        <span>
          SignGPT <i className="fa-solid fa-angle-down" />
        </span>

        <div className="userIconDiv" onClick={handleProfileClick}>
          <p>Hey, {currentUserName}</p>
          <span className="userIcon">
            <i className="fa-solid fa-user" />
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="dropDown">
          <div
            className="dropDownItems"
            onClick={toggleTheme}
            style={{ cursor: 'pointer' }}
          >
            <i
              className={
                theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'
              }
            ></i>
            {theme === 'dark' ? ' Light Mode' : ' Dark Mode'}
          </div>

          <div
            className="dropDownItems"
            onClick={() => window.open('https://github.com', '_blank')}
            style={{ cursor: 'pointer' }}
          >
            <i className="fa-solid fa-circle-info"></i> Help
          </div>
          <div
            className="dropDownItems"
            onClick={() => {
              sessionStorage.removeItem('token');
              sessionStorage.removeItem('user');
              window.history.pushState({}, '', '/');
              window.location.reload();
            }}
            style={{ cursor: 'pointer' }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Log Out
          </div>
        </div>
      )}

      <Chat />

      {loading && (
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '15px' }}
        >
          <CircleLoader color="#f90000" loading={loading} size={40} />
        </div>
      )}

      <div className="chatInput">
        <div className="inputBox">
          <input
            type="text"
            placeholder="Ask anything"
            value={promt}
            onChange={(e) => setPromt(e.target.value)}
            onKeyDown={(e) => (e.key === 'Enter' ? getReply() : '')}
          />

          <div id="submit" onClick={getReply}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>
        <p className="info">
          SigmaGPT is AI. By using it, you agree to our<span> Terms </span> &
          <span> Privacy Policy</span>. Chats may be reviewed and used to
          improve our AI models.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
