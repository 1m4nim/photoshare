import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile // Firebase AuthからupdateProfileをインポート
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
import { format } from 'date-fns';

// Firebaseプロジェクトの設定をここに追加
const firebaseConfig = {
  apiKey: "AIzaSyBvHNVYiPDtm1K4hKjzFAEenjjPGj6836w",
  authDomain: "photoshare-566d9.firebaseapp.com",
  projectId: "photoshare-566d9",
  storageBucket: "photoshare-566d9.firebasestorage.app",
  messagingSenderId: "40141009873",
  appId: "1:40141009873:web:37d9638196fd3be9ff26f0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Authentication UI component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // 新しく追加
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // 登録成功後、ユーザープロフィールを更新
      await updateProfile(userCredential.user, { displayName });
      setMessage("新規登録しました！");
    } catch (error) {
      setMessage(`登録失敗: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', width: '300px', backgroundColor: '#fff' }}>
      <h2 style={{color:"black"}}>ログイン / 新規登録</h2>
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
        displayName: user.displayName || '匿名ユーザー', // 投稿者の名前を追加
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
    // Firestoreから投稿をリアルタイムで取得
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort posts by creation time in memory
      fetchedPosts.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setPosts(fetchedPosts);
    });

    // クリーンアップ
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
            <p style={{ textAlign: 'left', fontWeight: 'bold' }}>
              {/* FirebaseのUIDからユーザー名を取得する場合は別途実装が必要 */}
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

// ログイン後のコンテンツを管理するコンポーネント
const MainContent = ({ user }) => {
  const handleLogout = () => {
    signOut(auth);
  };
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#2e2e2e',
      padding: '40px',
      borderRadius: '12px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <p style={{ color: '#fff' }}>ログイン中: <b>{user.displayName || user.email}</b></p>
        <button onClick={handleLogout} style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          borderRadius: '5px',
          border: 'none',
          backgroundColor: '#f44336',
          color: 'white',
          fontWeight: 'bold'
        }}>
          ログアウト
        </button>
      </div>
      <hr style={{ margin: '20px 0', borderColor: '#444' }} />
      <UploadPost user={user} />
      <hr style={{ margin: '20px 0', borderColor: '#444' }} />
      <Feed />
    </div>
  );
};

// メインアプリケーションコンポーネント
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#222'
    }}>
      <h1 style={{ color: '#fff', textAlign: 'center' }}>📸 Photo Share App</h1>
      <div style={{ backgroundColor: '#2e2e2e', padding: '40px', borderRadius: '12px' }}>
        {user ? (
          <>
            <p style={{ color: '#fff' }}>ログイン中: <b>{user.email}</b></p>
            <button onClick={handleLogout} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', borderRadius: '5px', border: 'none', backgroundColor: '#f44336', color: 'white' }}>
              ログアウト
            </button>
            <hr style={{ margin: '20px 0', borderColor: '#444' }} />
            <UploadPost user={user} />
            <hr style={{ margin: '20px 0', borderColor: '#444' }} />
            <Feed />
          </>
        ) : (
          <Login setUser={setUser} />
        )}
      </div>
    </div>
  );
}

export default App;6