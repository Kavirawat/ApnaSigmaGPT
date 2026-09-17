import './Sidebar.css';
import { useContext, useEffect } from 'react';
import { MyContext } from './MyContext.jsx';
import { v1 as uuidv1 } from 'uuid';
import blackLogo from '../src/assets/blacklogo.png';

function Sidebar() {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || 'https://apnasigmagpt.onrender.com';

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
      const response = await fetch(`${baseUrl}/api/thread`);
      const res = await response.json();

      const filteredData = res.map((thread) => ({
        threadId: thread.threadId,
        title: thread.title,
      }));

      setAllThreads(filteredData);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getAllThreads();
  }, [currThreadId]);

  const createNewChat = () => {
    setNewChat(true);
    setPromt('');
    setReply(null);
    setCurrThreadId(uuidv1());
    setPrevChat([]);
    window.speechSynthesis?.cancel();
  };

  const changeThread = async (newThreadId) => {
    window.speechSynthesis?.cancel();
    setCurrThreadId(newThreadId);

    try {
      const response = await fetch(`${baseUrl}/api/thread/${newThreadId}`);
      const res = await response.json();

      setPrevChat(res);
      setNewChat(false);
      setReply(null);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteThread = async (threadId) => {
    try {
      const response = await fetch(`${baseUrl}/api/thread/${threadId}`, {
        method: 'DELETE',
      });
      await response.json();

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
