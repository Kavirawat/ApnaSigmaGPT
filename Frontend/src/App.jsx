import './App.css';
import Sidebar from './Sidebar.jsx';
import ChatWindow from './ChatWindow.jsx';
import { MyContext } from './MyContext.jsx';
import { useEffect, useState } from 'react';
import { v1 as uuidv1 } from 'uuid';
import Login from './login.jsx';

function App() {
  const [promt, setPromt] = useState('');
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
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
      if (window.location.pathname === '/') {
        window.history.pushState({}, '', '/dashboard');
        setCurrentPath('/dashboard');
      }
    }
  }, [isLoggedIn, currentPath]);

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
      {currentPath === '/' && !isLoggedIn && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {currentPath === '/dashboard' && isLoggedIn && (
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
