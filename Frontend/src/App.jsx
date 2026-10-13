import './App.css';
import Sidebar from './Sidebar.jsx';
import ChatWindow from './ChatWindow.jsx';
import { MyContext } from './MyContext.jsx';
import { useEffect, useState } from 'react';
import { v1 as uuidv1 } from 'uuid';
import Login from './login.jsx';
import { API_BASE_URL } from './config.js';

function App() {
  const [promt, setPromt] = useState('');
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(
    () => sessionStorage.getItem('activeThreadId') || uuidv1(),
  );
  const [prevChat, setPrevChat] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!sessionStorage.getItem('token'),
  );

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('token');

    if (!token) {
      setIsLoggedIn(false);
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
      }
    } else {
      setIsLoggedIn(true);
      if (window.location.pathname !== '/dashboard') {
        window.history.pushState({}, '', '/dashboard');
        setCurrentPath('/dashboard');
      }
    }
  }, [isLoggedIn]);

  // Restore current thread's messages on page refresh
  useEffect(() => {
    const savedThreadId = sessionStorage.getItem('activeThreadId');
    if (savedThreadId && isLoggedIn) {
      fetch(`${API_BASE_URL}/api/thread/${savedThreadId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Thread not found');
          return res.json();
        })
        .then((messages) => {
          if (Array.isArray(messages) && messages.length > 0) {
            setPrevChat(messages);
            setNewChat(false);
            setCurrThreadId(savedThreadId);
          }
        })
        .catch(() => {
          sessionStorage.removeItem('activeThreadId');
        });
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    window.history.pushState({}, '', '/dashboard');
    setCurrentPath('/dashboard');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const providerValues = {
    promt,
    setPromt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    prevChat,
    setPrevChat,
    newChat,
    setNewChat,
    allThreads,
    setAllThreads,
    theme,
    setTheme,
    isSidebarOpen,
    setIsSidebarOpen,
  };

  return (
    <MyContext.Provider value={providerValues}>
      {!isLoggedIn ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="app">
          <Sidebar />
          {isSidebarOpen && (
            <div
              className="sidebar-backdrop"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <ChatWindow />
        </div>
      )}
    </MyContext.Provider>
  );
}

export default App;
