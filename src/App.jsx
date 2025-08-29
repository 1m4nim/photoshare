import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithCustomToken,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';

// 外部から提供される可能性のあるFirebase設定を取得
const externalFirebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : null;

// ハードコードされたFirebaseの設定
const hardcodedFirebaseConfig = {
  apiKey: "AIzaSyBvHNVYiPDtm1K4hKjzFAEenjjPGj6836w",
  authDomain: "photoshare-566d9.firebaseapp.com",
  projectId: "photoshare-566d9",
  storageBucket: "photoshare-566d9.firebasestorage.app",
  messagingSenderId: "40141009873",
  appId: "1:40141009873:web:37d9638196fd3be9ff26f0",
  measurementId: "G-1XVX08BJ0D"
};

// 最終的に使用するFirebase設定を決定
const firebaseConfig = externalFirebaseConfig || hardcodedFirebaseConfig;

// Firebaseアプリを初期化
// 無効な設定の場合はエラーメッセージを表示
if (!firebaseConfig.apiKey) {
  throw new Error("Firebase config is invalid. Please check your project settings.");
}
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const initialAuthToken = typeof __initial_auth_token !== 'undefined'
  ? __initial_auth_token
  : null;

// ユーザー認証コンポーネント
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      setMessage("新規登録しました！");
    } catch (error) {
      setMessage(`登録失敗: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '24px', border: '1px solid #ccc', borderRadius: '12px', width: '100%', maxWidth: '384px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: '16px' }}>ログイン / 新規登録</h2>
      <input
        type="text"
        placeholder="表示名（新規登録時のみ）"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '16px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
      />
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '16px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
      />
      <input
        type="password"
        placeholder="パスワード（6文字以上）"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        style={{ width: '100%', padding: '8px', marginBottom: '16px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
      />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <button
          onClick={handleLogin}
          style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
        >
          ログイン
        </button>
        <button
          onClick={handleRegister}
          style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: '#fff', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
        >
          新規登録
        </button>
      </div>
      {message && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '16px', textAlign: 'center' }}>{message}</p>}
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
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        displayName: user.displayName || '匿名ユーザー',
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
    <div style={{ padding: '24px', border: '1px solid #ccc', borderRadius: '12px', marginTop: '24px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: '16px' }}>新しい投稿</h2>
      <input type="file" onChange={handleFileChange} style={{ width: '100%', marginBottom: '16px' }} />
      <input
        type="text"
        placeholder="キャプションを入力"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '16px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
      />
      <button
        onClick={handleUpload}
        disabled={isUploading}
        style={{ width: '100%', padding: '8px 16px', backgroundColor: '#1f2937', color: '#fff', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', opacity: isUploading ? 0.7 : 1 }}
      >
        {isUploading ? 'アップロード中...' : '投稿する'}
      </button>
      {message && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '16px', textAlign: 'center' }}>{message}</p>}
    </div>
  );
};

// 投稿フィードコンポーネント
const Feed = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // orderByを削除し、ローカルでソート
    const postsQuery = query(collection(db, 'posts'));
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      // 日付でソート
      fetchedPosts.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setPosts(fetchedPosts);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: '24px', border: '1px solid #ccc', borderRadius: '12px', marginTop: '24px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: '16px' }}>投稿フィード</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
              <img
                src={post.imageUrl}
                alt={post.caption}
                style={{ width: '100%', height: 'auto', objectFit: 'cover', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
              />
              <div style={{ padding: '16px' }}>
                <p style={{ color: '#1f2937', fontWeight: 'bold', marginBottom: '4px' }}>
                  {post.displayName || '匿名ユーザー'}
                </p>
                <p style={{ color: '#4b5563', fontSize: '14px' }}>{post.caption}</p>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center' }}>まだ投稿がありません。</p>
        )}
      </div>
    </div>
  );
};

// ログイン後のコンテンツを管理するコンポーネント
const MainContent = ({ user }) => {
  const handleLogout = async () => {
    await signOut(auth);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '768px', margin: '0 auto', padding: '32px', borderRadius: '16px', boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)', backgroundColor: '#1f2937', color: '#fff' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>ログイン中: <b style={{ color: '#60a5fa' }}>{user.displayName || user.email}</b></p>
        <button
          onClick={handleLogout}
          style={{ padding: '8px 24px', fontSize: '16px', fontWeight: '600', borderRadius: '9999px', border: 'none', backgroundColor: '#dc2626', color: '#fff', cursor: 'pointer', transition: 'background-color 0.2s' }}
        >
          ログアウト
        </button>
      </div>
      <hr style={{ margin: '24px 0', borderColor: '#4b5563' }} />
      <UploadPost user={user} />
      <hr style={{ margin: '24px 0', borderColor: '#4b5563' }} />
      <Feed />
    </div>
  );
};

// メインアプリケーションコンポーネント
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (initialAuthToken && !currentUser) {
        try {
          await signInWithCustomToken(auth, initialAuthToken);
        } catch (error) {
          console.error("Custom token sign-in failed:", error);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#111827',
      padding: '32px',
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px',
        backgroundColor: '#1f2937',
        borderRadius: '16px',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
        maxWidth: '768px',
        width: '100%',
      }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: '32px' }}>
          📸 Photo Share App
        </h1>
        {loading ? (
          <div style={{ color: '#fff', fontSize: '20px' }}>読み込み中...</div>
        ) : user ? (
          <MainContent user={user} />
        ) : (
          <Login />
        )}
      </div>
    </div>
  );
}

export default App;
