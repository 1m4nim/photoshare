import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

// Firebase configuration. DO NOT EDIT.
// This is automatically provided by the Canvas environment.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Authentication UI component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Handle user login
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("ログインしました！");
    } catch (error) {
      setMessage(`ログイン失敗: ${error.message}`);
      console.error(error);
    }
  };

  // Handle user registration
  const handleRegister = async () => {
    try {
      if (password.length < 6) {
        setMessage("パスワードは6文字以上にする必要があります。");
        return;
      }
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("新規登録しました！");
    } catch (error) {
      setMessage(`登録失敗: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <h2>ログイン / 新規登録</h2>
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="パスワード（6文字以上）"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
      />
      <div className="button-group">
        <button onClick={handleLogin}>ログイン</button>
        <button onClick={handleRegister}>新規登録</button>
      </div>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

// Photo upload component
const UploadPost = ({ user }) => {
  const [imageFile, setImageFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!imageFile) {
      setMessage("ファイルを選択してください。");
      return;
    }
    if (!user) {
      setMessage("ログインしていません。");
      return;
    }

    setIsUploading(true);
    setMessage("アップロード中...");
    const storageRef = ref(storage, `images/${Date.now()}_${imageFile.name}`);

    try {
      // 1. Upload image to Firebase Storage
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Save post information to Firestore
      const postsCollection = collection(db, 'posts');
      await addDoc(postsCollection, {
        userId: user.uid,
        imageUrl: downloadURL,
        caption: caption,
        createdAt: serverTimestamp(),
      });

      setMessage('投稿が完了しました！');
      setCaption('');
      setImageFile(null);
    } catch (error) {
      setMessage(`アップロード失敗: ${error.message}`);
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>新しい投稿</h2>
      <input type="file" onChange={handleFileChange} />
      <input
        type="text"
        placeholder="キャプションを入力"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <button
        onClick={handleUpload}
        disabled={isUploading}
      >
        {isUploading ? 'アップロード中...' : '投稿する'}
      </button>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

// Post feed component
const Feed = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Get posts from Firestore in real-time
    // NOTE: This uses onSnapshot for real-time updates.
    const postsQuery = query(collection(db, 'posts'));
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort posts by creation time in memory
      fetchedPosts.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setPosts(fetchedPosts);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  return (
    <div className="feed-container">
      <h2>投稿フィード</h2>
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.id} className="post-card">
            <img
              src={post.imageUrl}
              alt={post.caption}
            />
            <p className="user-info">
              {post.userId ? `User: ${post.userId.substring(0, 6)}...` : 'Unknown User'}
            </p>
            <p className="caption">{post.caption}</p>
          </div>
        ))
      ) : (
        <p className="no-posts">まだ投稿がありません。</p>
      )}
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="app-container">
      <style>
        {`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: #222;
            color: #fff;
            margin: 0;
            padding: 0;
          }

          .app-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .main-content {
            background-color: #2e2e2e;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 900px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          h1 {
            color: #fff;
            text-align: center;
            font-size: 2rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }

          h2 {
            font-size: 1.5rem;
            font-weight: bold;
            color: #fff;
            margin-bottom: 1rem;
          }

          .user-info-container {
            background-color: #333;
            padding: 1rem;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .user-info-text {
            color: #fff;
          }

          .logout-button {
            background-color: #f44336;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }

          .logout-button:hover {
            background-color: #d32f2f;
          }

          .content-wrapper {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          @media (min-width: 768px) {
            .main-content {
              flex-direction: row;
              gap: 40px;
            }
            .content-wrapper {
              flex-direction: row;
            }
          }

          .login-container, .upload-container, .feed-container {
            background-color: #333;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 100%;
          }

          .login-container {
            max-width: 400px;
            margin: 0 auto;
            text-align: center;
          }

          .login-container h2 {
            color: #fff;
          }

          input[type="email"], input[type="password"], input[type="text"], input[type="file"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 8px;
            border: 1px solid #444;
            background-color: #555;
            color: #fff;
            box-sizing: border-box;
          }

          button {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }

          button:hover {
            background-color: #0056b3;
          }

          button:disabled {
            background-color: #555;
            cursor: not-allowed;
          }

          .button-group {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin-top: 10px;
          }

          .message, .no-posts {
            color: #f00;
            text-align: center;
            margin-top: 10px;
          }

          .upload-container {
            margin-bottom: 20px;
          }
          
          .feed-container {
            overflow-y: auto;
            max-height: 500px; /* Adjust height to fit the viewport */
          }

          .post-card {
            background-color: #444;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .post-card img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            margin-bottom: 10px;
          }

          .user-info {
            font-weight: bold;
            color: #ccc;
            margin-bottom: 5px;
          }

          .caption {
            color: #eee;
            margin: 0;
          }
        `}
      </style>
      <div className="main-content">
        <h1 className="title-container">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
            <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zM13 5.5v5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 2 10.5v-5A1.5 1.5 0 0 1 3.5 4h8A1.5 1.5 0 0 1 13 5.5zM12 5.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0v-5zM11 5.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0v-5zM10 5.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0v-5z"/>
          </svg>
          <span style={{ marginLeft: '10px' }}>Photo Share App</span>
        </h1>
        {user ? (
          <div className="content-wrapper">
            <div className="user-info-container">
              <p className="user-info-text">
                ログイン中: <b>{user.email}</b>
              </p>
              <button onClick={handleLogout} className="logout-button">
                ログアウト
              </button>
            </div>
            
            <div className="upload-section">
              <UploadPost user={user} />
            </div>

            <div className="feed-section">
              <Feed />
            </div>
          </div>
        ) : (
          <Login />
        )}
      </div>
    </div>
  );
}

export default App;
