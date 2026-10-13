import './Sidebar.css';
import { useContext, useEffect } from 'react';
import { MyContext } from './MyContext.jsx';
import { v1 as uuidv1 } from 'uuid';
import blackLogo from '../src/assets/blacklogo.png';

import { API_BASE_URL, getAuthHeaders } from './config.js';

function Sidebar() {

  const {
    allThreads,
    setAllThreads,
    currThreadId,
    setNewChat,
    setPromt,
    setReply,
    setCurrThreadId,
    setPrevChat,
    isSidebarOpen,
  } = useContext(MyContext);

  const getAllThreads = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/thread`, {
        headers: { ...getAuthHeaders() },
      });
      if (!response.ok) return;
      const res = await response.json();

      if (Array.isArray(res)) {
        const filteredData = res.map((thread) => ({
          threadId: thread.threadId,
          title: thread.title,
        }));
        setAllThreads(filteredData);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getAllThreads();
  }, [currThreadId]);

  const createNewChat = () => {
    const newId = uuidv1();
    setNewChat(true);
    setPromt('');
    setReply(null);
    setCurrThreadId(newId);
    sessionStorage.removeItem('activeThreadId');
    setPrevChat([]);
    window.speechSynthesis?.cancel();
  };

  const changeThread = async (newThreadId) => {
    window.speechSynthesis?.cancel();
    setCurrThreadId(newThreadId);
    sessionStorage.setItem('activeThreadId', newThreadId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/thread/${newThreadId}`, {
        headers: { ...getAuthHeaders() },
      });
      if (!response.ok) {
        setPrevChat([]);
        setNewChat(true);
        return;
      }
      const res = await response.json();

      if (Array.isArray(res)) {
        setPrevChat(res);
        setNewChat(false);
        setReply(null);
      } else {
        setPrevChat([]);
        setNewChat(true);
      }
    } catch (err) {
      console.log(err);
      setPrevChat([]);
      setNewChat(true);
    }
  };

  const deleteThread = async (threadId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/thread/${threadId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Aap is history ko delete nahi kar sakte!');
        return;
      }

      setAllThreads((prev) =>
        prev.filter((thread) => thread.threadId !== threadId),
      );

      if (threadId === currThreadId) {
        createNewChat();
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <section className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <button onClick={createNewChat}>
        <img src={blackLogo} alt="GPT Logo" className="logo" />
        <span>
          <i className="fa-solid fa-pen-to-square" />
        </span>
      </button>

      <ul className="history">
        {allThreads?.map((thread, idx) => (
          <li
            key={idx}
            onClick={(e) => changeThread(thread.threadId)}
            className={thread.threadId === currThreadId ? 'highlighted' : ' '}
          >
            {thread.title}
            <i
              className="fa-solid fa-trash"
              onClick={(e) => {
                e.stopPropagation();
                deleteThread(thread.threadId);
              }}
            ></i>
          </li>
        ))}
      </ul>

      <div className="sign">
        <p>By: @Kavi Rawat &#x2764;&#xfe0f;</p>
      </div>
    </section>
  );
}

export default Sidebar;
