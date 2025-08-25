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
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

// Firebaseプロジェクトの設定をここに追加
const firebaseConfig = {
  apiKey: "AIzaSyBvHNVYiPDtm1K4hKjzFAEenjjPGj6836w",
  authDomain: "photoshare-566d9.firebaseapp.com",
  projectId: "photoshare-566d9",
  storageBucket: "photoshare-566d9.firebasestorage.app",
  messagingSenderId: "40141009873",
  appId: "1:40141009873:web:37d9638196fd3be9ff26f0"
};

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ユーザー認証コンポーネント
const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // ログイン処理
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("ログインしました！");
    } catch (error) {
      setMessage(`ログイン失敗: ${error.message}`);
      console.error(error);
    }
  };

  // 新規登録処理
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
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', width: '300px', backgroundColor: '#fff' }}>
      <h2 style={{color:"black"}}>ログイン / 新規登録</h2>
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
      />
      <input
        type="password"
        placeholder="パスワード（6文字以上）"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
      />
      <button onClick={handleLogin} style={{ margin: '5px' }}>ログイン</button>
      <button onClick={handleRegister} style={{ margin: '5px' }}>新規登録</button>
      {message && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
};

// 写真アップロードコンポーネント
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
      // 1. Firebase Storageに画像をアップロード
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Firestoreに投稿情報を保存
      await addDoc(collection(db, 'posts'), {
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
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' }}>
      <h2>新しい投稿</h2>
      <input type="file" onChange={handleFileChange} />
      <input
        type="text"
        placeholder="キャプションを入力"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{ display: 'block', margin: '10px 0' }}
      />
      <button onClick={handleUpload} disabled={isUploading}>
        {isUploading ? 'アップロード中...' : '投稿する'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

// 投稿フィードコンポーネント
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
      setPosts(fetchedPosts);
    });

    // クリーンアップ
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' }}>
      <h2>投稿フィード</h2>
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.id} style={{ border: '1px solid #eee', margin: '10px', padding: '10px', borderRadius: '8px' }}>
            <img
              src={post.imageUrl}
              alt={post.caption}
              style={{ width: '100%', maxWidth: '400px', height: 'auto', borderRadius: '4px' }}
            />
            <p style={{ textAlign: 'left', fontWeight: 'bold' }}>
              {/* FirebaseのUIDからユーザー名を取得する場合は別途実装が必要 */}
              {post.userId ? `User: ${post.userId.substring(0, 6)}...` : 'Unknown User'}
            </p>
            <p style={{ textAlign: 'left' }}>{post.caption}</p>
          </div>
        ))
      ) : (
        <p>まだ投稿がありません。</p>
      )}
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

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

export default App;
